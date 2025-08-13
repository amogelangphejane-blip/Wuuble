import { supabase } from '@/integrations/supabase/client';
import {
  ChatChannel,
  ChatChannelWithDetails,
  ChatMessage,
  ChatMessageWithDetails,
  MessageReaction,
  MessageMention,
  MessageAttachment,
  MessageReadStatus,
  TypingIndicator,
  MessageSearchFilters,
  MessageSearchResult,
  SendMessageResponse,
  CreateChannelResponse,
  ChatEvent,
  MessageMetadata,
  RealtimeSubscription
} from '@/types/chat';
import type { RealtimeChannel } from '@supabase/supabase-js';

class ChatService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private eventListeners: Map<string, Array<(event: ChatEvent) => void>> = new Map();

  // Channel Management
  async getChannelsForCommunity(communityId: string): Promise<ChatChannelWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('chat_channels')
        .select(`
          *,
          members:chat_channel_members(
            id,
            user_id,
            role,
            joined_at,
            last_read_at,
            notification_settings,
            user:profiles(user_id, username, display_name, avatar_url)
          ),
          community:communities(id, name, avatar_url)
        `)
        .eq('community_id', communityId)
        .eq('is_archived', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get unread counts for each channel
      const channelsWithUnread = await Promise.all(
        (data || []).map(async (channel) => {
          const unreadCount = await this.getUnreadCount(channel.id);
          return {
            ...channel,
            unread_count: unreadCount
          };
        })
      );

      return channelsWithUnread;
    } catch (error) {
      console.error('Error fetching channels:', error);
      throw error;
    }
  }

  async createChannel(
    communityId: string,
    name: string,
    description?: string,
    isPrivate = false
  ): Promise<CreateChannelResponse> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: channel, error } = await supabase
        .from('chat_channels')
        .insert({
          community_id: communityId,
          name,
          description,
          is_private: isPrivate,
          created_by: user.user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner
      await supabase
        .from('chat_channel_members')
        .insert({
          channel_id: channel.id,
          user_id: user.user.id,
          role: 'owner'
        });

      return {
        channel: channel as ChatChannelWithDetails,
        success: true
      };
    } catch (error) {
      console.error('Error creating channel:', error);
      return {
        channel: {} as ChatChannelWithDetails,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async joinChannel(channelId: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('chat_channel_members')
        .insert({
          channel_id: channelId,
          user_id: user.user.id,
          role: 'member'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error joining channel:', error);
      return false;
    }
  }

  async leaveChannel(channelId: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('chat_channel_members')
        .delete()
        .eq('channel_id', channelId)
        .eq('user_id', user.user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error leaving channel:', error);
      return false;
    }
  }

  // Message Management
  async getMessages(
    channelId: string,
    limit = 50,
    offset = 0,
    threadRootId?: string
  ): Promise<ChatMessageWithDetails[]> {
    try {
      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          user:profiles(user_id, username, display_name, avatar_url),
          reactions:message_reactions(
            id,
            emoji,
            created_at,
            user:profiles(user_id, username, display_name, avatar_url)
          ),
          mentions:message_mentions(
            id,
            mentioned_user_id,
            mention_type,
            is_read
          ),
          attachments:message_attachments(*)
        `)
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (threadRootId) {
        query = query.eq('thread_root_id', threadRootId);
      } else {
        query = query.is('parent_message_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).reverse();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async sendMessage(
    channelId: string,
    content: string,
    metadata?: MessageMetadata,
    parentMessageId?: string,
    threadRootId?: string,
    attachments?: File[]
  ): Promise<SendMessageResponse> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // First, upload any attachments
      const uploadedAttachments: MessageAttachment[] = [];
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const attachment = await this.uploadAttachment(file);
          if (attachment) uploadedAttachments.push(attachment);
        }
      }

      // Insert the message
      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: channelId,
          user_id: user.user.id,
          content,
          metadata: metadata || {},
          parent_message_id: parentMessageId,
          thread_root_id: threadRootId || parentMessageId
        })
        .select(`
          *,
          user:profiles(user_id, username, display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Link attachments to message
      if (uploadedAttachments.length > 0) {
        await supabase
          .from('message_attachments')
          .update({ message_id: message.id })
          .in('id', uploadedAttachments.map(a => a.id));
      }

      // Process mentions if any
      if (metadata?.mentions) {
        await this.processMentions(message.id, metadata.mentions);
      }

      const messageWithDetails: ChatMessageWithDetails = {
        ...message,
        reactions: [],
        mentions: [],
        attachments: uploadedAttachments,
        replies: []
      };

      return {
        message: messageWithDetails,
        success: true
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        message: {} as ChatMessageWithDetails,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async editMessage(messageId: string, content: string, metadata?: MessageMetadata): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('chat_messages')
        .update({
          content,
          metadata: metadata || {},
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('user_id', user.user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error editing message:', error);
      return false;
    }
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('chat_messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('user_id', user.user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  // Reactions
  async addReaction(messageId: string, emoji: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.user.id,
          emoji
        });

      if (error && !error.message.includes('duplicate')) throw error;
      return true;
    } catch (error) {
      console.error('Error adding reaction:', error);
      return false;
    }
  }

  async removeReaction(messageId: string, emoji: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.user.id)
        .eq('emoji', emoji);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing reaction:', error);
      return false;
    }
  }

  // File Attachments
  private async uploadAttachment(file: File): Promise<MessageAttachment | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `chat-attachments/${user.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      // Create attachment record
      const { data: attachment, error } = await supabase
        .from('message_attachments')
        .insert({
          message_id: '', // Will be updated later
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_url: publicUrl,
          storage_path: filePath,
          uploaded_by: user.user.id,
          metadata: {
            original_name: file.name
          }
        })
        .select()
        .single();

      if (error) throw error;
      return attachment;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return null;
    }
  }

  // Mentions
  private async processMentions(
    messageId: string,
    mentions: Array<{ userId: string; username: string; start: number; end: number }>
  ): Promise<void> {
    try {
      const mentionRecords = mentions.map(mention => ({
        message_id: messageId,
        mentioned_user_id: mention.userId,
        mention_type: 'user' as const
      }));

      await supabase
        .from('message_mentions')
        .insert(mentionRecords);
    } catch (error) {
      console.error('Error processing mentions:', error);
    }
  }

  // Read Status
  async markChannelAsRead(channelId: string, lastMessageId?: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('message_read_status')
        .upsert({
          channel_id: channelId,
          user_id: user.user.id,
          last_read_message_id: lastMessageId,
          last_read_at: new Date().toISOString(),
          unread_count: 0,
          unread_mentions_count: 0
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking channel as read:', error);
      return false;
    }
  }

  async getUnreadCount(channelId: string): Promise<number> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return 0;

      const { data, error } = await supabase
        .from('message_read_status')
        .select('unread_count')
        .eq('channel_id', channelId)
        .eq('user_id', user.user.id)
        .single();

      if (error) return 0;
      return data?.unread_count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Typing Indicators
  async startTyping(channelId: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase
        .from('typing_indicators')
        .upsert({
          channel_id: channelId,
          user_id: user.user.id,
          started_typing_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10000).toISOString() // 10 seconds
        });
    } catch (error) {
      console.error('Error starting typing:', error);
    }
  }

  async stopTyping(channelId: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase
        .from('typing_indicators')
        .delete()
        .eq('channel_id', channelId)
        .eq('user_id', user.user.id);
    } catch (error) {
      console.error('Error stopping typing:', error);
    }
  }

  // Search
  async searchMessages(filters: MessageSearchFilters): Promise<MessageSearchResult> {
    try {
      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          user:profiles(user_id, username, display_name, avatar_url),
          channel:chat_channels(id, name, community_id)
        `, { count: 'exact' })
        .eq('is_deleted', false);

      if (filters.query) {
        query = query.textSearch('content', filters.query);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.message_type) {
        query = query.eq('message_type', filters.message_type);
      }
      if (filters.channel_id) {
        query = query.eq('channel_id', filters.channel_id);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return {
        messages: data || [],
        total_count: count || 0,
        has_more: (count || 0) > 50
      };
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  // Real-time subscriptions
  subscribeToChannel(channelId: string, callback: (event: ChatEvent) => void): () => void {
    const channel = supabase
      .channel(`chat-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          callback({
            type: 'message',
            channel_id: channelId,
            data: payload.new,
            timestamp: new Date().toISOString()
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions'
        },
        (payload) => {
          callback({
            type: 'reaction',
            channel_id: channelId,
            data: payload.new,
            timestamp: new Date().toISOString()
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          callback({
            type: 'typing',
            channel_id: channelId,
            data: payload.new || payload.old,
            timestamp: new Date().toISOString()
          });
        }
      )
      .subscribe();

    this.subscriptions.set(channelId, {
      channel_id: channelId,
      subscription: channel,
      active: true
    });

    return () => {
      channel.unsubscribe();
      this.subscriptions.delete(channelId);
    };
  }

  unsubscribeFromChannel(channelId: string): void {
    const subscription = this.subscriptions.get(channelId);
    if (subscription) {
      subscription.subscription.unsubscribe();
      this.subscriptions.delete(channelId);
    }
  }

  unsubscribeFromAll(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }
}

export const chatService = new ChatService();
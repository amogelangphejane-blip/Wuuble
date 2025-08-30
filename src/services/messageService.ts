import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Conversation = Tables<"conversations">;
export type Message = Tables<"messages">;
export type ConversationInsert = TablesInsert<"conversations">;
export type MessageInsert = TablesInsert<"messages">;
export type MessageUpdate = TablesUpdate<"messages">;

// Extended types for UI
export interface ConversationWithParticipant extends Conversation {
  participant: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

class MessageService {
  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<ConversationWithParticipant[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get conversations where user is a participant
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    if (!conversations || conversations.length === 0) return [];

    // Get all participant IDs (excluding current user)
    const participantIds = conversations.map(conv => 
      conv.participant_1_id === user.id ? conv.participant_2_id : conv.participant_1_id
    );

    // Get all participant profiles in one query
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, avatar_url')
      .in('user_id', participantIds);

    if (profileError) throw profileError;

    // Create profile map for quick lookup
    const profileMap = new Map();
    (profiles || []).forEach(profile => {
      profileMap.set(profile.user_id, profile);
    });

    // Get last messages for all conversations
    const conversationIds = conversations.map(c => c.id);
    const { data: allMessages, error: messageError } = await supabase
      .from('messages')
      .select('conversation_id, content, created_at, sender_id, is_read')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    if (messageError) throw messageError;

    // Group messages by conversation and get last message + unread count
    const messagesByConversation = new Map();
    (allMessages || []).forEach(msg => {
      if (!messagesByConversation.has(msg.conversation_id)) {
        messagesByConversation.set(msg.conversation_id, []);
      }
      messagesByConversation.get(msg.conversation_id).push(msg);
    });

    // Process conversations
    return conversations.map(conversation => {
      const otherParticipantId = conversation.participant_1_id === user.id 
        ? conversation.participant_2_id 
        : conversation.participant_1_id;

      const profile = profileMap.get(otherParticipantId);
      const messages = messagesByConversation.get(conversation.id) || [];
      const lastMessage = messages.length > 0 ? messages[0] : null; // First message is most recent due to DESC order
      
      // Count unread messages for current user
      const unreadCount = messages.filter(
        msg => !msg.is_read && msg.sender_id !== user.id
      ).length;

      return {
        ...conversation,
        participant: {
          id: otherParticipantId,
          display_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
        },
        last_message: lastMessage ? {
          content: lastMessage.content,
          created_at: lastMessage.created_at,
          sender_id: lastMessage.sender_id,
        } : undefined,
        unread_count: unreadCount,
      };
    });
  }

  /**
   * Get messages for a specific conversation
   */
  async getMessages(conversationId: string): Promise<MessageWithSender[]> {
    // First get messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!messages || messages.length === 0) return [];

    // Get unique sender IDs
    const senderIds = [...new Set(messages.map(m => m.sender_id))];
    
    // Get sender profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, avatar_url')
      .in('user_id', senderIds);

    if (profileError) throw profileError;

    // Create a map for quick profile lookup
    const profileMap = new Map();
    (profiles || []).forEach(profile => {
      profileMap.set(profile.user_id, profile);
    });

    // Combine messages with sender info
    return messages.map(message => ({
      ...message,
      sender: {
        id: message.sender_id,
        display_name: profileMap.get(message.sender_id)?.display_name || null,
        avatar_url: profileMap.get(message.sender_id)?.avatar_url || null,
      },
    })) as MessageWithSender[];
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const messageData: MessageInsert = {
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
    };

    const { data: message, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) throw error;
    return message;
  }

  /**
   * Get or create a conversation between two users
   */
  async getOrCreateConversation(otherUserId: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    if (user.id === otherUserId) {
      throw new Error('Cannot create conversation with yourself');
    }

    try {
      // Use the database function to get or create conversation
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user.id,
        user2_id: otherUserId,
      });

      if (error) {
        // Enhanced error handling for specific cases
        if (error.message.includes('row-level security')) {
          throw new Error('Permission denied: Unable to create conversation. Please ensure you have the necessary permissions.');
        } else if (error.message.includes('foreign key constraint')) {
          throw new Error('Invalid user: The user you are trying to message may not exist.');
        } else if (error.message.includes('User 1 does not exist') || error.message.includes('User 2 does not exist')) {
          throw new Error('User not found: The user you are trying to message does not exist.');
        } else if (error.message.includes('Cannot create conversation with yourself')) {
          throw new Error('Invalid operation: You cannot create a conversation with yourself.');
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id) // Don't mark own messages as read
      .eq('is_read', false);

    if (error) throw error;
  }

  /**
   * Subscribe to new messages in a conversation
   */
  subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    const subscription = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  /**
   * Subscribe to conversation updates (for real-time conversation list updates)
   */
  subscribeToConversations(callback: () => void) {
    const subscription = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  /**
   * Search for users to start a conversation with
   */
  async searchUsers(query: string): Promise<Array<{
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  }>> {
    if (!query.trim()) return [];

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, avatar_url')
      .or(`display_name.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;

    return (profiles || []).map(profile => ({
      id: profile.user_id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
    }));
  }
}

export const messageService = new MessageService();
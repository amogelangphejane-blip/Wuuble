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

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (
          content,
          created_at,
          sender_id,
          is_read
        )
      `)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    // Process conversations to get participant info and last message
    const processedConversations: ConversationWithParticipant[] = [];

    for (const conversation of conversations || []) {
      // Determine the other participant
      const otherParticipantId = conversation.participant_1_id === user.id 
        ? conversation.participant_2_id 
        : conversation.participant_1_id;

      // Get participant profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, user_id')
        .eq('user_id', otherParticipantId)
        .single();

      // Get last message
      const messages = conversation.messages as any[];
      const lastMessage = messages && messages.length > 0 
        ? messages[messages.length - 1] 
        : null;

      // Count unread messages for current user
      const unreadCount = messages?.filter(
        msg => !msg.is_read && msg.sender_id !== user.id
      ).length || 0;

      processedConversations.push({
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
      });
    }

    return processedConversations;
  }

  /**
   * Get messages for a specific conversation
   */
  async getMessages(conversationId: string): Promise<MessageWithSender[]> {
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey (
          id,
          display_name,
          avatar_url,
          user_id
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (messages || []).map(message => ({
      ...message,
      sender: {
        id: message.sender.user_id,
        display_name: message.sender.display_name,
        avatar_url: message.sender.avatar_url,
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

    // Use the database function to get or create conversation
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      user1_id: user.id,
      user2_id: otherUserId,
    });

    if (error) throw error;
    return data;
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
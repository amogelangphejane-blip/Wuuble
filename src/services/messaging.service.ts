import { supabase } from '@/integrations/supabase/client';
import type { 
  User, 
  Conversation, 
  Message, 
  ConversationWithDetails,
  MessageWithSender,
  ConversationsResponse,
  MessagesResponse,
  UserSearchResponse,
  PaginationParams,
  MessageSearchParams,
  TypingIndicator,
  MessageReaction,
  MessagingError
} from '@/types/messaging';

class MessagingService {
  private readonly PAGE_SIZE = 20;
  private typingTimeouts = new Map<string, NodeJS.Timeout>();

  // ============================================================================
  // CONVERSATIONS
  // ============================================================================

  async getConversations(
    params: PaginationParams = {}
  ): Promise<ConversationsResponse> {
    try {
      const { limit = this.PAGE_SIZE, offset = 0 } = params;
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user?.id) {
        throw this.createError('AUTH_REQUIRED', 'User authentication required', true);
      }

      const userId = user.user.id;

      // Get conversations with participants and last messages
      const { data: conversations, error, count } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          updated_at,
          last_message_at,
          is_group,
          name,
          description,
          avatar_url,
          created_by,
          conversation_participants!inner (
            id,
            conversation_id,
            user_id,
            joined_at,
            is_admin,
            is_muted,
            last_read_at,
            profiles (
              id,
              email,
              display_name,
              avatar_url
            )
          ),
          messages (
            id,
            content,
            message_type,
            sender_id,
            is_deleted,
            created_at,
            profiles (
              id,
              display_name,
              avatar_url
            )
          )
        `)
        .eq('conversation_participants.user_id', userId)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw this.createError('FETCH_CONVERSATIONS_ERROR', error.message, true);
      }

      const processedConversations = await Promise.all(
        (conversations || []).map(async (conv: any) => {
          return await this.processConversation(conv, userId);
        })
      );

      return {
        conversations: processedConversations,
        total: count || 0,
        has_more: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw this.handleError(error);
    }
  }

  async getConversation(conversationId: string): Promise<ConversationWithDetails | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user?.id) {
        throw this.createError('AUTH_REQUIRED', 'User authentication required', true);
      }

      const userId = user.user.id;

      const { data: conversation, error } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          updated_at,
          last_message_at,
          is_group,
          name,
          description,
          avatar_url,
          created_by,
          conversation_participants (
            id,
            conversation_id,
            user_id,
            joined_at,
            is_admin,
            is_muted,
            last_read_at,
            profiles (
              id,
              email,
              display_name,
              avatar_url
            )
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) {
        throw this.createError('FETCH_CONVERSATION_ERROR', error.message, true);
      }

      if (!conversation) {
        return null;
      }

      // Check if user is a participant
      const isParticipant = conversation.conversation_participants.some(
        (p: any) => p.user_id === userId
      );

      if (!isParticipant) {
        throw this.createError('ACCESS_DENIED', 'You are not a participant in this conversation', false);
      }

      return await this.processConversation(conversation, userId);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw this.handleError(error);
    }
  }

  async createConversation(
    participantUserIds: string[], 
    isGroup: boolean = false, 
    name?: string
  ): Promise<ConversationWithDetails> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user?.id) {
        throw this.createError('AUTH_REQUIRED', 'User authentication required', true);
      }

      const currentUserId = user.user.id;
      
      // For 1-on-1 conversations, check if one already exists
      if (!isGroup && participantUserIds.length === 1) {
        const existingConv = await this.findExistingDirectConversation(
          currentUserId, 
          participantUserIds[0]
        );
        if (existingConv) {
          return existingConv;
        }
      }

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          is_group: isGroup,
          name: isGroup ? name : null,
          created_by: currentUserId,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (convError) {
        throw this.createError('CREATE_CONVERSATION_ERROR', convError.message, true);
      }

      // Add participants (including current user)
      const allParticipants = [currentUserId, ...participantUserIds];
      const participantsData = allParticipants.map((userId, index) => ({
        conversation_id: conversation.id,
        user_id: userId,
        is_admin: userId === currentUserId,
        joined_at: new Date().toISOString()
      }));

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participantsData);

      if (participantsError) {
        // Cleanup conversation if participants insert fails
        await supabase.from('conversations').delete().eq('id', conversation.id);
        throw this.createError('ADD_PARTICIPANTS_ERROR', participantsError.message, true);
      }

      // Return the full conversation
      return await this.getConversation(conversation.id) as ConversationWithDetails;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // MESSAGES
  // ============================================================================

  async getMessages(
    conversationId: string,
    params: PaginationParams = {}
  ): Promise<MessagesResponse> {
    try {
      const { limit = this.PAGE_SIZE, offset = 0 } = params;
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user?.id) {
        throw this.createError('AUTH_REQUIRED', 'User authentication required', true);
      }

      // Verify user is participant
      await this.verifyParticipant(conversationId, user.user.id);

      const { data: messages, error, count } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          reply_to,
          is_edited,
          is_deleted,
          created_at,
          updated_at,
          profiles (
            id,
            display_name,
            avatar_url
          ),
          reply_to_message:messages!reply_to (
            id,
            content,
            sender_id,
            created_at,
            profiles (
              id,
              display_name,
              avatar_url
            )
          )
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw this.createError('FETCH_MESSAGES_ERROR', error.message, true);
      }

      const processedMessages = (messages || [])
        .reverse() // Order chronologically for UI
        .map(this.processMessage);

      return {
        messages: processedMessages,
        total: count || 0,
        has_more: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw this.handleError(error);
    }
  }

  async sendMessage(
    conversationId: string,
    content: string,
    messageType: Message['message_type'] = 'text',
    replyTo?: string
  ): Promise<MessageWithSender> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user?.id) {
        throw this.createError('AUTH_REQUIRED', 'User authentication required', true);
      }

      const senderId = user.user.id;

      // Verify user is participant
      await this.verifyParticipant(conversationId, senderId);

      // Validate content
      if (!content.trim()) {
        throw this.createError('INVALID_CONTENT', 'Message content cannot be empty', false);
      }

      if (content.length > 2000) {
        throw this.createError('CONTENT_TOO_LONG', 'Message content exceeds maximum length', false);
      }

      // Send message
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: content.trim(),
          message_type: messageType,
          reply_to: replyTo || null
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          reply_to,
          is_edited,
          is_deleted,
          created_at,
          updated_at,
          profiles (
            id,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        throw this.createError('SEND_MESSAGE_ERROR', error.message, true);
      }

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return this.processMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
      throw this.handleError(error);
    }
  }

  async editMessage(messageId: string, content: string): Promise<MessageWithSender> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user?.id) {
        throw this.createError('AUTH_REQUIRED', 'User authentication required', true);
      }

      const userId = user.user.id;

      // Validate content
      if (!content.trim()) {
        throw this.createError('INVALID_CONTENT', 'Message content cannot be empty', false);
      }

      // Update message
      const { data: message, error } = await supabase
        .from('messages')
        .update({
          content: content.trim(),
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', userId) // Only allow editing own messages
        .eq('is_deleted', false)
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          reply_to,
          is_edited,
          is_deleted,
          created_at,
          updated_at,
          profiles (
            id,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        throw this.createError('EDIT_MESSAGE_ERROR', error.message, true);
      }

      if (!message) {
        throw this.createError('MESSAGE_NOT_FOUND', 'Message not found or access denied', false);
      }

      return this.processMessage(message);
    } catch (error) {
      console.error('Error editing message:', error);
      throw this.handleError(error);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user?.id) {
        throw this.createError('AUTH_REQUIRED', 'User authentication required', true);
      }

      const userId = user.user.id;

      const { error } = await supabase
        .from('messages')
        .update({
          is_deleted: true,
          content: '[This message was deleted]',
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', userId);

      if (error) {
        throw this.createError('DELETE_MESSAGE_ERROR', error.message, true);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // USER SEARCH
  // ============================================================================

  async searchUsers(query: string, params: PaginationParams = {}): Promise<UserSearchResponse> {
    try {
      const { limit = this.PAGE_SIZE, offset = 0 } = params;
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user?.id) {
        throw this.createError('AUTH_REQUIRED', 'User authentication required', true);
      }

      const currentUserId = user.user.id;

      if (!query.trim()) {
        return { users: [], total: 0, has_more: false };
      }

      const { data: users, error, count } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url, created_at, updated_at')
        .neq('id', currentUserId)
        .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('display_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        throw this.createError('SEARCH_USERS_ERROR', error.message, true);
      }

      return {
        users: users || [],
        total: count || 0,
        has_more: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('Error searching users:', error);
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  subscribeToConversations(
    userId: string,
    onConversationUpdate: (event: any) => void
  ) {
    return supabase
      .channel(`conversations:${userId}`)
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `id=in.(SELECT conversation_id FROM conversation_participants WHERE user_id = ${userId})`
        },
        onConversationUpdate
      )
      .subscribe();
  }

  subscribeToMessages(
    conversationId: string,
    onMessageUpdate: (event: any) => void
  ) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        onMessageUpdate
      )
      .subscribe();
  }

  subscribeToTyping(
    conversationId: string,
    onTypingUpdate: (event: any) => void
  ) {
    return supabase
      .channel(`typing:${conversationId}`)
      .on('presence', { event: 'sync' }, onTypingUpdate)
      .on('presence', { event: 'join' }, onTypingUpdate)
      .on('presence', { event: 'leave' }, onTypingUpdate)
      .subscribe();
  }

  // ============================================================================
  // TYPING INDICATORS
  // ============================================================================

  async startTyping(conversationId: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) return;

      const channel = supabase.channel(`typing:${conversationId}`);
      await channel.track({
        user_id: user.user.id,
        typing: true,
        timestamp: Date.now()
      });

      // Auto-stop typing after 3 seconds
      const timeoutKey = `${conversationId}:${user.user.id}`;
      if (this.typingTimeouts.has(timeoutKey)) {
        clearTimeout(this.typingTimeouts.get(timeoutKey)!);
      }

      const timeout = setTimeout(() => {
        this.stopTyping(conversationId);
        this.typingTimeouts.delete(timeoutKey);
      }, 3000);

      this.typingTimeouts.set(timeoutKey, timeout);
    } catch (error) {
      console.error('Error starting typing indicator:', error);
    }
  }

  async stopTyping(conversationId: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) return;

      const channel = supabase.channel(`typing:${conversationId}`);
      await channel.untrack();

      // Clear timeout
      const timeoutKey = `${conversationId}:${user.user.id}`;
      if (this.typingTimeouts.has(timeoutKey)) {
        clearTimeout(this.typingTimeouts.get(timeoutKey)!);
        this.typingTimeouts.delete(timeoutKey);
      }
    } catch (error) {
      console.error('Error stopping typing indicator:', error);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async processConversation(conversation: any, currentUserId: string): Promise<ConversationWithDetails> {
    const participants = (conversation.conversation_participants || []).map((p: any) => ({
      ...p,
      user: {
        id: p.profiles.id,
        email: p.profiles.email,
        display_name: p.profiles.display_name,
        avatar_url: p.profiles.avatar_url,
        created_at: p.profiles.created_at || '',
        updated_at: p.profiles.updated_at || ''
      }
    }));

    // Get other participant for 1-on-1 conversations
    const otherParticipant = !conversation.is_group 
      ? participants.find(p => p.user_id !== currentUserId)?.user
      : undefined;

    // Get last message
    const lastMessage = conversation.messages?.[0] 
      ? this.processMessage(conversation.messages[0])
      : undefined;

    // Calculate unread count
    const userParticipant = participants.find(p => p.user_id === currentUserId);
    const lastReadAt = userParticipant?.last_read_at;
    
    let unreadCount = 0;
    if (lastReadAt && lastMessage) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversation.id)
        .neq('sender_id', currentUserId)
        .gt('created_at', lastReadAt);
      
      unreadCount = count || 0;
    }

    return {
      ...conversation,
      participants,
      other_participant: otherParticipant,
      last_message: lastMessage,
      unread_count: unreadCount
    };
  }

  private processMessage(message: any): MessageWithSender {
    return {
      ...message,
      sender: {
        id: message.profiles.id,
        email: message.profiles.email || '',
        display_name: message.profiles.display_name,
        avatar_url: message.profiles.avatar_url,
        created_at: message.profiles.created_at || '',
        updated_at: message.profiles.updated_at || ''
      },
      reply_to_message: message.reply_to_message ? this.processMessage(message.reply_to_message) : undefined
    };
  }

  private async verifyParticipant(conversationId: string, userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw this.createError('ACCESS_DENIED', 'You are not a participant in this conversation', false);
    }
  }

  private async findExistingDirectConversation(
    userId1: string, 
    userId2: string
  ): Promise<ConversationWithDetails | null> {
    const { data: conversations } = await supabase
      .from('conversations')
      .select(`
        id,
        conversation_participants!inner (
          user_id
        )
      `)
      .eq('is_group', false);

    if (!conversations) return null;

    for (const conv of conversations) {
      const participantIds = conv.conversation_participants.map(p => p.user_id);
      if (participantIds.length === 2 && 
          participantIds.includes(userId1) && 
          participantIds.includes(userId2)) {
        return await this.getConversation(conv.id);
      }
    }

    return null;
  }

  private createError(code: string, message: string, retryable: boolean): MessagingError {
    const error = new Error(message) as MessagingError;
    error.code = code;
    error.retryable = retryable;
    return error;
  }

  private handleError(error: any): MessagingError {
    if (error.code) {
      return error; // Already a MessagingError
    }
    
    return this.createError('UNKNOWN_ERROR', error.message || 'An unexpected error occurred', true);
  }

  // ============================================================================
  // MARK AS READ
  // ============================================================================

  async markConversationAsRead(conversationId: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user?.id) {
        throw this.createError('AUTH_REQUIRED', 'User authentication required', true);
      }

      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.user.id);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw this.handleError(error);
    }
  }
}

export const messagingService = new MessagingService();
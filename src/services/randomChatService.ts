import { supabase } from "@/integrations/supabase/client";

export interface RandomChatSession {
  id: string;
  room_id: string;
  participant_1_id: string;
  participant_2_id: string;
  created_at: string;
  ended_at?: string;
  status: 'active' | 'ended' | 'abandoned';
  end_reason?: 'user_ended' | 'partner_left' | 'timeout' | 'reported' | 'connection_lost';
  duration_seconds?: number;
  connection_quality?: any;
  preferences_1?: any;
  preferences_2?: any;
}

export interface RandomChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  message_type: 'text' | 'emoji' | 'system';
}

export interface RandomChatReport {
  id: string;
  session_id?: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description?: string;
  created_at: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
}

export interface RandomChatStats {
  total_sessions: number;
  total_minutes: number;
  average_session_minutes: number;
  sessions_ended_by_user: number;
  sessions_ended_by_partner: number;
  times_reported: number;
  is_banned: boolean;
  last_session_at?: string;
}

class RandomChatService {
  /**
   * Create a new random chat session
   */
  async createSession(
    roomId: string, 
    participant1Id: string, 
    participant2Id: string,
    preferences1?: any,
    preferences2?: any
  ): Promise<RandomChatSession> {
    const { data: session, error } = await supabase
      .from('random_chat_sessions')
      .insert({
        room_id: roomId,
        participant_1_id: participant1Id,
        participant_2_id: participant2Id,
        preferences_1: preferences1 || {},
        preferences_2: preferences2 || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create random chat session:', error);
      throw error;
    }

    return session;
  }

  /**
   * End a random chat session
   */
  async endSession(
    sessionId: string, 
    endReason: RandomChatSession['end_reason'],
    connectionQuality?: any
  ): Promise<void> {
    const { error } = await supabase
      .from('random_chat_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        end_reason: endReason,
        connection_quality: connectionQuality || {}
      })
      .eq('id', sessionId)
      .eq('status', 'active');

    if (error) {
      console.error('Failed to end random chat session:', error);
      throw error;
    }
  }

  /**
   * Find active session by room ID
   */
  async findSessionByRoomId(roomId: string): Promise<RandomChatSession | null> {
    const { data: session, error } = await supabase
      .from('random_chat_sessions')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No session found
        return null;
      }
      console.error('Failed to find session by room ID:', error);
      throw error;
    }

    return session;
  }

  /**
   * Find active session by user ID
   */
  async findActiveSessionByUserId(userId: string): Promise<RandomChatSession | null> {
    const { data: session, error } = await supabase
      .from('random_chat_sessions')
      .select('*')
      .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No active session found
        return null;
      }
      console.error('Failed to find active session by user ID:', error);
      throw error;
    }

    return session;
  }

  /**
   * Send a message in a random chat session
   */
  async sendMessage(
    sessionId: string, 
    senderId: string, 
    content: string, 
    messageType: RandomChatMessage['message_type'] = 'text'
  ): Promise<RandomChatMessage> {
    const { data: message, error } = await supabase
      .from('random_chat_messages')
      .insert({
        session_id: sessionId,
        sender_id: senderId,
        content,
        message_type: messageType
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to send random chat message:', error);
      throw error;
    }

    return message;
  }

  /**
   * Get messages for a session
   */
  async getMessages(sessionId: string, limit: number = 50): Promise<RandomChatMessage[]> {
    const { data: messages, error } = await supabase
      .from('random_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Failed to get random chat messages:', error);
      throw error;
    }

    return messages || [];
  }

  /**
   * Subscribe to messages in a session
   */
  subscribeToSessionMessages(
    sessionId: string, 
    callback: (message: RandomChatMessage) => void
  ) {
    const subscription = supabase
      .channel(`random-chat-messages-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'random_chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          try {
            if (payload.new && typeof payload.new === 'object') {
              callback(payload.new as RandomChatMessage);
            }
          } catch (error) {
            console.warn('Error processing new message in subscription:', error);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(subscription);
      } catch (error) {
        console.warn('Error removing message subscription:', error);
      }
    };
  }

  /**
   * Report a user
   */
  async reportUser(
    reportedUserId: string,
    reason: string,
    description?: string,
    sessionId?: string
  ): Promise<RandomChatReport> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: report, error } = await supabase
      .from('random_chat_reports')
      .insert({
        session_id: sessionId,
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        reason,
        description
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create report:', error);
      throw error;
    }

    return report;
  }

  /**
   * Check if user is banned from random chat
   */
  async isUserBanned(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_user_banned_from_random_chat', {
        user_uuid: userId
      });

      if (error) {
        console.error('Failed to check ban status:', error);
        return false; // Default to not banned if check fails
      }

      return data as boolean;
    } catch (error) {
      console.error('Error checking ban status:', error);
      return false;
    }
  }

  /**
   * Get user's random chat statistics
   */
  async getUserStats(userId: string): Promise<RandomChatStats> {
    try {
      const { data, error } = await supabase.rpc('get_random_chat_stats', {
        user_uuid: userId
      });

      if (error) {
        console.error('Failed to get user stats:', error);
        // Return default stats
        return {
          total_sessions: 0,
          total_minutes: 0,
          average_session_minutes: 0,
          sessions_ended_by_user: 0,
          sessions_ended_by_partner: 0,
          times_reported: 0,
          is_banned: false
        };
      }

      return data[0] as RandomChatStats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        total_sessions: 0,
        total_minutes: 0,
        average_session_minutes: 0,
        sessions_ended_by_user: 0,
        sessions_ended_by_partner: 0,
        times_reported: 0,
        is_banned: false
      };
    }
  }

  /**
   * Get recent sessions for a user
   */
  async getUserRecentSessions(userId: string, limit: number = 10): Promise<RandomChatSession[]> {
    const { data: sessions, error } = await supabase
      .from('random_chat_sessions')
      .select('*')
      .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get user recent sessions:', error);
      return [];
    }

    return sessions || [];
  }

  /**
   * Clean up old sessions (admin function)
   */
  async cleanupOldSessions(): Promise<number> {
    try {
      const { data: count, error } = await supabase.rpc('cleanup_old_random_sessions');

      if (error) {
        console.error('Failed to cleanup old sessions:', error);
        return 0;
      }

      return count as number;
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
      return 0;
    }
  }

  /**
   * Update connection quality for a session
   */
  async updateConnectionQuality(sessionId: string, quality: any): Promise<void> {
    const { error } = await supabase
      .from('random_chat_sessions')
      .update({
        connection_quality: quality
      })
      .eq('id', sessionId)
      .eq('status', 'active');

    if (error) {
      console.error('Failed to update connection quality:', error);
      // Don't throw error for non-critical operation
    }
  }
}

export const randomChatService = new RandomChatService();
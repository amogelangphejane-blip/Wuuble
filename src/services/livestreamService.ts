import { supabase } from '@/integrations/supabase/client';

export interface LiveStreamConfig {
  video: boolean;
  audio: boolean;
  quality: 'low' | 'medium' | 'high';
  maxViewers?: number;
  enableChat?: boolean;
  enableReactions?: boolean;
}

export interface StreamViewer {
  id: string;
  user_id: string;
  joined_at: string;
  is_active: boolean;
}

export interface StreamMessage {
  id: string;
  user_id: string;
  message: string;
  message_type: 'text' | 'emoji' | 'system' | 'question';
  created_at: string;
  is_pinned?: boolean;
  metadata?: any;
}

export interface StreamReaction {
  id: string;
  user_id: string;
  reaction_type: 'like' | 'love' | 'wow' | 'laugh' | 'clap' | 'fire';
  position_x?: number;
  position_y?: number;
  created_at: string;
}

export interface LiveStream {
  id: string;
  community_id?: string;
  creator_id: string;
  title: string;
  description?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  scheduled_start_time?: string;
  actual_start_time?: string;
  end_time?: string;
  stream_key?: string;
  rtmp_url?: string;
  hls_url?: string;
  viewer_count: number;
  max_viewers: number;
  peak_viewers: number;
  total_messages: number;
  total_reactions: number;
  is_recorded: boolean;
  recording_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  visibility: 'public' | 'community_only';
  settings: {
    qa_mode: boolean;
    polls_enabled: boolean;
    reactions_enabled: boolean;
    chat_moderation: boolean;
  };
  created_at: string;
  updated_at: string;
}

class LivestreamService {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private debugMode = localStorage.getItem('livestream_debug') === 'true';
  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Add TURN servers for better connectivity
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 10
  };

  // Initialize WebRTC for broadcasting
  async startBroadcast(config: LiveStreamConfig): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        video: config.video ? {
          width: { ideal: config.quality === 'high' ? 1280 : config.quality === 'medium' ? 720 : 480 },
          height: { ideal: config.quality === 'high' ? 720 : config.quality === 'medium' ? 480 : 320 },
          frameRate: { ideal: config.quality === 'high' ? 30 : 24 }
        } : false,
        audio: config.audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error: any) {
      console.error('Error starting broadcast:', error);
      
      // Enhanced error handling with specific messages
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera/microphone permission denied. Please allow access and try again.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera or microphone found. Please check your devices.');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Camera/microphone is already in use by another application.');
      } else if (error.name === 'OverconstrainedError') {
        // Try fallback with lower constraints
        try {
          const fallbackConstraints: MediaStreamConstraints = {
            video: config.video ? { width: 640, height: 480 } : false,
            audio: config.audio
          };
          this.localStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          return this.localStream;
        } catch (fallbackError) {
          throw new Error('Camera/microphone constraints not supported. Please try with different settings.');
        }
      }
      
      throw new Error(`Failed to access camera/microphone: ${error.message}`);
    }
  }

  // Stop broadcasting
  async stopBroadcast(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
  }

  // Create a new livestream
  async createLivestream(data: {
    title: string;
    description?: string;
    community_id?: string;
    max_viewers?: number;
    visibility?: 'public' | 'community_only';
    settings?: Partial<LiveStream['settings']>;
    tags?: string[];
  }): Promise<LiveStream> {
    this.debugLog('Creating livestream:', data);
    
    // Check authentication
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user.user) {
      throw new Error('You must be logged in to create a livestream');
    }

    try {
      const { data: stream, error } = await supabase
        .from('live_streams')
        .insert({
          title: data.title,
          description: data.description,
          community_id: data.community_id,
          creator_id: user.user.id,
          max_viewers: data.max_viewers || 1000,
          visibility: data.visibility || (data.community_id ? 'community_only' : 'public'),
          settings: {
            qa_mode: false,
            polls_enabled: true,
            reactions_enabled: true,
            chat_moderation: false,
            ...data.settings
          },
          tags: data.tags || [],
          stream_key: this.generateStreamKey(),
          status: 'scheduled'
        })
        .select()
        .single();

      this.debugLog('Stream creation result:', { stream, error });

      if (error) {
        this.debugLog('Stream creation error:', error);
        
        if (error.message.includes('permission denied')) {
          throw new Error('Permission denied. Please check if you have access to create streams in this community.');
        } else if (error.message.includes('violates row-level security')) {
          throw new Error('Access denied. You may need to be a member of the community to create streams.');
        }
        
        throw error;
      }
      
      return stream;
    } catch (error: any) {
      this.debugLog('Error creating livestream:', error);
      throw error;
    }
  }

  // Start a livestream (change status to live)
  async startLivestream(streamId: string): Promise<void> {
    const { error } = await supabase
      .from('live_streams')
      .update({
        status: 'live',
        actual_start_time: new Date().toISOString()
      })
      .eq('id', streamId);

    if (error) throw error;
  }

  // End a livestream
  async endLivestream(streamId: string): Promise<void> {
    const { error } = await supabase
      .from('live_streams')
      .update({
        status: 'ended',
        end_time: new Date().toISOString()
      })
      .eq('id', streamId);

    if (error) throw error;
    await this.stopBroadcast();
  }

  // Debug logging helper
  private debugLog(message: string, data?: any) {
    if (this.debugMode) {
      console.log(`[LivestreamService] ${message}`, data);
    }
  }

  // Get live streams
  async getLivestreams(filters?: {
    status?: string;
    community_id?: string;
    creator_id?: string;
  }): Promise<LiveStream[]> {
    this.debugLog('Getting livestreams with filters:', filters);
    
    try {
      let query = supabase
        .from('live_streams')
        .select(`
          *,
          profiles:creator_id (
            id,
            user_id,
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.community_id) {
        query = query.eq('community_id', filters.community_id);
      }
      if (filters?.creator_id) {
        query = query.eq('creator_id', filters.creator_id);
      }

      const { data, error } = await query;
      
      this.debugLog('Livestreams query result:', { data, error });
      
      if (error) {
        this.debugLog('Database error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      this.debugLog('Error getting livestreams:', error);
      
      // Check if it's a table not found error
      if (error.message?.includes('relation "live_streams" does not exist')) {
        throw new Error('Livestream database tables are not set up. Please contact support.');
      }
      
      throw error;
    }
  }

  // Join a livestream as viewer
  async joinLivestream(streamId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('stream_viewers')
      .upsert({
        stream_id: streamId,
        user_id: user.user.id,
        is_active: true,
        joined_at: new Date().toISOString()
      });

    if (error && !error.message.includes('duplicate key')) {
      throw error;
    }
  }

  // Leave a livestream
  async leaveLivestream(streamId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { error } = await supabase
      .from('stream_viewers')
      .update({
        is_active: false,
        left_at: new Date().toISOString()
      })
      .eq('stream_id', streamId)
      .eq('user_id', user.user.id);

    if (error) console.error('Error leaving stream:', error);
  }

  // Send chat message
  async sendChatMessage(streamId: string, message: string, type: 'text' | 'emoji' | 'question' = 'text'): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('stream_chat')
      .insert({
        stream_id: streamId,
        user_id: user.user.id,
        message,
        message_type: type
      });

    if (error) throw error;
  }

  // Send reaction
  async sendReaction(streamId: string, reactionType: StreamReaction['reaction_type'], position?: { x: number; y: number }): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('stream_reactions')
      .insert({
        stream_id: streamId,
        user_id: user.user.id,
        reaction_type: reactionType,
        position_x: position?.x,
        position_y: position?.y
      });

    if (error) throw error;
  }

  // Subscribe to chat messages
  subscribeToChatMessages(streamId: string, callback: (message: StreamMessage) => void) {
    return supabase
      .channel(`stream_chat:${streamId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'stream_chat',
        filter: `stream_id=eq.${streamId}`
      }, (payload) => {
        callback(payload.new as StreamMessage);
      })
      .subscribe();
  }

  // Subscribe to reactions
  subscribeToReactions(streamId: string, callback: (reaction: StreamReaction) => void) {
    return supabase
      .channel(`stream_reactions:${streamId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'stream_reactions',
        filter: `stream_id=eq.${streamId}`
      }, (payload) => {
        callback(payload.new as StreamReaction);
      })
      .subscribe();
  }

  // Subscribe to viewer updates
  subscribeToViewerUpdates(streamId: string, callback: (data: { count: number; viewers: StreamViewer[] }) => void) {
    return supabase
      .channel(`stream_viewers:${streamId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stream_viewers',
        filter: `stream_id=eq.${streamId}`
      }, async () => {
        // Fetch updated viewer data
        const { data: viewers } = await supabase
          .from('stream_viewers')
          .select('*')
          .eq('stream_id', streamId)
          .eq('is_active', true);

        const { data: stream } = await supabase
          .from('live_streams')
          .select('viewer_count')
          .eq('id', streamId)
          .single();

        callback({
          count: stream?.viewer_count || 0,
          viewers: viewers || []
        });
      })
      .subscribe();
  }

  // Generate unique stream key
  private generateStreamKey(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Get stream analytics
  async getStreamAnalytics(streamId: string): Promise<any> {
    const { data, error } = await supabase
      .from('stream_analytics')
      .select('*')
      .eq('stream_id', streamId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Create WebRTC peer connection for viewer
  async createViewerConnection(streamId: string, viewerId: string): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection(this.configuration);
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to signaling server
        this.sendSignalingMessage(streamId, viewerId, {
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    peerConnection.ontrack = (event) => {
      // Handle incoming media stream
      console.log('Received remote stream:', event.streams[0]);
    };

    this.peerConnections.set(viewerId, peerConnection);
    return peerConnection;
  }

  // Send signaling message (implement with your signaling server)
  private async sendSignalingMessage(streamId: string, targetId: string, message: any): Promise<void> {
    // Implement WebRTC signaling logic here
    // This could use WebSockets, Socket.IO, or Supabase realtime
    console.log('Signaling message:', { streamId, targetId, message });
  }
}

export const livestreamService = new LivestreamService();
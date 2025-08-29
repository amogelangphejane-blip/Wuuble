/**
 * Socket.IO Signaling Service for Random Video Chat
 * Replaces mock signaling with production-ready Socket.IO implementation
 */

import { io, Socket } from 'socket.io-client';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'initiate-call' | 'connection-status';
  data: any;
  from?: string;
  to?: string;
  timestamp?: number;
}

export interface SignalingEvents {
  onMessage?: (message: SignalingMessage) => void;
  onUserJoined?: (userId: string) => void;
  onUserLeft?: (userId: string) => void;
  onError?: (error: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onSearching?: (data: { message: string; status: string }) => void;
  onQueueStatus?: (data: { position: number; estimatedWaitTime: number; totalWaiting: number; message: string }) => void;
}

export interface UserPreferences {
  ageRange?: [number, number];
  interests?: string[];
  language?: string;
  gender?: 'male' | 'female' | 'any';
}

export interface ConnectionQuality {
  level: 'excellent' | 'good' | 'fair' | 'poor';
  latency: number;
  packetLoss: number;
  bandwidth: number;
}

export class SocketIOSignalingService {
  private socket: Socket | null = null;
  private userId: string;
  private currentRoomId: string | null = null;
  private currentPartnerId: string | null = null;
  private events: SignalingEvents;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isAuthenticated = false;
  private serverUrl: string;

  constructor(userId: string, events: SignalingEvents = {}) {
    this.userId = userId;
    this.events = events;
    this.serverUrl = 'https://wuuble.onrender.com'; // Force the correct URL
    
    console.log(`🎯 SocketIOSignalingService initialized for user ${userId}`);
  }

  /**
   * Connect to Socket.IO signaling server
   */
  async connect(): Promise<void> {
    try {
      console.log(`🔌 Connecting to signaling server: ${this.serverUrl}`);
      
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      });

      return new Promise((resolve, reject) => {
        if (!this.socket) return reject(new Error('Failed to create socket'));

        // Connection successful
        this.socket.on('connect', () => {
          console.log('✅ Connected to Socket.IO signaling server');
          this.connectionAttempts = 0;
          this.setupEventHandlers();
          this.authenticate();
          resolve();
        });

        // Connection failed
        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket.IO connection failed:', error);
          this.events.onError?.(`Connection failed: ${error.message}`);
          reject(error);
        });

        // Disconnected
        this.socket.on('disconnect', (reason) => {
          console.log(`📡 Disconnected from signaling server: ${reason}`);
          this.isAuthenticated = false;
          this.events.onDisconnected?.();
          
          // Don't auto-reconnect for certain reasons
          if (reason === 'io server disconnect') {
            console.log('🛑 Server initiated disconnect - not reconnecting');
          }
        });

        // Reconnection attempts
        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log(`🔄 Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
        });

        // Reconnected successfully
        this.socket.on('reconnect', (attemptNumber) => {
          console.log(`✅ Reconnected after ${attemptNumber} attempts`);
          this.authenticate();
        });

        // Failed to reconnect
        this.socket.on('reconnect_failed', () => {
          console.error('❌ Failed to reconnect to signaling server');
          this.events.onError?.('Failed to reconnect to server');
        });
      });

    } catch (error) {
      console.error('❌ Socket.IO connection error:', error);
      throw error;
    }
  }

  /**
   * Authenticate with the server
   */
  private authenticate(): void {
    if (!this.socket || this.isAuthenticated) return;

    console.log(`🔐 Authenticating user ${this.userId}`);
    
    this.socket.emit('authenticate', {
      userId: this.userId,
      userInfo: {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });
  }

  /**
   * Set up Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Authentication successful
    this.socket.on('authenticated', (data) => {
      console.log(`✅ Authenticated as user ${data.userId}`);
      this.isAuthenticated = true;
      this.events.onConnected?.();
    });

    // Authentication failed
    this.socket.on('auth-error', (data) => {
      console.error('❌ Authentication failed:', data.message);
      this.events.onError?.(data.message);
    });

    // Successfully matched with a partner
    this.socket.on('matched', (data) => {
      const { roomId, partnerId, isInitiator, waitTime } = data;
      
      console.log(`🎯 Matched with partner ${partnerId} in room ${roomId} (wait: ${Math.round(waitTime/1000)}s)`);
      
      this.currentRoomId = roomId;
      this.currentPartnerId = partnerId;
      
      this.events.onUserJoined?.(partnerId);
      
      // If initiator, signal to start WebRTC offer process
      if (isInitiator) {
        setTimeout(() => {
          this.events.onMessage?.({
            type: 'initiate-call',
            data: { partnerId },
            timestamp: Date.now()
          });
        }, 1000); // Small delay to ensure both clients are ready
      }
    });

    // Queue status updates
    this.socket.on('queue-status', (data) => {
      console.log(`📊 Queue status: Position ${data.position}, ~${data.estimatedWaitTime}s wait`);
      this.events.onQueueStatus?.(data);
    });

    // Currently searching for partner
    this.socket.on('searching', (data) => {
      console.log(`🔍 ${data.message}`);
      this.events.onSearching?.(data);
    });

    // WebRTC signaling messages
    this.socket.on('webrtc-offer', (data) => {
      console.log(`📥 Received WebRTC offer from ${data.fromUserId}`);
      this.events.onMessage?.({
        type: 'offer',
        data: data.offer,
        from: data.fromUserId,
        timestamp: Date.now()
      });
    });

    this.socket.on('webrtc-answer', (data) => {
      console.log(`📥 Received WebRTC answer from ${data.fromUserId}`);
      this.events.onMessage?.({
        type: 'answer',
        data: data.answer,
        from: data.fromUserId,
        timestamp: Date.now()
      });
    });

    this.socket.on('webrtc-ice-candidate', (data) => {
      console.log(`📥 Received ICE candidate from ${data.fromUserId}`);
      this.events.onMessage?.({
        type: 'ice-candidate',
        data: data.candidate,
        from: data.fromUserId,
        timestamp: Date.now()
      });
    });

    // Partner left the chat
    this.socket.on('partner-left', (data) => {
      console.log(`👋 Partner left: ${data.reason}`);
      this.currentRoomId = null;
      this.currentPartnerId = null;
      this.events.onUserLeft?.(data.reason);
    });

    // Partner connection status
    this.socket.on('partner-connection-status', (data) => {
      console.log(`📶 Partner connection status: ${data.status} (${data.quality})`);
      this.events.onMessage?.({
        type: 'connection-status',
        data: {
          status: data.status,
          quality: data.quality
        },
        from: data.fromUserId,
        timestamp: data.timestamp
      });
    });

    // Room ended
    this.socket.on('room-ended', (data) => {
      console.log(`🏠 Room ended: ${data.reason} (duration: ${Math.round(data.duration/1000)}s)`);
      this.currentRoomId = null;
      this.currentPartnerId = null;
      this.events.onUserLeft?.(data.reason);
    });

    // Server shutdown notification
    this.socket.on('server-shutdown', (data) => {
      console.log(`🛑 Server shutdown: ${data.message}`);
      this.events.onError?.(data.message);
    });

    // Generic error messages
    this.socket.on('error', (data) => {
      console.error('❌ Server error:', data.message);
      this.events.onError?.(data.message);
    });

    // Partner typing indicator
    this.socket.on('partner-typing', (data) => {
      // Can be used for typing indicators in text chat
      console.log(`⌨️ Partner ${data.isTyping ? 'started' : 'stopped'} typing`);
    });

    // Chat messages (for text chat during video)
    this.socket.on('chat-message', (data) => {
      console.log(`💬 Chat message from ${data.fromUserId}: ${data.message}`);
      // Handle text messages if needed
    });
  }

  /**
   * Find a random partner for video chat
   */
  findRandomPartner(preferences?: UserPreferences): void {
    if (!this.socket || !this.isAuthenticated) {
      console.error('❌ Cannot find partner: not connected or authenticated');
      this.events.onError?.('Not connected to signaling server');
      return;
    }

    console.log(`🔍 Looking for random partner with preferences:`, preferences);
    
    this.socket.emit('find-random-partner', {
      preferences: preferences || {}
    });
  }

  /**
   * Send WebRTC offer to partner
   */
  sendOffer(offer: RTCSessionDescriptionInit): void {
    if (!this.socket || !this.currentRoomId || !this.currentPartnerId) {
      console.error('❌ Cannot send offer: no active room or partner');
      return;
    }

    console.log(`📤 Sending WebRTC offer to ${this.currentPartnerId}`);
    
    this.socket.emit('webrtc-offer', {
      roomId: this.currentRoomId,
      offer,
      targetUserId: this.currentPartnerId
    });
  }

  /**
   * Send WebRTC answer to partner
   */
  sendAnswer(answer: RTCSessionDescriptionInit): void {
    if (!this.socket || !this.currentRoomId || !this.currentPartnerId) {
      console.error('❌ Cannot send answer: no active room or partner');
      return;
    }

    console.log(`📤 Sending WebRTC answer to ${this.currentPartnerId}`);
    
    this.socket.emit('webrtc-answer', {
      roomId: this.currentRoomId,
      answer,
      targetUserId: this.currentPartnerId
    });
  }

  /**
   * Send ICE candidate to partner
   */
  sendIceCandidate(candidate: RTCIceCandidate): void {
    if (!this.socket || !this.currentRoomId || !this.currentPartnerId) {
      console.error('❌ Cannot send ICE candidate: no active room or partner');
      return;
    }

    console.log(`📤 Sending ICE candidate to ${this.currentPartnerId}`);
    
    this.socket.emit('webrtc-ice-candidate', {
      roomId: this.currentRoomId,
      candidate,
      targetUserId: this.currentPartnerId
    });
  }

  /**
   * Skip to next partner
   */
  nextPartner(): void {
    if (!this.socket) {
      console.error('❌ Cannot skip partner: not connected');
      return;
    }

    console.log(`⏭️ Skipping to next partner`);
    
    this.socket.emit('next-partner');
    this.currentRoomId = null;
    this.currentPartnerId = null;
  }

  /**
   * End current chat session
   */
  endChat(): void {
    if (!this.socket) return;

    console.log(`🛑 Ending chat session`);
    
    this.socket.emit('end-chat');
    this.currentRoomId = null;
    this.currentPartnerId = null;
  }

  /**
   * Report connection quality to server
   */
  reportConnectionQuality(quality: ConnectionQuality): void {
    if (!this.socket || !this.currentRoomId) return;

    this.socket.emit('quality-report', {
      roomId: this.currentRoomId,
      quality: quality.level,
      stats: {
        latency: quality.latency,
        packetLoss: quality.packetLoss,
        bandwidth: quality.bandwidth,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Send connection status update
   */
  updateConnectionStatus(status: 'connecting' | 'connected' | 'disconnected' | 'failed', quality?: string): void {
    if (!this.socket || !this.currentRoomId) return;

    this.socket.emit('connection-status', {
      roomId: this.currentRoomId,
      status,
      quality: quality || 'unknown'
    });
  }

  /**
   * Send typing indicator
   */
  setTyping(isTyping: boolean): void {
    if (!this.socket || !this.currentRoomId) return;

    this.socket.emit('typing', {
      roomId: this.currentRoomId,
      isTyping
    });
  }

  /**
   * Send text message (for chat during video)
   */
  sendChatMessage(message: string, type: 'text' | 'emoji' = 'text'): void {
    if (!this.socket || !this.currentRoomId) return;

    this.socket.emit('chat-message', {
      roomId: this.currentRoomId,
      message,
      type
    });
  }

  /**
   * Disconnect from signaling server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('📡 Disconnecting from signaling server');
      
      this.socket.disconnect();
      this.socket = null;
      this.isAuthenticated = false;
      this.currentRoomId = null;
      this.currentPartnerId = null;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' | 'error' {
    if (!this.socket) return 'disconnected';
    
    if (this.socket.connected && this.isAuthenticated) return 'connected';
    if (this.socket.connecting) return 'connecting';
    
    return 'disconnected';
  }

  /**
   * Get current room and partner info
   */
  getCurrentSession(): { roomId: string | null; partnerId: string | null; isConnected: boolean } {
    return {
      roomId: this.currentRoomId,
      partnerId: this.currentPartnerId,
      isConnected: this.socket?.connected && this.isAuthenticated || false
    };
  }

  /**
   * Check if currently in a chat session
   */
  isInSession(): boolean {
    return !!(this.currentRoomId && this.currentPartnerId);
  }
}

/**
 * Factory function to create Socket.IO signaling service
 */
export const createSocketIOSignalingService = (
  userId: string, 
  events: SignalingEvents = {}
): SocketIOSignalingService => {
  return new SocketIOSignalingService(userId, events);
};

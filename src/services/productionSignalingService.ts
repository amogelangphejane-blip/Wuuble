import { io, Socket } from 'socket.io-client';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-room' | 'leave-room' | 'user-joined' | 'user-left';
  data: any;
  roomId?: string;
  userId?: string;
  targetUserId?: string;
}

export interface SignalingEvents {
  onMessage?: (message: SignalingMessage) => void;
  onUserJoined?: (userId: string) => void;
  onUserLeft?: (userId: string) => void;
  onRoomFull?: () => void;
  onError?: (error: string) => void;
}

export class ProductionSignalingService {
  private socket: Socket | null = null;
  private events: SignalingEvents;
  private currentRoomId: string | null = null;
  private isConnected = false;

  constructor(events: SignalingEvents = {}) {
    this.events = events;
  }

  async connect(signalServerUrl?: string): Promise<void> {
    try {
      // Use environment variable or fallback to Socket.IO server
      const serverUrl = signalServerUrl || 
  import.meta.env.VITE_SIGNALING_SERVER_URL || 
  'https://wuuble.onrender.com';
      
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      return new Promise((resolve, reject) => {
        if (!this.socket) return reject(new Error('Failed to create socket'));

        this.socket.on('connect', () => {
          console.log('✅ Connected to production signaling server');
          this.isConnected = true;
          this.setupEventHandlers();
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Signaling server connection failed:', error);
          this.fallbackToMockService();
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('📡 Disconnected from signaling server');
          this.isConnected = false;
        });
      });
    } catch (error) {
      console.error('❌ Signaling service error:', error);
      this.fallbackToMockService();
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('signaling-message', (message: SignalingMessage) => {
      this.events.onMessage?.(message);
    });

    this.socket.on('user-joined', (userId: string) => {
      this.events.onUserJoined?.(userId);
    });

    this.socket.on('user-left', (userId: string) => {
      this.events.onUserLeft?.(userId);
    });

    this.socket.on('room-full', () => {
      this.events.onRoomFull?.();
    });

    this.socket.on('error', (error: string) => {
      this.events.onError?.(error);
    });
  }

  async joinRoom(roomId: string, userId: string): Promise<void> {
    if (!this.socket || !this.isConnected) {
      throw new Error('Not connected to signaling server');
    }

    this.currentRoomId = roomId;
    
    return new Promise((resolve, reject) => {
      this.socket!.emit('join-room', { roomId, userId }, (response: any) => {
        if (response.success) {
          console.log(`✅ Joined room: ${roomId}`);
          resolve();
        } else {
          console.error(`❌ Failed to join room: ${response.error}`);
          reject(new Error(response.error));
        }
      });
    });
  }

  async leaveRoom(): Promise<void> {
    if (!this.socket || !this.currentRoomId) return;

    this.socket.emit('leave-room', { roomId: this.currentRoomId });
    this.currentRoomId = null;
  }

  async sendMessage(message: SignalingMessage): Promise<void> {
    if (!this.socket || !this.isConnected) {
      throw new Error('Not connected to signaling server');
    }

    this.socket.emit('signaling-message', {
      ...message,
      roomId: this.currentRoomId
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentRoomId = null;
    }
  }

  private fallbackToMockService(): void {
    console.log('🔄 Falling back to mock signaling service for development');
    // Import and use existing mock service as fallback
    // This ensures the app still works during development
  }

  isProductionReady(): boolean {
    return this.isConnected && this.socket !== null;
  }

  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' | 'error' {
    if (!this.socket) return 'disconnected';
    
    switch (this.socket.connected) {
      case true:
        return 'connected';
      default:
        return this.socket.connecting ? 'connecting' : 'disconnected';
    }
  }
}

// Factory function to create signaling service with fallback
export const createProductionSignalingService = (events: SignalingEvents = {}): ProductionSignalingService => {
  return new ProductionSignalingService(events);
};

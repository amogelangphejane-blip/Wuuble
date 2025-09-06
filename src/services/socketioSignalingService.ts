import { io, Socket } from 'socket.io-client';
import { SignalingService, SignalingEvents, SignalingMessage } from './signalingService';

export class SocketIOSignalingService extends SignalingService {
  private socket: Socket | null = null;
  private roomId: string | null = null;
  private connected: boolean = false;
  private reconnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;

  constructor(
    private readonly userId: string,
    private readonly events: SignalingEvents = {},
    private readonly serverUrl: string = 'https://wuuble.onrender.com'
  ) {
    super();
  }

  async connect(): Promise<void> {
    if (this.socket?.connected) return;

    try {
      console.log('🔌 Connecting to signaling server...');
      
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        auth: {
          userId: this.userId
        }
      });

      this.setupSocketListeners();
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket!.once('connect', () => {
          clearTimeout(timeout);
          this.connected = true;
          console.log('✅ Connected to signaling server');
          resolve();
        });

        this.socket!.once('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

    } catch (error) {
      console.error('❌ Failed to connect to signaling server:', error);
      throw error;
    }
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from signaling server');
      this.connected = false;
      if (this.roomId) {
        this.events.onDisconnected?.();
      }
    });

    this.socket.on('reconnecting', (attempt) => {
      console.log(`🔄 Reconnecting to signaling server (attempt ${attempt}/${this.maxReconnectAttempts})...`);
      this.reconnecting = true;
      this.reconnectAttempts = attempt;
      this.events.onReconnecting?.(attempt);
    });

    this.socket.on('reconnect', () => {
      console.log('✅ Reconnected to signaling server');
      this.connected = true;
      this.reconnecting = false;
      this.reconnectAttempts = 0;
      if (this.roomId) {
        this.rejoinRoom();
      }
    });

    this.socket.on('matched', ({ roomId, partnerId, isInitiator }) => {
      console.log(`🎯 Matched with partner ${partnerId} in room ${roomId}`);
      this.roomId = roomId;
      this.events.onUserJoined?.(partnerId);
    });

    this.socket.on('partner-left', (partnerId) => {
      console.log(`👋 Partner ${partnerId} left the room`);
      this.events.onUserLeft?.(partnerId);
    });

    this.socket.on('signaling', (message: SignalingMessage) => {
      this.events.onMessage?.(message);
    });

    this.socket.on('queue-status', (status) => {
      console.log('⏳ Queue status:', status);
      this.events.onQueueStatus?.(status);
    });
  }

  private async rejoinRoom(): Promise<void> {
    if (!this.roomId || !this.socket?.connected) return;

    try {
      await this.socket.emitWithAck('rejoin-room', {
        roomId: this.roomId,
        userId: this.userId
      });
      console.log(`✅ Rejoined room ${this.roomId}`);
    } catch (error) {
      console.error('❌ Failed to rejoin room:', error);
      this.events.onError?.(new Error('Failed to rejoin room after reconnection'));
    }
  }

  joinRoom(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error('Not connected to signaling server');
    }

    console.log(`🚪 Joining room ${roomId}...`);
    this.socket.emit('join-room', {
      roomId,
      userId: this.userId
    });
    
    this.roomId = roomId;
  }

  sendMessage(message: SignalingMessage): void {
    if (!this.socket?.connected || !this.roomId) {
      throw new Error('Not connected to signaling server or room');
    }

    this.socket.emit('signaling', {
      ...message,
      roomId: this.roomId,
      from: this.userId
    });
  }

  leaveRoom(): void {
    if (!this.socket?.connected || !this.roomId) return;

    console.log(`🚪 Leaving room ${this.roomId}...`);
    this.socket.emit('leave-room', {
      roomId: this.roomId,
      userId: this.userId
    });

    this.roomId = null;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.roomId = null;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

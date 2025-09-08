export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-room' | 'leave-room' | 'user-joined' | 'user-left' | 'error';
  data?: any;
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
}

export abstract class SignalingService {
  protected abstract connect(): Promise<void>;
  protected abstract disconnect(): void;
  protected abstract joinRoom(roomId: string): void;
  protected abstract leaveRoom(): void;
  protected abstract sendMessage(message: SignalingMessage): void;
  protected abstract isConnected(): boolean;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('Signaling server connected');
          this.reconnectAttempts = 0;
          this.events.onConnected?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: SignalingMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse signaling message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('Signaling server disconnected');
          this.events.onDisconnected?.();
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('Signaling server error:', error);
          this.events.onError?.('Connection error');
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: SignalingMessage) {
    switch (message.type) {
      case 'user-joined':
        this.events.onUserJoined?.(message.data.userId);
        break;
      case 'user-left':
        this.events.onUserLeft?.(message.data.userId);
        break;
      case 'error':
        this.events.onError?.(message.data.message);
        break;
      default:
        this.events.onMessage?.(message);
        break;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.events.onError?.('Connection lost - please refresh the page');
    }
  }

  sendMessage(message: SignalingMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      return;
    }

    const messageWithMetadata: SignalingMessage = {
      ...message,
      from: this.userId,
      timestamp: Date.now()
    };

    this.ws.send(JSON.stringify(messageWithMetadata));
  }

  joinRoom(roomId: string): void {
    this.roomId = roomId;
    this.sendMessage({
      type: 'join-room',
      data: { roomId, userId: this.userId }
    });
  }

  leaveRoom(): void {
    if (this.roomId) {
      this.sendMessage({
        type: 'leave-room',
        data: { roomId: this.roomId, userId: this.userId }
      });
      this.roomId = null;
    }
  }

  sendOffer(offer: RTCSessionDescriptionInit, to: string): void {
    this.sendMessage({
      type: 'offer',
      data: offer,
      to
    });
  }

  sendAnswer(answer: RTCSessionDescriptionInit, to: string): void {
    this.sendMessage({
      type: 'answer',
      data: answer,
      to
    });
  }

  sendIceCandidate(candidate: RTCIceCandidateInit, to: string): void {
    this.sendMessage({
      type: 'ice-candidate',
      data: candidate,
      to
    });
  }

  getUserId(): string {
    return this.userId;
  }

  getRoomId(): string | null {
    return this.roomId;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    if (this.roomId) {
      this.leaveRoom();
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Mock signaling service for demo purposes
export class MockSignalingService extends SignalingService {
  private static instances: MockSignalingService[] = [];
  private partner: MockSignalingService | null = null;

  constructor(userId: string, events: SignalingEvents = {}) {
    super('ws://localhost:8080', userId, events);
    MockSignalingService.instances.push(this);
  }

  async connect(): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.events.onConnected?.();
    console.log(`Mock signaling connected for user ${this.userId}`);
  }

  joinRoom(roomId: string): void {
    this.roomId = roomId;
    
    // Find another user looking for a partner (only check if they don't have a partner, ignore roomId)
    const availablePartner = MockSignalingService.instances.find(
      instance => instance !== this && 
      instance.partner === null
    );

    if (availablePartner) {
      // Connect with partner
      this.partner = availablePartner;
      availablePartner.partner = this;
      availablePartner.roomId = roomId;
      
      console.log(`🔗 Mock signaling: User ${this.userId} matched with ${availablePartner.userId} in room ${roomId}`);
      
      // Simulate user joined events with realistic delay
      setTimeout(() => {
        this.events.onUserJoined?.(availablePartner.userId);
        availablePartner.events.onUserJoined?.(this.userId);
      }, 500 + Math.random() * 1000); // Reduced delay for better UX: 0.5-1.5 seconds
    } else {
      console.log(`⏳ Mock signaling: User ${this.userId} waiting for partner in room ${roomId}`);
      
      // Check periodically for new partners instead of creating fake ones
      const checkForPartner = () => {
        if (this.roomId === roomId && !this.partner) {
          const newPartner = MockSignalingService.instances.find(
            instance => instance !== this && 
            instance.partner === null &&
            instance.roomId !== null // Only match with users who are also looking
          );
          
          if (newPartner) {
            this.partner = newPartner;
            newPartner.partner = this;
            newPartner.roomId = roomId;
            
            console.log(`🔗 Mock signaling: User ${this.userId} found delayed match with ${newPartner.userId}`);
            
            this.events.onUserJoined?.(newPartner.userId);
            newPartner.events.onUserJoined?.(this.userId);
          } else {
            // Continue checking for real partners, only create demo partner after longer wait
            setTimeout(checkForPartner, 1000);
          }
        }
      };
      
      // Start checking after a short delay
      setTimeout(checkForPartner, 1000);
      
      // Only create a demo partner if no real partner is found after 10 seconds
      setTimeout(() => {
        if (this.roomId === roomId && !this.partner) {
          console.log(`🤖 Mock signaling: Creating demo partner for ${this.userId} (no real users available)`);
          const mockPartnerId = 'demo-partner-' + Math.random().toString(36).substr(2, 9);
          this.events.onUserJoined?.(mockPartnerId);
        }
      }, 10000); // Increased timeout to 10 seconds to give real users more time to connect
    }
  }

  sendMessage(message: SignalingMessage): void {
    if (this.partner) {
      // Simulate network delay
      setTimeout(() => {
        const messageWithMetadata: SignalingMessage = {
          ...message,
          from: this.userId,
          timestamp: Date.now(),
          to: this.partner!.userId
        };
        
        this.partner!.events.onMessage?.(messageWithMetadata);
      }, 50 + Math.random() * 100);
    }
  }

  leaveRoom(): void {
    if (this.partner) {
      const partnerId = this.partner.userId;
      
      // Notify partner of disconnection
      this.partner.events.onUserLeft?.(this.userId);
      this.partner.partner = null;
      this.partner.roomId = null;
      
      this.partner = null;
      this.events.onUserLeft?.(partnerId);
    }
    
    this.roomId = null;
  }

  disconnect(): void {
    this.leaveRoom();
    
    // Remove from instances
    const index = MockSignalingService.instances.indexOf(this);
    if (index > -1) {
      MockSignalingService.instances.splice(index, 1);
    }
    
    this.events.onDisconnected?.();
  }

  isConnected(): boolean {
    return true; // Always connected in mock mode
  }
}

// Factory function to create appropriate signaling service
export function createSignalingService(
  userId: string, 
  events: SignalingEvents = {}, 
  useMock: boolean = false,
  serverUrl: string = 'https://wuuble.onrender.com'
): SignalingService {
  if (useMock) {
    console.warn('⚠️ Using mock signaling service - not recommended for production');
    return new MockSignalingService(userId, events);
  } else {
    const { SocketIOSignalingService } = require('./socketioSignalingService');
    return new SocketIOSignalingService(userId, events, serverUrl);
  }
}
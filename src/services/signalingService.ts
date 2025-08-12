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

export class SignalingService {
  private ws: WebSocket | null = null;
  private url: string;
  private events: SignalingEvents;
  private userId: string;
  private roomId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(url: string, userId: string, events: SignalingEvents = {}) {
    this.url = url;
    this.userId = userId;
    this.events = events;
  }

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
    
    // Find another user looking for a partner
    const availablePartner = MockSignalingService.instances.find(
      instance => instance !== this && 
      instance.roomId === null && 
      instance.partner === null
    );

    if (availablePartner) {
      // Connect with partner
      this.partner = availablePartner;
      availablePartner.partner = this;
      availablePartner.roomId = roomId;
      
      // Simulate user joined events
      setTimeout(() => {
        this.events.onUserJoined?.(availablePartner.userId);
        availablePartner.events.onUserJoined?.(this.userId);
      }, 500);
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
  useMock: boolean = true
): SignalingService {
  if (useMock) {
    return new MockSignalingService(userId, events);
  } else {
    // In production, use real WebSocket URL
    const wsUrl = process.env.REACT_APP_SIGNALING_URL || 'ws://localhost:8080';
    return new SignalingService(wsUrl, userId, events);
  }
}
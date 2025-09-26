import io, { Socket } from 'socket.io-client';

export interface UserPreferences {
  ageRange?: [number, number];
  interests?: string[];
  language?: string;
  location?: string;
}

interface SignalingCallbacks {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onPartnerFound?: (partnerId: string) => void;
  onPartnerLeft?: () => void;
  onOffer?: (offer: RTCSessionDescriptionInit, partnerId: string) => void;
  onAnswer?: (answer: RTCSessionDescriptionInit) => void;
  onIceCandidate?: (candidate: RTCIceCandidateInit) => void;
  onError?: (error: string) => void;
  onSearching?: () => void;
  onMessage?: (message: any) => void;
}

export class SocketIOSignalingService {
  private socket: Socket | null = null;
  private userId: string;
  private callbacks: SignalingCallbacks;
  private partnerId: string | null = null;
  private serverUrl: string;

  constructor(userId: string, callbacks: SignalingCallbacks = {}) {
    this.userId = userId;
    this.callbacks = callbacks;
    // Use environment variable or default to local development
    this.serverUrl = import.meta.env.VITE_SIGNALING_SERVER_URL || 'http://localhost:3001';
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
          console.log('Connected to signaling server');
          this.socket?.emit('register', { userId: this.userId });
          this.callbacks.onConnected?.();
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from signaling server');
          this.callbacks.onDisconnected?.();
        });

        this.socket.on('partner-found', (data: { partnerId: string }) => {
          console.log('Partner found:', data.partnerId);
          this.partnerId = data.partnerId;
          this.callbacks.onPartnerFound?.(data.partnerId);
        });

        this.socket.on('partner-left', () => {
          console.log('Partner left');
          this.partnerId = null;
          this.callbacks.onPartnerLeft?.();
        });

        this.socket.on('offer', (data: { offer: RTCSessionDescriptionInit, from: string }) => {
          console.log('Received offer from:', data.from);
          this.partnerId = data.from;
          this.callbacks.onOffer?.(data.offer, data.from);
        });

        this.socket.on('answer', (data: { answer: RTCSessionDescriptionInit }) => {
          console.log('Received answer');
          this.callbacks.onAnswer?.(data.answer);
        });

        this.socket.on('ice-candidate', (data: { candidate: RTCIceCandidateInit }) => {
          console.log('Received ICE candidate');
          this.callbacks.onIceCandidate?.(data.candidate);
        });

        this.socket.on('message', (data: any) => {
          this.callbacks.onMessage?.(data);
        });

        this.socket.on('searching', () => {
          console.log('Searching for partner...');
          this.callbacks.onSearching?.();
        });

        this.socket.on('error', (error: string) => {
          console.error('Signaling error:', error);
          this.callbacks.onError?.(error);
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          reject(error);
        });

      } catch (error) {
        console.error('Failed to create socket connection:', error);
        reject(error);
      }
    });
  }

  startSearch(preferences?: UserPreferences): void {
    if (!this.socket?.connected) {
      console.error('Not connected to signaling server');
      return;
    }
    
    this.socket.emit('start-search', { 
      userId: this.userId, 
      preferences: preferences || {} 
    });
  }

  sendOffer(offer: RTCSessionDescriptionInit, targetId: string): void {
    if (!this.socket?.connected) {
      console.error('Not connected to signaling server');
      return;
    }
    
    this.socket.emit('offer', { 
      offer, 
      to: targetId,
      from: this.userId 
    });
  }

  sendAnswer(answer: RTCSessionDescriptionInit, targetId: string): void {
    if (!this.socket?.connected) {
      console.error('Not connected to signaling server');
      return;
    }
    
    this.socket.emit('answer', { 
      answer, 
      to: targetId,
      from: this.userId 
    });
  }

  sendIceCandidate(candidate: RTCIceCandidateInit, targetId: string): void {
    if (!this.socket?.connected) {
      console.error('Not connected to signaling server');
      return;
    }
    
    this.socket.emit('ice-candidate', { 
      candidate, 
      to: targetId,
      from: this.userId 
    });
  }

  sendMessage(message: any): void {
    if (!this.socket?.connected || !this.partnerId) {
      console.error('Not connected or no partner');
      return;
    }
    
    this.socket.emit('message', {
      message,
      to: this.partnerId,
      from: this.userId
    });
  }

  endChat(): void {
    if (this.socket?.connected) {
      this.socket.emit('end-chat', { userId: this.userId });
      this.partnerId = null;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.partnerId = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getPartnerId(): string | null {
    return this.partnerId;
  }
}

export default SocketIOSignalingService;
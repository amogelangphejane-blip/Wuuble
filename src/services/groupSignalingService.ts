import { SignalingService, SignalingMessage, SignalingEvents, MockSignalingService } from './signalingService';

export interface GroupSignalingMessage extends SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-group' | 'leave-group' | 'user-joined' | 'user-left' | 'participant-update' | 'group-message' | 'error';
  groupId?: string;
  participantId?: string;
  participantData?: any;
}

export interface GroupSignalingEvents extends SignalingEvents {
  onParticipantJoined?: (participantId: string, participantData: any) => void;
  onParticipantLeft?: (participantId: string) => void;
  onParticipantUpdated?: (participantId: string, updates: any) => void;
  onGroupMessage?: (participantId: string, message: any) => void;
  onGroupOffer?: (fromParticipantId: string, offer: RTCSessionDescriptionInit) => void;
  onGroupAnswer?: (fromParticipantId: string, answer: RTCSessionDescriptionInit) => void;
  onGroupIceCandidate?: (fromParticipantId: string, candidate: RTCIceCandidateInit) => void;
}

export class GroupSignalingService extends SignalingService {
  private groupId: string | null = null;
  private participantId: string;
  private participants: Map<string, any> = new Map();
  private groupEvents: GroupSignalingEvents;

  constructor(url: string, participantId: string, events: GroupSignalingEvents = {}) {
    super(url, participantId, events);
    this.participantId = participantId;
    this.groupEvents = events;
  }

  protected handleMessage(message: GroupSignalingMessage): void {
    switch (message.type) {
      case 'user-joined':
        if (message.participantId && message.participantData) {
          this.participants.set(message.participantId, message.participantData);
          this.groupEvents.onParticipantJoined?.(message.participantId, message.participantData);
        }
        break;
      
      case 'user-left':
        if (message.participantId) {
          this.participants.delete(message.participantId);
          this.groupEvents.onParticipantLeft?.(message.participantId);
        }
        break;
      
      case 'participant-update':
        if (message.participantId && message.participantData) {
          const existing = this.participants.get(message.participantId);
          if (existing) {
            Object.assign(existing, message.participantData);
            this.participants.set(message.participantId, existing);
          }
          this.groupEvents.onParticipantUpdated?.(message.participantId, message.participantData);
        }
        break;
      
      case 'offer':
        if (message.from && message.data) {
          this.groupEvents.onGroupOffer?.(message.from, message.data);
        }
        break;
      
      case 'answer':
        if (message.from && message.data) {
          this.groupEvents.onGroupAnswer?.(message.from, message.data);
        }
        break;
      
      case 'ice-candidate':
        if (message.from && message.data) {
          this.groupEvents.onGroupIceCandidate?.(message.from, message.data);
        }
        break;
      
      case 'group-message':
        if (message.from && message.data) {
          this.groupEvents.onGroupMessage?.(message.from, message.data);
        }
        break;
      
      default:
        // Fall back to parent handler for other message types
        super.handleMessage(message);
        break;
    }
  }

  joinGroup(groupId: string, participantData: any): void {
    this.groupId = groupId;
    this.sendMessage({
      type: 'join-group',
      groupId,
      participantId: this.participantId,
      participantData
    });
  }

  leaveGroup(): void {
    if (this.groupId) {
      this.sendMessage({
        type: 'leave-group',
        groupId: this.groupId,
        participantId: this.participantId
      });
      this.groupId = null;
      this.participants.clear();
    }
  }

  sendGroupOffer(offer: RTCSessionDescriptionInit, toParticipantId: string): void {
    this.sendMessage({
      type: 'offer',
      data: offer,
      to: toParticipantId,
      groupId: this.groupId,
      participantId: this.participantId
    });
  }

  sendGroupAnswer(answer: RTCSessionDescriptionInit, toParticipantId: string): void {
    this.sendMessage({
      type: 'answer',
      data: answer,
      to: toParticipantId,
      groupId: this.groupId,
      participantId: this.participantId
    });
  }

  sendGroupIceCandidate(candidate: RTCIceCandidateInit, toParticipantId: string): void {
    this.sendMessage({
      type: 'ice-candidate',
      data: candidate,
      to: toParticipantId,
      groupId: this.groupId,
      participantId: this.participantId
    });
  }

  sendParticipantUpdate(updates: any): void {
    if (this.groupId) {
      this.sendMessage({
        type: 'participant-update',
        groupId: this.groupId,
        participantId: this.participantId,
        participantData: updates
      });
    }
  }

  sendGroupMessage(message: any): void {
    if (this.groupId) {
      this.sendMessage({
        type: 'group-message',
        groupId: this.groupId,
        participantId: this.participantId,
        data: message
      });
    }
  }

  getGroupId(): string | null {
    return this.groupId;
  }

  getParticipants(): Map<string, any> {
    return new Map(this.participants);
  }

  getParticipant(participantId: string): any {
    return this.participants.get(participantId);
  }

  getAllParticipants(): Map<string, any> {
    return new Map(this.participants);
  }
}

// Cross-tab compatible mock implementation for group signaling
export class MockGroupSignalingService extends GroupSignalingService {
  private broadcastChannel: BroadcastChannel | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeat: number = Date.now();

  constructor(participantId: string, events: GroupSignalingEvents = {}) {
    super('ws://localhost:8080', participantId, events);
  }

  async connect(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Initialize BroadcastChannel for cross-tab communication
    try {
      this.broadcastChannel = new BroadcastChannel('group-video-signaling');
      this.broadcastChannel.onmessage = (event) => {
        this.handleBroadcastMessage(event.data);
      };
      
      console.log(`🔌 Mock group signaling connected for participant ${this.participantId} with cross-tab support`);
      
      // Start heartbeat to maintain presence
      this.startHeartbeat();
      
    } catch (error) {
      console.warn('BroadcastChannel not supported, falling back to single-tab mode:', error);
    }
    
    this.groupEvents.onConnected?.();
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.groupId && this.broadcastChannel) {
        this.broadcastMessage({
          type: 'heartbeat',
          participantId: this.participantId,
          groupId: this.groupId,
          timestamp: Date.now()
        });
      }
    }, 5000); // Send heartbeat every 5 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private broadcastMessage(message: any): void {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch (error) {
        console.warn('Failed to broadcast message:', error);
      }
    }
  }

  private handleBroadcastMessage(message: any): void {
    // Ignore messages from self
    if (message.participantId === this.participantId) {
      return;
    }

    // Only handle messages for our group
    if (message.groupId !== this.groupId) {
      return;
    }

    console.log(`📡 Received broadcast message:`, message);

    switch (message.type) {
      case 'participant-joined':
        if (message.participantData) {
          console.log(`👋 Cross-tab participant joined: ${message.participantId}`);
          this.participants.set(message.participantId, message.participantData);
          this.groupEvents.onParticipantJoined?.(message.participantId, message.participantData);
          
          // Send our own info to the new participant
          setTimeout(() => {
            this.broadcastMessage({
              type: 'participant-info',
              participantId: this.participantId,
              groupId: this.groupId,
              participantData: this.participants.get(this.participantId),
              targetParticipant: message.participantId
            });
          }, 100);
        }
        break;
        
      case 'participant-info':
        // Only process if this message is for us
        if (message.targetParticipant === this.participantId && message.participantData) {
          console.log(`📝 Received participant info: ${message.participantId}`);
          this.participants.set(message.participantId, message.participantData);
          this.groupEvents.onParticipantJoined?.(message.participantId, message.participantData);
        }
        break;
        
      case 'participant-left':
        console.log(`👋 Cross-tab participant left: ${message.participantId}`);
        this.participants.delete(message.participantId);
        this.groupEvents.onParticipantLeft?.(message.participantId);
        break;
        
      case 'participant-update':
        if (message.updates) {
          const existing = this.participants.get(message.participantId);
          if (existing) {
            Object.assign(existing, message.updates);
            this.participants.set(message.participantId, existing);
            this.groupEvents.onParticipantUpdated?.(message.participantId, message.updates);
          }
        }
        break;
        
      case 'signaling-message':
        // Forward signaling messages
        if (message.signalingData) {
          const signalingMessage: GroupSignalingMessage = {
            ...message.signalingData,
            from: message.participantId
          };
          this.handleMessage(signalingMessage);
        }
        break;
        
      case 'heartbeat':
        // Update last seen time for participant
        const participant = this.participants.get(message.participantId);
        if (participant) {
          participant.lastSeen = message.timestamp;
        }
        break;
        
      case 'participant-discovery':
        // Handle immediate participant discovery - respond with our info
        if (message.participantData && message.participantId !== this.participantId) {
          console.log(`🔍 Participant discovery from: ${message.participantId}`);
          // Add the discovering participant
          this.participants.set(message.participantId, message.participantData);
          this.groupEvents.onParticipantJoined?.(message.participantId, message.participantData);
          
          // Send our info back immediately
          const ourParticipantData = this.participants.get(this.participantId);
          if (ourParticipantData) {
            setTimeout(() => {
              this.broadcastMessage({
                type: 'participant-info',
                participantId: this.participantId,
                groupId: this.groupId,
                participantData: ourParticipantData,
                targetParticipant: message.participantId
              });
            }, 25 + Math.random() * 50);
          }
        }
        break;
        
      case 'request-participants':
        // Send our participant info to the requester
        const ourParticipantData = this.participants.get(this.participantId);
        if (ourParticipantData) {
          setTimeout(() => {
            this.broadcastMessage({
              type: 'participant-info',
              participantId: this.participantId,
              groupId: this.groupId,
              participantData: ourParticipantData,
              targetParticipant: message.participantId
            });
          }, 50 + Math.random() * 100); // Add some jitter to avoid message flooding
        }
        break;
    }
  }

  joinGroup(groupId: string, participantData: any): void {
    this.groupId = groupId;
    this.participants.set(this.participantId, participantData);
    
    console.log(`🚪 Joining group: ${groupId} with cross-tab support`);
    
    // Broadcast join to other tabs
    this.broadcastMessage({
      type: 'participant-joined',
      participantId: this.participantId,
      groupId: groupId,
      participantData: participantData
    });
    
    // Request existing participants info
    setTimeout(() => {
      this.broadcastMessage({
        type: 'request-participants',
        participantId: this.participantId,
        groupId: groupId
      });
    }, 200);
    
    // Also send a discovery request immediately for faster connection
    setTimeout(() => {
      this.broadcastMessage({
        type: 'participant-discovery',
        participantId: this.participantId,
        groupId: groupId,
        participantData: participantData
      });
    }, 50);
  }

  leaveGroup(): void {
    if (!this.groupId) return;
    
    console.log(`🚪 Leaving group: ${this.groupId}`);
    
    // Broadcast leave to other tabs
    this.broadcastMessage({
      type: 'participant-left',
      participantId: this.participantId,
      groupId: this.groupId
    });
    
    this.groupId = null;
    this.participants.clear();
    this.stopHeartbeat();
  }

  sendMessage(message: GroupSignalingMessage): void {
    if (!this.groupId) return;
    
    // Broadcast signaling message to other tabs
    this.broadcastMessage({
      type: 'signaling-message',
      participantId: this.participantId,
      groupId: this.groupId,
      signalingData: message
    });
  }

  sendParticipantUpdate(updates: any): void {
    if (this.groupId) {
      // Update local participant data
      const participant = this.participants.get(this.participantId);
      if (participant) {
        Object.assign(participant, updates);
      }
      
      // Broadcast update to other tabs
      this.broadcastMessage({
        type: 'participant-update',
        participantId: this.participantId,
        groupId: this.groupId,
        updates: updates
      });
    }
  }

  disconnect(): void {
    this.leaveGroup();
    this.stopHeartbeat();
    
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    
    this.groupEvents.onDisconnected?.();
  }

  isConnected(): boolean {
    return true; // Always connected in mock mode
  }

  getActiveGroups(): string[] {
    // This would need to be implemented with shared storage in a real cross-tab scenario
    return this.groupId ? [this.groupId] : [];
  }

  getGroupParticipantCount(): number {
    return this.participants.size;
  }
}

// Factory function to create appropriate group signaling service
export function createGroupSignalingService(
  participantId: string,
  events: GroupSignalingEvents = {},
  useMock: boolean = true
): GroupSignalingService {
  if (useMock) {
    return new MockGroupSignalingService(participantId, events);
  } else {
    // In production, use real WebSocket URL
    const wsUrl = process.env.REACT_APP_SIGNALING_URL || 'ws://localhost:8080';
    return new GroupSignalingService(wsUrl, participantId, events);
  }
}
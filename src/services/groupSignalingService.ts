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
}

// Mock implementation for group signaling
export class MockGroupSignalingService extends GroupSignalingService {
  private static groups: Map<string, MockGroupSignalingService[]> = new Map();
  private static instances: MockGroupSignalingService[] = [];

  constructor(participantId: string, events: GroupSignalingEvents = {}) {
    super('ws://localhost:8080', participantId, events);
    MockGroupSignalingService.instances.push(this);
  }

  async connect(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    this.groupEvents.onConnected?.();
    console.log(`Mock group signaling connected for participant ${this.participantId}`);
  }

  joinGroup(groupId: string, participantData: any): void {
    this.groupId = groupId;
    
    // Get or create group
    if (!MockGroupSignalingService.groups.has(groupId)) {
      MockGroupSignalingService.groups.set(groupId, []);
    }
    
    const groupMembers = MockGroupSignalingService.groups.get(groupId)!;
    
    // Add this participant to the group
    groupMembers.push(this);
    this.participants.set(this.participantId, participantData);
    
    // Notify existing participants about new joiner
    groupMembers.forEach(member => {
      if (member !== this) {
        setTimeout(() => {
          member.groupEvents.onParticipantJoined?.(this.participantId, participantData);
        }, 100);
      }
    });
    
    // Notify new joiner about existing participants
    groupMembers.forEach(member => {
      if (member !== this) {
        const existingParticipantData = member.participants.get(member.participantId);
        if (existingParticipantData) {
          setTimeout(() => {
            this.groupEvents.onParticipantJoined?.(member.participantId, existingParticipantData);
          }, 150);
        }
      }
    });
  }

  leaveGroup(): void {
    if (!this.groupId) return;
    
    const groupMembers = MockGroupSignalingService.groups.get(this.groupId);
    if (groupMembers) {
      // Remove from group
      const index = groupMembers.indexOf(this);
      if (index > -1) {
        groupMembers.splice(index, 1);
      }
      
      // Notify other participants
      groupMembers.forEach(member => {
        setTimeout(() => {
          member.groupEvents.onParticipantLeft?.(this.participantId);
        }, 50);
      });
      
      // Clean up empty group
      if (groupMembers.length === 0) {
        MockGroupSignalingService.groups.delete(this.groupId);
      }
    }
    
    this.groupId = null;
    this.participants.clear();
  }

  sendMessage(message: GroupSignalingMessage): void {
    if (!this.groupId) return;
    
    const groupMembers = MockGroupSignalingService.groups.get(this.groupId);
    if (!groupMembers) return;
    
    const messageWithMetadata: GroupSignalingMessage = {
      ...message,
      from: this.participantId,
      timestamp: Date.now()
    };
    
    if (message.to) {
      // Send to specific participant
      const targetMember = groupMembers.find(member => member.participantId === message.to);
      if (targetMember) {
        setTimeout(() => {
          targetMember.handleMessage(messageWithMetadata);
        }, 50 + Math.random() * 100);
      }
    } else {
      // Broadcast to all other participants
      groupMembers.forEach(member => {
        if (member !== this) {
          setTimeout(() => {
            member.handleMessage(messageWithMetadata);
          }, 50 + Math.random() * 100);
        }
      });
    }
  }

  disconnect(): void {
    this.leaveGroup();
    
    // Remove from instances
    const index = MockGroupSignalingService.instances.indexOf(this);
    if (index > -1) {
      MockGroupSignalingService.instances.splice(index, 1);
    }
    
    this.groupEvents.onDisconnected?.();
  }

  isConnected(): boolean {
    return true; // Always connected in mock mode
  }

  static getActiveGroups(): string[] {
    return Array.from(MockGroupSignalingService.groups.keys());
  }

  static getGroupParticipantCount(groupId: string): number {
    const group = MockGroupSignalingService.groups.get(groupId);
    return group ? group.length : 0;
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
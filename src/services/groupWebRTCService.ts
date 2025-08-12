import { WebRTCConfig, defaultWebRTCConfig } from './webRTCService';

export interface GroupParticipant {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  joinedAt: Date;
  role: 'host' | 'moderator' | 'participant';
}

export interface GroupWebRTCEvents {
  onParticipantJoined?: (participant: GroupParticipant) => void;
  onParticipantLeft?: (participantId: string) => void;
  onParticipantUpdated?: (participant: GroupParticipant) => void;
  onRemoteStream?: (participantId: string, stream: MediaStream) => void;
  onLocalStreamReady?: (stream: MediaStream) => void;
  onDataChannelMessage?: (participantId: string, message: any) => void;
  onConnectionQualityChanged?: (participantId: string, quality: string) => void;
  onError?: (error: string) => void;
}

interface PeerConnection {
  id: string;
  userId: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  remoteStream: MediaStream | null;
  isInitiator: boolean;
  lastQualityCheck: number;
}

export class GroupWebRTCService {
  private config: WebRTCConfig;
  private events: GroupWebRTCEvents;
  private localStream: MediaStream | null = null;
  private participants: Map<string, GroupParticipant> = new Map();
  private peerConnections: Map<string, PeerConnection> = new Map();
  private localUserId: string;
  private isScreenSharing: boolean = false;
  private screenShareStream: MediaStream | null = null;

  constructor(localUserId: string, config: WebRTCConfig = defaultWebRTCConfig, events: GroupWebRTCEvents = {}) {
    this.localUserId = localUserId;
    this.config = config;
    this.events = events;
  }

  async initializeLocalMedia(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: this.config.mediaConstraints.video,
        audio: this.config.mediaConstraints.audio
      });
      
      this.localStream = stream;
      this.events.onLocalStreamReady?.(stream);
      return stream;
    } catch (error) {
      console.error('Failed to get local media:', error);
      throw new Error('Could not access camera/microphone');
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: true
      });

      this.screenShareStream = screenStream;
      this.isScreenSharing = true;

      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      if (videoTrack) {
        await this.replaceVideoTrackInAllConnections(videoTrack);
      }

      // Handle screen share ending
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopScreenShare();
      });

      return screenStream;
    } catch (error) {
      console.error('Failed to start screen share:', error);
      throw new Error('Could not start screen sharing');
    }
  }

  async stopScreenShare(): Promise<void> {
    if (!this.isScreenSharing || !this.screenShareStream) return;

    this.screenShareStream.getTracks().forEach(track => track.stop());
    this.screenShareStream = null;
    this.isScreenSharing = false;

    // Replace with camera video track
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        await this.replaceVideoTrackInAllConnections(videoTrack);
      }
    }
  }

  private async replaceVideoTrackInAllConnections(newTrack: MediaStreamTrack): Promise<void> {
    const promises: Promise<void>[] = [];
    
    this.peerConnections.forEach((peerConn) => {
      const sender = peerConn.connection.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );
      
      if (sender) {
        promises.push(sender.replaceTrack(newTrack));
      }
    });

    await Promise.all(promises);
  }

  async createPeerConnection(participantId: string, userId: string, isInitiator: boolean = false): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection({
      iceServers: this.config.iceServers
    });

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      const peerConn = this.peerConnections.get(participantId);
      if (peerConn) {
        peerConn.remoteStream = remoteStream;
        this.events.onRemoteStream?.(participantId, remoteStream);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      const participant = this.participants.get(participantId);
      
      if (participant) {
        let quality: 'excellent' | 'good' | 'poor' | 'disconnected' = 'disconnected';
        
        switch (state) {
          case 'connected':
            quality = 'excellent';
            break;
          case 'connecting':
            quality = 'good';
            break;
          case 'disconnected':
          case 'failed':
          case 'closed':
            quality = 'disconnected';
            this.handleParticipantDisconnected(participantId);
            break;
        }
        
        participant.connectionQuality = quality;
        this.events.onParticipantUpdated?.(participant);
        this.events.onConnectionQualityChanged?.(participantId, quality);
      }
    };

    // Create data channel for the initiator
    let dataChannel: RTCDataChannel | null = null;
    if (isInitiator) {
      dataChannel = peerConnection.createDataChannel('groupChat', {
        ordered: true
      });
      this.setupDataChannel(participantId, dataChannel);
    }

    // Handle incoming data channels
    peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(participantId, event.channel);
    };

    // Store peer connection
    const peerConn: PeerConnection = {
      id: participantId,
      userId,
      connection: peerConnection,
      dataChannel,
      remoteStream: null,
      isInitiator,
      lastQualityCheck: Date.now()
    };

    this.peerConnections.set(participantId, peerConn);

    return peerConnection;
  }

  private setupDataChannel(participantId: string, channel: RTCDataChannel) {
    const peerConn = this.peerConnections.get(participantId);
    if (peerConn) {
      peerConn.dataChannel = channel;
    }

    channel.onopen = () => {
      console.log(`Data channel opened with ${participantId}`);
    };

    channel.onclose = () => {
      console.log(`Data channel closed with ${participantId}`);
    };

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.events.onDataChannelMessage?.(participantId, message);
      } catch (error) {
        console.error('Failed to parse data channel message:', error);
      }
    };
  }

  async createOffer(participantId: string): Promise<RTCSessionDescriptionInit> {
    const peerConn = this.peerConnections.get(participantId);
    if (!peerConn) {
      throw new Error(`No peer connection found for ${participantId}`);
    }

    const offer = await peerConn.connection.createOffer();
    await peerConn.connection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(participantId: string): Promise<RTCSessionDescriptionInit> {
    const peerConn = this.peerConnections.get(participantId);
    if (!peerConn) {
      throw new Error(`No peer connection found for ${participantId}`);
    }

    const answer = await peerConn.connection.createAnswer();
    await peerConn.connection.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(participantId: string, description: RTCSessionDescriptionInit): Promise<void> {
    const peerConn = this.peerConnections.get(participantId);
    if (!peerConn) {
      throw new Error(`No peer connection found for ${participantId}`);
    }

    await peerConn.connection.setRemoteDescription(description);
  }

  async addIceCandidate(participantId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerConn = this.peerConnections.get(participantId);
    if (!peerConn) {
      throw new Error(`No peer connection found for ${participantId}`);
    }

    await peerConn.connection.addIceCandidate(candidate);
  }

  addParticipant(participant: GroupParticipant): void {
    this.participants.set(participant.id, participant);
    this.events.onParticipantJoined?.(participant);
  }

  removeParticipant(participantId: string): void {
    const participant = this.participants.get(participantId);
    if (participant) {
      this.participants.delete(participantId);
      this.events.onParticipantLeft?.(participantId);
    }

    // Clean up peer connection
    this.closePeerConnection(participantId);
  }

  updateParticipant(participantId: string, updates: Partial<GroupParticipant>): void {
    const participant = this.participants.get(participantId);
    if (participant) {
      Object.assign(participant, updates);
      this.events.onParticipantUpdated?.(participant);
    }
  }

  private handleParticipantDisconnected(participantId: string): void {
    const participant = this.participants.get(participantId);
    if (participant) {
      participant.connectionQuality = 'disconnected';
      this.events.onParticipantUpdated?.(participant);
    }
  }

  private closePeerConnection(participantId: string): void {
    const peerConn = this.peerConnections.get(participantId);
    if (peerConn) {
      if (peerConn.dataChannel) {
        peerConn.dataChannel.close();
      }
      peerConn.connection.close();
      this.peerConnections.delete(participantId);
    }
  }

  sendMessage(message: any, targetParticipantId?: string): void {
    const messageStr = JSON.stringify(message);

    if (targetParticipantId) {
      // Send to specific participant
      const peerConn = this.peerConnections.get(targetParticipantId);
      if (peerConn?.dataChannel?.readyState === 'open') {
        peerConn.dataChannel.send(messageStr);
      }
    } else {
      // Broadcast to all participants
      this.peerConnections.forEach((peerConn) => {
        if (peerConn.dataChannel?.readyState === 'open') {
          peerConn.dataChannel.send(messageStr);
        }
      });
    }
  }

  toggleVideo(enabled: boolean): void {
    if (!this.localStream) return;
    
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled;
    }
  }

  toggleAudio(enabled: boolean): void {
    if (!this.localStream) return;
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled;
    }
  }

  getParticipants(): GroupParticipant[] {
    return Array.from(this.participants.values());
  }

  getParticipant(participantId: string): GroupParticipant | undefined {
    return this.participants.get(participantId);
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getScreenShareStream(): MediaStream | null {
    return this.screenShareStream;
  }

  isCurrentlyScreenSharing(): boolean {
    return this.isScreenSharing;
  }

  getPeerConnection(participantId: string): RTCPeerConnection | null {
    return this.peerConnections.get(participantId)?.connection || null;
  }

  getConnectionStats(participantId: string): Promise<RTCStatsReport> | null {
    const peerConn = this.peerConnections.get(participantId);
    return peerConn?.connection.getStats() || null;
  }

  cleanup(): void {
    // Close all peer connections
    this.peerConnections.forEach((peerConn) => {
      if (peerConn.dataChannel) {
        peerConn.dataChannel.close();
      }
      peerConn.connection.close();
    });
    this.peerConnections.clear();

    // Stop local streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.screenShareStream) {
      this.screenShareStream.getTracks().forEach(track => track.stop());
      this.screenShareStream = null;
    }

    // Clear participants
    this.participants.clear();
    this.isScreenSharing = false;
  }
}
import { WebRTCConfig, defaultWebRTCConfig } from './webRTCService';
import { 
  HighQualityWebRTCConfig, 
  ConnectionQualityMonitor, 
  AdaptiveBitrateController,
  createOptimalConfig,
  HIGH_QUALITY_PRESETS
} from '@/config/highQualityWebRTC';

export interface GroupParticipant {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  qualityScore?: number;
  bandwidth?: number;
  videoResolution?: string;
  audioQuality?: string;
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
  onConnectionQualityChanged?: (participantId: string, quality: string, metrics?: any) => void;
  onBitrateAdapted?: (participantId: string, newBitrate: number) => void;
  onVideoResolutionChanged?: (participantId: string, resolution: string) => void;
  onIceCandidate?: (participantId: string, candidate: RTCIceCandidateInit) => void;
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
  qualityMonitor?: ConnectionQualityMonitor;
  bitrateController?: AdaptiveBitrateController;
  currentQuality?: 'ultra' | 'high' | 'medium' | 'low';
}

export class GroupWebRTCService {
  private config: HighQualityWebRTCConfig;
  private events: GroupWebRTCEvents;
  private localStream: MediaStream | null = null;
  private participants: Map<string, GroupParticipant> = new Map();
  private peerConnections: Map<string, PeerConnection> = new Map();
  private localUserId: string;
  private isScreenSharing: boolean = false;
  private screenShareStream: MediaStream | null = null;
  private adaptiveBitrateEnabled: boolean = true;
  private qualityMonitoringEnabled: boolean = true;
  private currentVideoQuality: 'ultra' | 'high' | 'medium' | 'low' = 'high';

  constructor(localUserId: string, config: HighQualityWebRTCConfig, events: GroupWebRTCEvents = {}) {
    this.localUserId = localUserId;
    this.config = config;
    this.events = events;
    this.adaptiveBitrateEnabled = config.adaptiveBitrate ?? true;
    this.qualityMonitoringEnabled = true;
    
    console.log('🎥 GroupWebRTCService initialized with high-quality config:', {
      videoCodecs: config.videoCodecs,
      audioCodecs: config.audioCodecs,
      bandwidth: config.bandwidth,
      simulcast: config.simulcast,
      adaptiveBitrate: config.adaptiveBitrate
    });
  }

  async initializeLocalMedia(): Promise<MediaStream> {
    try {
      console.log('🎥 Initializing high-quality local media with constraints:', this.config.mediaConstraints);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: this.config.mediaConstraints.video,
        audio: this.config.mediaConstraints.audio
      });
      
      // Apply additional optimizations
      await this.optimizeLocalStream(stream);
      
      this.localStream = stream;
      this.events.onLocalStreamReady?.(stream);
      
      console.log('✅ High-quality local media initialized:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        videoSettings: stream.getVideoTracks()[0]?.getSettings(),
        audioSettings: stream.getAudioTracks()[0]?.getSettings()
      });
      
      return stream;
    } catch (error) {
      console.error('❌ Failed to get high-quality local media:', error);
      
      // Fallback to lower quality if high quality fails
      try {
        console.log('🔄 Attempting fallback to medium quality...');
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: HIGH_QUALITY_PRESETS.medium.video,
          audio: HIGH_QUALITY_PRESETS.medium.audio
        });
        
        this.localStream = fallbackStream;
        this.events.onLocalStreamReady?.(fallbackStream);
        return fallbackStream;
      } catch (fallbackError) {
        console.error('❌ Fallback media initialization also failed:', fallbackError);
        throw new Error('Could not access camera/microphone');
      }
    }
  }

  private async optimizeLocalStream(stream: MediaStream): Promise<void> {
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    if (videoTrack) {
      // Apply video optimizations
      const videoSettings = videoTrack.getSettings();
      console.log('📹 Video track settings:', videoSettings);

      // Enable advanced video processing if supported
      if ('applyConstraints' in videoTrack) {
        try {
          await videoTrack.applyConstraints({
            advanced: [
              { width: { min: 640, ideal: 1280, max: 1920 } },
              { height: { min: 360, ideal: 720, max: 1080 } },
              { frameRate: { min: 15, ideal: 30, max: 60 } }
            ]
          });
        } catch (error) {
          console.warn('⚠️ Advanced video constraints not supported:', error);
        }
      }
    }

    if (audioTrack) {
      // Apply audio optimizations
      const audioSettings = audioTrack.getSettings();
      console.log('🎤 Audio track settings:', audioSettings);

      // Enable advanced audio processing
      try {
        await audioTrack.applyConstraints({
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 48000 },
          channelCount: { ideal: 2 }
        });
      } catch (error) {
        console.warn('⚠️ Advanced audio constraints not supported:', error);
      }
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
    console.log('🔗 Creating high-quality peer connection for:', participantId);
    
    const peerConnection = new RTCPeerConnection({
      iceServers: this.config.iceServers,
      iceCandidatePoolSize: 10, // Increase for better connectivity
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    });

    // Configure high-quality encoding parameters
    this.configureHighQualityEncoding(peerConnection);

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

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.events.onIceCandidate?.(participantId, event.candidate.toJSON());
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

    // Store peer connection with quality monitoring
    const peerConn: PeerConnection = {
      id: participantId,
      userId,
      connection: peerConnection,
      dataChannel,
      remoteStream: null,
      isInitiator,
      lastQualityCheck: Date.now(),
      currentQuality: this.currentVideoQuality
    };

    // Initialize quality monitoring if enabled
    if (this.qualityMonitoringEnabled) {
      peerConn.qualityMonitor = new ConnectionQualityMonitor(peerConnection, (metrics) => {
        this.handleQualityMetricsUpdate(participantId, metrics);
      });
      peerConn.qualityMonitor.startMonitoring();
    }

    // Initialize adaptive bitrate controller if enabled
    if (this.adaptiveBitrateEnabled) {
      peerConn.bitrateController = new AdaptiveBitrateController(peerConnection);
      peerConn.bitrateController.startAdaptation();
    }

    this.peerConnections.set(participantId, peerConn);

    console.log('✅ High-quality peer connection created for:', participantId, {
      qualityMonitoring: this.qualityMonitoringEnabled,
      adaptiveBitrate: this.adaptiveBitrateEnabled,
      currentQuality: this.currentVideoQuality
    });

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

  private configureHighQualityEncoding(peerConnection: RTCPeerConnection): void {
    // Configure preferred codecs if supported
    if (this.config.videoCodecs && 'getTransceivers' in peerConnection) {
      peerConnection.addEventListener('track', (event) => {
        const transceiver = event.transceiver;
        if (transceiver && transceiver.sender.track?.kind === 'video') {
          this.setPreferredCodecs(transceiver, this.config.videoCodecs!);
        }
      });
    }
  }

  private setPreferredCodecs(transceiver: RTCRtpTransceiver, preferredCodecs: string[]): void {
    try {
      const capabilities = RTCRtpSender.getCapabilities('video');
      if (capabilities && capabilities.codecs) {
        const sortedCodecs = [...capabilities.codecs].sort((a, b) => {
          const aIndex = preferredCodecs.findIndex(codec => 
            a.mimeType.toLowerCase().includes(codec.toLowerCase())
          );
          const bIndex = preferredCodecs.findIndex(codec => 
            b.mimeType.toLowerCase().includes(codec.toLowerCase())
          );
          
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });

        transceiver.setCodecPreferences(sortedCodecs);
        console.log('📊 Configured preferred codecs:', preferredCodecs);
      }
    } catch (error) {
      console.warn('⚠️ Failed to set preferred codecs:', error);
    }
  }

  private handleQualityMetricsUpdate(participantId: string, metrics: any): void {
    const participant = this.participants.get(participantId);
    if (participant) {
      // Update participant quality information
      participant.qualityScore = metrics.qualityScore;
      participant.bandwidth = metrics.bandwidth;
      
      // Determine connection quality based on metrics
      let quality: 'excellent' | 'good' | 'poor' | 'disconnected' = 'good';
      
      if (metrics.qualityScore >= 85) {
        quality = 'excellent';
      } else if (metrics.qualityScore >= 70) {
        quality = 'good';
      } else if (metrics.qualityScore >= 40) {
        quality = 'poor';
      } else {
        quality = 'disconnected';
      }
      
      participant.connectionQuality = quality;
      
      // Update video resolution info
      if (metrics.videoWidth && metrics.videoHeight) {
        participant.videoResolution = `${metrics.videoWidth}x${metrics.videoHeight}`;
      }
      
      this.events.onParticipantUpdated?.(participant);
      this.events.onConnectionQualityChanged?.(participantId, quality, metrics);
      
      console.log('📊 Quality metrics updated for', participantId, {
        quality,
        score: metrics.qualityScore,
        bandwidth: metrics.bandwidth,
        packetLoss: metrics.packetLoss,
        rtt: metrics.rtt
      });
    }
  }

  // Public method to change video quality
  async setVideoQuality(quality: 'ultra' | 'high' | 'medium' | 'low'): Promise<void> {
    this.currentVideoQuality = quality;
    const preset = HIGH_QUALITY_PRESETS[quality];
    
    if (!this.localStream) return;
    
    try {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        await videoTrack.applyConstraints({
          width: preset.video.width,
          height: preset.video.height,
          frameRate: preset.video.frameRate
        });
        
        console.log('📹 Video quality changed to:', quality, preset.video);
        
        // Update all peer connections with new quality
        this.peerConnections.forEach(async (peerConn) => {
          const sender = peerConn.connection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender) {
            const params = sender.getParameters();
            if (params.encodings && params.encodings.length > 0) {
              params.encodings[0].maxBitrate = preset.bandwidth.video;
              await sender.setParameters(params);
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to change video quality:', error);
    }
  }

  // Public method to get current quality metrics
  getQualityMetrics(): Map<string, any> {
    const metrics = new Map();
    
    this.peerConnections.forEach((peerConn, participantId) => {
      if (peerConn.qualityMonitor) {
        metrics.set(participantId, peerConn.qualityMonitor.getMetrics());
      }
    });
    
    return metrics;
  }

  private closePeerConnection(participantId: string): void {
    const peerConn = this.peerConnections.get(participantId);
    if (peerConn) {
      // Stop quality monitoring
      if (peerConn.qualityMonitor) {
        peerConn.qualityMonitor.stopMonitoring();
      }
      
      // Stop adaptive bitrate
      if (peerConn.bitrateController) {
        peerConn.bitrateController.stopAdaptation();
      }
      
      if (peerConn.dataChannel) {
        peerConn.dataChannel.close();
      }
      peerConn.connection.close();
      this.peerConnections.delete(participantId);
      
      console.log('🔌 High-quality peer connection closed for:', participantId);
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
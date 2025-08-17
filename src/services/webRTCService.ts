export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  mediaConstraints: {
    video: MediaTrackConstraints;
    audio: MediaTrackConstraints;
  };
  enableVideoFilters?: boolean;
}

export interface PeerConnectionEvents {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
  onDataChannelMessage?: (message: any) => void;
  onDataChannelOpen?: () => void;
  onDataChannelClose?: () => void;
  onFilteredStream?: (stream: MediaStream) => void;
}

import { VideoFilterService, FilterConfig } from './videoFilterService';

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private filteredStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private config: WebRTCConfig;
  private events: PeerConnectionEvents;
  private videoFilterService: VideoFilterService | null = null;
  private localVideoElement: HTMLVideoElement | null = null;

  constructor(config: WebRTCConfig, events: PeerConnectionEvents = {}) {
    this.config = config;
    this.events = events;
    
    // Initialize video filter service if enabled
    if (config.enableVideoFilters) {
      this.videoFilterService = new VideoFilterService();
      // Adjust performance based on device capabilities
      this.videoFilterService.adjustPerformance();
    }
  }

  async initializeLocalMedia(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: this.config.mediaConstraints.video,
        audio: this.config.mediaConstraints.audio
      });
      
      this.localStream = stream;
      this.events.onLocalStream?.(stream);
      
      // Set up video filtering if enabled
      if (this.config.enableVideoFilters && this.videoFilterService) {
        this.setupVideoFiltering(stream);
      }
      
      return stream;
    } catch (error) {
      console.error('Failed to get local media:', error);
      throw new Error('Could not access camera/microphone');
    }
  }

  // Alias for backward compatibility and clearer naming
  async initializeMedia(): Promise<MediaStream> {
    return this.initializeLocalMedia();
  }

  private setupVideoFiltering(stream: MediaStream): void {
    if (!this.videoFilterService) return;

    // Create a video element to process the stream
    this.localVideoElement = document.createElement('video');
    this.localVideoElement.srcObject = stream;
    this.localVideoElement.autoplay = true;
    this.localVideoElement.muted = true;
    this.localVideoElement.playsInline = true;

    // Wait for video to be ready and start filtering
    this.localVideoElement.onloadedmetadata = () => {
      if (this.videoFilterService && this.localVideoElement) {
        this.filteredStream = this.videoFilterService.startProcessing(this.localVideoElement);
        this.events.onFilteredStream?.(this.filteredStream);
      }
    };
  }

  public enableVideoFilters(enabled: boolean): void {
    if (!this.videoFilterService) {
      if (enabled) {
        this.videoFilterService = new VideoFilterService();
        this.videoFilterService.adjustPerformance();
        if (this.localStream) {
          this.setupVideoFiltering(this.localStream);
        }
      }
      return;
    }

    if (enabled && this.localStream && !this.filteredStream) {
      this.setupVideoFiltering(this.localStream);
    } else if (!enabled && this.filteredStream) {
      this.videoFilterService.stopProcessing();
      this.filteredStream = null;
    }
  }

  public updateFilterConfig(config: Partial<FilterConfig>): void {
    this.videoFilterService?.updateConfig(config);
  }

  public getFilterConfig(): FilterConfig | null {
    return this.videoFilterService?.getConfig() || null;
  }

  createPeerConnection(): RTCPeerConnection {
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    console.log('🚀 Creating new peer connection...');
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.config.iceServers
    });

    // Add local stream tracks (use filtered stream if available)
    const streamToUse = this.filteredStream || this.localStream;
    if (streamToUse) {
      console.log('📹 Adding local tracks to peer connection:', streamToUse.getTracks().length);
      streamToUse.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, streamToUse!);
      });
    } else {
      console.warn('⚠️ No local stream available to add to peer connection');
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('📺 Remote track received:', event.track.kind);
      const [remoteStream] = event.streams;
      this.remoteStream = remoteStream;
      this.events.onRemoteStream?.(remoteStream);
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection!.connectionState;
      console.log('🔗 Peer connection state changed:', state);
      this.events.onConnectionStateChange?.(state);
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection!.iceConnectionState;
      console.log('🧊 ICE connection state changed:', state);
      this.events.onIceConnectionStateChange?.(state);
    };

    // Handle ICE gathering state changes
    this.peerConnection.onicegatheringstatechange = () => {
      const state = this.peerConnection!.iceGatheringState;
      console.log('🧊 ICE gathering state changed:', state);
    };

    // ICE candidate handling is now done externally to allow proper signaling
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 ICE candidate generated:', event.candidate.candidate);
      } else {
        console.log('🧊 ICE gathering completed');
      }
      // Note: ICE candidates are handled by the external onicecandidate handler
      // This is set up in the useVideoChat hook
    };

    // Create data channel for chat
    this.dataChannel = this.peerConnection.createDataChannel('chat', {
      ordered: true
    });

    this.setupDataChannel(this.dataChannel);

    // Handle incoming data channels
    this.peerConnection.ondatachannel = (event) => {
      console.log('💬 Incoming data channel received');
      this.setupDataChannel(event.channel);
    };

    console.log('✅ Peer connection created successfully');
    return this.peerConnection;
  }

  private setupDataChannel(channel: RTCDataChannel) {
    channel.onopen = () => {
      console.log('Data channel opened');
      this.events.onDataChannelOpen?.();
    };

    channel.onclose = () => {
      console.log('Data channel closed');
      this.events.onDataChannelClose?.();
    };

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.events.onDataChannelMessage?.(message);
      } catch (error) {
        console.error('Failed to parse data channel message:', error);
      }
    };
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(description);
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.addIceCandidate(candidate);
  }

  sendMessage(message: any): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.warn('Data channel not ready for sending messages');
      return;
    }

    try {
      this.dataChannel.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send message:', error);
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

  getConnectionStats(): Promise<RTCStatsReport> | null {
    if (!this.peerConnection) return null;
    return this.peerConnection.getStats();
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getFilteredStream(): MediaStream | null {
    return this.filteredStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  getDataChannel(): RTCDataChannel | null {
    return this.dataChannel;
  }

  cleanup(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.filteredStream) {
      this.filteredStream.getTracks().forEach(track => track.stop());
      this.filteredStream = null;
    }

    if (this.videoFilterService) {
      this.videoFilterService.cleanup();
      this.videoFilterService = null;
    }

    if (this.localVideoElement) {
      this.localVideoElement.srcObject = null;
      this.localVideoElement = null;
    }

    this.remoteStream = null;
  }
}

// Default configuration
export const defaultWebRTCConfig: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ],
  mediaConstraints: {
    video: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 }
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000
    }
  },
  enableVideoFilters: true
};
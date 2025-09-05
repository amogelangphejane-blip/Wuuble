import { WebRTCConfig } from '@/services/webRTCService';

export interface HighQualityWebRTCConfig extends WebRTCConfig {
  videoCodecs?: string[];
  audioCodecs?: string[];
  bandwidth?: {
    video: number;
    audio: number;
  };
  simulcast?: boolean;
  adaptiveBitrate?: boolean;
  connectionQuality?: 'auto' | 'high' | 'medium' | 'low';
  screenShareOptimization?: boolean;
}

export interface ConnectionQualityMetrics {
  bandwidth: number;
  packetLoss: number;
  rtt: number;
  jitter: number;
  qualityScore: number;
}

export interface AdaptiveSettings {
  video: {
    width: number;
    height: number;
    frameRate: number;
    bitrate: number;
  };
  audio: {
    sampleRate: number;
    bitrate: number;
    channels: number;
  };
}

// High-quality WebRTC configuration presets
export const HIGH_QUALITY_PRESETS = {
  // Ultra High Quality - For high-end devices with excellent network
  ultra: {
    video: {
      width: { ideal: 1920, max: 1920 },
      height: { ideal: 1080, max: 1080 },
      frameRate: { ideal: 30, max: 60 },
      aspectRatio: 16/9
    },
    audio: {
      sampleRate: 48000,
      channelCount: 2,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      suppressLocalAudioPlayback: true
    },
    bandwidth: {
      video: 2500000, // 2.5 Mbps
      audio: 128000   // 128 kbps
    }
  },

  // High Quality - For good devices with stable network
  high: {
    video: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 30 },
      aspectRatio: 16/9
    },
    audio: {
      sampleRate: 48000,
      channelCount: 2,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      suppressLocalAudioPlayback: true
    },
    bandwidth: {
      video: 1500000, // 1.5 Mbps
      audio: 64000    // 64 kbps
    }
  },

  // Medium Quality - For average devices/network
  medium: {
    video: {
      width: { ideal: 960, max: 1280 },
      height: { ideal: 540, max: 720 },
      frameRate: { ideal: 24, max: 30 },
      aspectRatio: 16/9
    },
    audio: {
      sampleRate: 44100,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    bandwidth: {
      video: 800000,  // 800 kbps
      audio: 32000    // 32 kbps
    }
  },

  // Low Quality - For low-end devices/poor network
  low: {
    video: {
      width: { ideal: 640, max: 960 },
      height: { ideal: 360, max: 540 },
      frameRate: { ideal: 15, max: 24 },
      aspectRatio: 16/9
    },
    audio: {
      sampleRate: 22050,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    bandwidth: {
      video: 400000,  // 400 kbps
      audio: 16000    // 16 kbps
    }
  },

  // Screen Share Optimized - For presentations and demos
  screenShare: {
    video: {
      width: { ideal: 1920, max: 3840 },
      height: { ideal: 1080, max: 2160 },
      frameRate: { ideal: 10, max: 15 }, // Lower FPS for screen content
      aspectRatio: 16/9
    },
    audio: {
      sampleRate: 48000,
      channelCount: 2,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    bandwidth: {
      video: 1000000, // 1 Mbps - optimized for screen content
      audio: 64000    // 64 kbps
    }
  }
};

// Enhanced ICE servers for better connectivity
export const ENHANCED_ICE_SERVERS: RTCIceServer[] = [
  // Google STUN servers
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  
  // Cloudflare STUN servers
  { urls: 'stun:stun.cloudflare.com:3478' },
  
  // Mozilla STUN servers
  { urls: 'stun:stun.services.mozilla.com' },
  
  // Additional fallback STUN servers
  { urls: 'stun:stun.stunprotocol.org:3478' },
  { urls: 'stun:stun.voiparound.com' },
  { urls: 'stun:stun.voipbuster.com' }
];

// Preferred codec order for high quality
export const PREFERRED_VIDEO_CODECS = [
  'VP9',    // Best compression for video calls
  'VP8',    // Good fallback
  'H264',   // Wide compatibility
  'AV1'     // Future-proof, if supported
];

export const PREFERRED_AUDIO_CODECS = [
  'opus',   // Best for voice
  'G722',   // High quality
  'PCMU',   // Fallback
  'PCMA'    // Fallback
];

export class ConnectionQualityMonitor {
  private peerConnection: RTCPeerConnection;
  private metrics: ConnectionQualityMetrics = {
    bandwidth: 0,
    packetLoss: 0,
    rtt: 0,
    jitter: 0,
    qualityScore: 0
  };
  private monitoringInterval: NodeJS.Timeout | null = null;
  private onQualityChange?: (quality: ConnectionQualityMetrics) => void;

  constructor(peerConnection: RTCPeerConnection, onQualityChange?: (quality: ConnectionQualityMetrics) => void) {
    this.peerConnection = peerConnection;
    this.onQualityChange = onQualityChange;
  }

  startMonitoring(intervalMs: number = 2000): void {
    this.monitoringInterval = setInterval(async () => {
      await this.updateMetrics();
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async updateMetrics(): Promise<void> {
    try {
      const stats = await this.peerConnection.getStats();
      let inboundVideo: RTCInboundRtpStreamStats | null = null;
      let outboundVideo: RTCOutboundRtpStreamStats | null = null;
      let candidatePair: RTCIceCandidatePairStats | null = null;

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          inboundVideo = report as RTCInboundRtpStreamStats;
        } else if (report.type === 'outbound-rtp' && report.kind === 'video') {
          outboundVideo = report as RTCOutboundRtpStreamStats;
        } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          candidatePair = report as RTCIceCandidatePairStats;
        }
      });

      // Calculate bandwidth
      if (inboundVideo) {
        this.metrics.bandwidth = (inboundVideo.bytesReceived || 0) * 8; // Convert to bits
      }

      // Calculate packet loss
      if (inboundVideo) {
        const packetsLost = inboundVideo.packetsLost || 0;
        const packetsReceived = inboundVideo.packetsReceived || 1;
        this.metrics.packetLoss = (packetsLost / (packetsLost + packetsReceived)) * 100;
      }

      // Calculate RTT and jitter
      if (candidatePair) {
        this.metrics.rtt = candidatePair.currentRoundTripTime || 0;
      }

      if (inboundVideo) {
        this.metrics.jitter = inboundVideo.jitter || 0;
      }

      // Calculate overall quality score (0-100)
      this.metrics.qualityScore = this.calculateQualityScore();

      this.onQualityChange?.(this.metrics);
    } catch (error) {
      console.warn('Failed to update connection metrics:', error);
    }
  }

  private calculateQualityScore(): number {
    let score = 100;

    // Penalize high packet loss
    score -= this.metrics.packetLoss * 2;

    // Penalize high RTT
    if (this.metrics.rtt > 0.3) score -= 20;
    else if (this.metrics.rtt > 0.2) score -= 10;
    else if (this.metrics.rtt > 0.1) score -= 5;

    // Penalize low bandwidth (below 500kbps)
    if (this.metrics.bandwidth < 500000) {
      score -= (500000 - this.metrics.bandwidth) / 10000;
    }

    // Penalize high jitter
    if (this.metrics.jitter > 0.05) score -= 15;
    else if (this.metrics.jitter > 0.03) score -= 10;
    else if (this.metrics.jitter > 0.01) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  getMetrics(): ConnectionQualityMetrics {
    return { ...this.metrics };
  }
}

export class AdaptiveBitrateController {
  private peerConnection: RTCPeerConnection;
  private qualityMonitor: ConnectionQualityMonitor;
  private currentSettings: AdaptiveSettings;
  private targetQualityScore: number = 80;

  constructor(peerConnection: RTCPeerConnection) {
    this.peerConnection = peerConnection;
    this.qualityMonitor = new ConnectionQualityMonitor(peerConnection, (metrics) => {
      this.adaptToQuality(metrics);
    });
    
    // Start with high quality settings
    this.currentSettings = {
      video: HIGH_QUALITY_PRESETS.high.bandwidth,
      audio: HIGH_QUALITY_PRESETS.high.bandwidth
    } as AdaptiveSettings;
  }

  startAdaptation(): void {
    this.qualityMonitor.startMonitoring(3000); // Check every 3 seconds
  }

  stopAdaptation(): void {
    this.qualityMonitor.stopMonitoring();
  }

  private async adaptToQuality(metrics: ConnectionQualityMetrics): Promise<void> {
    const qualityScore = metrics.qualityScore;
    
    if (qualityScore < 60) {
      // Poor quality - reduce to low settings
      await this.applyQualityPreset('low');
    } else if (qualityScore < 75) {
      // Medium quality
      await this.applyQualityPreset('medium');
    } else if (qualityScore > 85) {
      // Good quality - can use high settings
      await this.applyQualityPreset('high');
    }
    // 75-85 range: maintain current settings
  }

  private async applyQualityPreset(preset: keyof typeof HIGH_QUALITY_PRESETS): Promise<void> {
    const settings = HIGH_QUALITY_PRESETS[preset];
    
    try {
      // Get the video sender
      const sender = this.peerConnection.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );

      if (sender && sender.track) {
        // Apply video constraints
        await sender.track.applyConstraints({
          width: settings.video.width,
          height: settings.video.height,
          frameRate: settings.video.frameRate
        });

        // Update encoding parameters
        const params = sender.getParameters();
        if (params.encodings && params.encodings.length > 0) {
          params.encodings[0].maxBitrate = settings.bandwidth.video;
          await sender.setParameters(params);
        }
      }

      console.log(`📊 Adapted video quality to: ${preset}`, settings);
    } catch (error) {
      console.warn('Failed to adapt video quality:', error);
    }
  }

  getCurrentSettings(): AdaptiveSettings {
    return { ...this.currentSettings };
  }
}

// Factory function to create high-quality WebRTC config
export function createHighQualityConfig(
  qualityLevel: keyof typeof HIGH_QUALITY_PRESETS = 'high',
  options: Partial<HighQualityWebRTCConfig> = {}
): HighQualityWebRTCConfig {
  const preset = HIGH_QUALITY_PRESETS[qualityLevel];
  
  return {
    iceServers: ENHANCED_ICE_SERVERS,
    mediaConstraints: {
      video: {
        ...preset.video,
        facingMode: 'user'
      },
      audio: preset.audio
    },
    videoCodecs: PREFERRED_VIDEO_CODECS,
    audioCodecs: PREFERRED_AUDIO_CODECS,
    bandwidth: preset.bandwidth,
    simulcast: true,
    adaptiveBitrate: true,
    connectionQuality: qualityLevel === 'ultra' ? 'high' : qualityLevel,
    screenShareOptimization: false,
    enableVideoFilters: true,
    ...options
  };
}

// Device capability detection
export function detectDeviceCapabilities(): {
  supportsHD: boolean;
  supports4K: boolean;
  supportsHighFrameRate: boolean;
  recommendedPreset: keyof typeof HIGH_QUALITY_PRESETS;
} {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  // Basic capability detection
  const supportsHD = window.screen.width >= 1280 && window.screen.height >= 720;
  const supports4K = window.screen.width >= 3840 && window.screen.height >= 2160;
  const supportsHighFrameRate = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
  
  // Memory and performance hints
  const memory = (navigator as any).deviceMemory || 4; // GB
  const cores = navigator.hardwareConcurrency || 4;
  
  let recommendedPreset: keyof typeof HIGH_QUALITY_PRESETS = 'medium';
  
  if (memory >= 8 && cores >= 8 && supports4K) {
    recommendedPreset = 'ultra';
  } else if (memory >= 4 && cores >= 4 && supportsHD) {
    recommendedPreset = 'high';
  } else if (memory >= 2 && cores >= 2) {
    recommendedPreset = 'medium';
  } else {
    recommendedPreset = 'low';
  }
  
  return {
    supportsHD,
    supports4K,
    supportsHighFrameRate,
    recommendedPreset
  };
}

// Network quality estimation
export async function estimateNetworkQuality(): Promise<{
  downloadSpeed: number; // Mbps
  uploadSpeed: number;   // Mbps
  latency: number;       // ms
  recommendedPreset: keyof typeof HIGH_QUALITY_PRESETS;
}> {
  try {
    // Use Network Information API if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    let downloadSpeed = 10; // Default fallback
    let latency = 50;
    
    if (connection) {
      downloadSpeed = connection.downlink || 10;
      latency = connection.rtt || 50;
    }
    
    // Estimate upload speed (typically 10-20% of download)
    const uploadSpeed = downloadSpeed * 0.15;
    
    let recommendedPreset: keyof typeof HIGH_QUALITY_PRESETS = 'medium';
    
    if (downloadSpeed >= 25 && uploadSpeed >= 5 && latency < 50) {
      recommendedPreset = 'ultra';
    } else if (downloadSpeed >= 10 && uploadSpeed >= 2 && latency < 100) {
      recommendedPreset = 'high';
    } else if (downloadSpeed >= 5 && uploadSpeed >= 1 && latency < 200) {
      recommendedPreset = 'medium';
    } else {
      recommendedPreset = 'low';
    }
    
    return {
      downloadSpeed,
      uploadSpeed,
      latency,
      recommendedPreset
    };
  } catch (error) {
    console.warn('Failed to estimate network quality:', error);
    return {
      downloadSpeed: 10,
      uploadSpeed: 1.5,
      latency: 100,
      recommendedPreset: 'medium'
    };
  }
}

// Auto-configure based on device and network capabilities
export async function createOptimalConfig(): Promise<HighQualityWebRTCConfig> {
  const deviceCaps = detectDeviceCapabilities();
  const networkQuality = await estimateNetworkQuality();
  
  // Choose the more conservative preset between device and network capabilities
  const devicePreset = deviceCaps.recommendedPreset;
  const networkPreset = networkQuality.recommendedPreset;
  
  const presets = ['low', 'medium', 'high', 'ultra'];
  const deviceIndex = presets.indexOf(devicePreset);
  const networkIndex = presets.indexOf(networkPreset);
  
  const optimalPreset = presets[Math.min(deviceIndex, networkIndex)] as keyof typeof HIGH_QUALITY_PRESETS;
  
  console.log('🎯 Optimal WebRTC configuration:', {
    devicePreset,
    networkPreset,
    chosenPreset: optimalPreset,
    deviceCapabilities: deviceCaps,
    networkQuality
  });
  
  return createHighQualityConfig(optimalPreset, {
    adaptiveBitrate: true,
    simulcast: deviceCaps.supportsHD
  });
}
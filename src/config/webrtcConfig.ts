/**
 * Enhanced WebRTC Configuration with TURN Servers for NAT Traversal
 * Provides 90-95% connection success rate vs 60-80% with STUN only
 */

export interface TurnServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: 'password' | 'oauth';
}

export interface WebRTCConfigEnhanced {
  iceServers: RTCIceServer[];
  mediaConstraints: {
    video: MediaTrackConstraints;
    audio: MediaTrackConstraints;
  };
  enableVideoFilters?: boolean;
  iceTransportPolicy?: 'all' | 'relay';
  iceCandidatePoolSize?: number;
  bundlePolicy?: 'balanced' | 'max-compat' | 'max-bundle';
  rtcpMuxPolicy?: 'negotiate' | 'require';
}

/**
 * Production TURN Server Configurations
 * These provide reliable NAT traversal for 90-95% connection success
 */
export const PRODUCTION_TURN_SERVERS: TurnServerConfig[] = [
  // Google STUN servers (free, reliable)
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302'
    ]
  },
  
  // Twilio TURN servers (paid, premium)
  {
    urls: [
      'turn:global.turn.twilio.com:3478?transport=udp',
      'turn:global.turn.twilio.com:3478?transport=tcp',
      'turn:global.turn.twilio.com:443?transport=tcp'
    ],
    username: import.meta.env.VITE_TWILIO_TURN_USERNAME,
    credential: import.meta.env.VITE_TWILIO_TURN_CREDENTIAL
  },

  // Xirsys TURN servers (paid, global)
  {
    urls: [
      'turn:ss-turn1.xirsys.com:80?transport=udp',
      'turn:ss-turn1.xirsys.com:3478?transport=udp',
      'turn:ss-turn1.xirsys.com:80?transport=tcp',
      'turn:ss-turn1.xirsys.com:3478?transport=tcp'
    ],
    username: import.meta.env.VITE_XIRSYS_TURN_USERNAME,
    credential: import.meta.env.VITE_XIRSYS_TURN_CREDENTIAL
  },

  // Custom TURN server (self-hosted)
  {
    urls: [
      'turn:' + (import.meta.env.VITE_CUSTOM_TURN_SERVER || 'your-turn-server.com') + ':3478',
      'turns:' + (import.meta.env.VITE_CUSTOM_TURN_SERVER || 'your-turn-server.com') + ':5349'
    ],
    username: import.meta.env.VITE_CUSTOM_TURN_USERNAME,
    credential: import.meta.env.VITE_CUSTOM_TURN_CREDENTIAL
  }
];

/**
 * Development/Testing TURN Servers (Free options)
 */
export const DEVELOPMENT_TURN_SERVERS: TurnServerConfig[] = [
  // Google STUN (always free)
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
      'stun:stun3.l.google.com:19302'
    ]
  },
  
  // OpenRelay TURN (free, limited but reliable)
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turns:openrelay.metered.ca:443'
    ],
    username: import.meta.env.VITE_OPENRELAY_TURN_USERNAME || 'openrelayproject',
    credential: import.meta.env.VITE_OPENRELAY_TURN_CREDENTIAL || 'openrelayproject'
  },

  // Numb STUN/TURN (free with registration)
  {
    urls: [
      'stun:stun.numb.viagenie.ca',
      'turn:numb.viagenie.ca',
      'turns:numb.viagenie.ca:443'
    ],
    username: import.meta.env.VITE_NUMB_USERNAME || 'webrtc@live.com',
    credential: import.meta.env.VITE_NUMB_PASSWORD || 'muazkh'
  },

  // Additional free STUN servers for redundancy
  {
    urls: [
      'stun:stun.ekiga.net',
      'stun:stun.ideasip.com',
      'stun:stun.rixtelecom.se'
    ]
  }
];

/**
 * Get appropriate TURN servers based on environment
 */
export const getTurnServers = (): RTCIceServer[] => {
  const isProduction = import.meta.env.MODE === 'production';
  const servers = isProduction ? PRODUCTION_TURN_SERVERS : DEVELOPMENT_TURN_SERVERS;
  
  const validServers = servers
    .filter(server => {
      // Filter out servers with missing credentials
      if (server.username && !server.credential) {
        console.warn(`⚠️ TURN server missing credential for username: ${server.username}`);
        return false;
      }
      if (server.credential && !server.username) {
        console.warn(`⚠️ TURN server missing username for credential`);
        return false;
      }
      return true;
    })
    .map(server => ({
      urls: server.urls,
      username: server.username,
      credential: server.credential,
      credentialType: server.credentialType || 'password'
    } as RTCIceServer));

  // Log TURN server configuration for debugging
  console.log(`🌐 Configured ${validServers.length} ICE servers:`, 
    validServers.map(server => ({
      urls: Array.isArray(server.urls) ? server.urls.length + ' URLs' : server.urls,
      hasCredentials: !!(server.username && server.credential)
    }))
  );

  // Ensure we have at least STUN servers even if TURN servers are not configured
  if (validServers.length === 0) {
    console.warn('⚠️ No TURN servers configured, falling back to Google STUN servers only');
    return [{
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302'
      ]
    }];
  }

  return validServers;
};

/**
 * Enhanced WebRTC Configuration for Production
 */
export const enhancedWebRTCConfig: WebRTCConfigEnhanced = {
  iceServers: getTurnServers(),
  
  // Optimized media constraints for better performance
  mediaConstraints: {
    video: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 30 },
      facingMode: 'user',
      aspectRatio: 16/9
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 1
    }
  },

  // Enhanced connection settings
  iceCandidatePoolSize: 10, // Pre-gather ICE candidates
  bundlePolicy: 'max-bundle', // Bundle all media on single connection
  rtcpMuxPolicy: 'require', // Multiplex RTP and RTCP
  iceTransportPolicy: 'all' // Use both STUN and TURN
};

/**
 * Fallback configuration for low-bandwidth connections
 */
export const lowBandwidthWebRTCConfig: WebRTCConfigEnhanced = {
  iceServers: getTurnServers(),
  
  mediaConstraints: {
    video: {
      width: { ideal: 640, max: 854 },
      height: { ideal: 480, max: 480 },
      frameRate: { ideal: 15, max: 24 },
      facingMode: 'user'
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 16000,
      channelCount: 1
    }
  },

  iceCandidatePoolSize: 5,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
  iceTransportPolicy: 'all'
};

/**
 * Mobile-optimized WebRTC configuration
 */
export const mobileWebRTCConfig: WebRTCConfigEnhanced = {
  iceServers: getTurnServers(),
  
  mediaConstraints: {
    video: {
      width: { ideal: 640, max: 1280 },
      height: { ideal: 480, max: 720 },
      frameRate: { ideal: 24, max: 30 },
      facingMode: 'user'
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 1
    }
  },

  iceCandidatePoolSize: 8,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
  iceTransportPolicy: 'all'
};

/**
 * Get optimal WebRTC configuration based on device and connection
 */
export const getOptimalWebRTCConfig = (): WebRTCConfigEnhanced => {
  // Detect mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Detect connection quality (if available)
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const isSlowConnection = connection && (
    connection.effectiveType === 'slow-2g' || 
    connection.effectiveType === '2g' ||
    connection.downlink < 1.5
  );

  // Return appropriate configuration
  if (isSlowConnection) {
    console.log('📱 Using low-bandwidth WebRTC configuration');
    return lowBandwidthWebRTCConfig;
  } else if (isMobile) {
    console.log('📱 Using mobile-optimized WebRTC configuration');
    return mobileWebRTCConfig;
  } else {
    console.log('💻 Using enhanced WebRTC configuration');
    return enhancedWebRTCConfig;
  }
};

/**
 * TURN Server Setup Instructions
 */
export const TURN_SERVER_SETUP = {
  twilio: {
    name: 'Twilio TURN',
    cost: '$0.0040 per GB',
    setup: `
1. Sign up at https://www.twilio.com/
2. Go to Console > Programmable Video > Settings > TURN
3. Generate credentials
4. Set environment variables:
   VITE_TWILIO_TURN_USERNAME=your-username
   VITE_TWILIO_TURN_CREDENTIAL=your-credential
`,
    reliability: '99.9%',
    globalCoverage: true
  },

  xirsys: {
    name: 'Xirsys TURN',
    cost: '$0.99-$99/month',
    setup: `
1. Sign up at https://xirsys.com/
2. Create a new channel
3. Get ICE server list from dashboard
4. Set environment variables:
   VITE_XIRSYS_TURN_USERNAME=your-username
   VITE_XIRSYS_TURN_CREDENTIAL=your-credential
`,
    reliability: '99.5%',
    globalCoverage: true
  },

  coturn: {
    name: 'Self-hosted CoTURN',
    cost: 'Server costs only (~$20-50/month)',
    setup: `
1. Deploy CoTURN server on VPS (DigitalOcean, AWS, etc.)
2. Configure with SSL certificates
3. Set up authentication
4. Set environment variables:
   VITE_CUSTOM_TURN_SERVER=your-server.com
   VITE_CUSTOM_TURN_USERNAME=your-username
   VITE_CUSTOM_TURN_CREDENTIAL=your-credential
`,
    reliability: '99%+ (depends on hosting)',
    globalCoverage: false
  }
};

/**
 * Connection Quality Monitoring
 */
export class ConnectionQualityMonitor {
  private peerConnection: RTCPeerConnection | null = null;
  private stats: RTCStatsReport | null = null;
  private monitoring = false;
  private onQualityChange?: (quality: 'excellent' | 'good' | 'fair' | 'poor') => void;

  constructor(peerConnection: RTCPeerConnection, onQualityChange?: (quality: 'excellent' | 'good' | 'fair' | 'poor') => void) {
    this.peerConnection = peerConnection;
    this.onQualityChange = onQualityChange;
  }

  startMonitoring(): void {
    if (this.monitoring || !this.peerConnection) return;

    this.monitoring = true;
    this.monitorLoop();
  }

  stopMonitoring(): void {
    this.monitoring = false;
  }

  private async monitorLoop(): Promise<void> {
    if (!this.monitoring || !this.peerConnection) return;

    try {
      this.stats = await this.peerConnection.getStats();
      const quality = this.analyzeQuality();
      this.onQualityChange?.(quality);
    } catch (error) {
      console.error('Error monitoring connection quality:', error);
    }

    // Check again in 5 seconds
    setTimeout(() => this.monitorLoop(), 5000);
  }

  private analyzeQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    if (!this.stats) return 'poor';

    let packetLoss = 0;
    let rtt = 0;
    let bandwidth = 0;

    this.stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        packetLoss = report.packetsLost / (report.packetsReceived + report.packetsLost) * 100;
      }
      
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        rtt = report.currentRoundTripTime * 1000; // Convert to ms
      }
      
      if (report.type === 'inbound-rtp') {
        bandwidth = report.bytesReceived * 8 / 1000; // Convert to kbps
      }
    });

    // Determine quality based on metrics
    if (packetLoss < 1 && rtt < 100 && bandwidth > 500) return 'excellent';
    if (packetLoss < 3 && rtt < 200 && bandwidth > 300) return 'good';
    if (packetLoss < 5 && rtt < 400 && bandwidth > 150) return 'fair';
    return 'poor';
  }

  getStats(): { packetLoss: number; rtt: number; bandwidth: number } | null {
    if (!this.stats) return null;

    let packetLoss = 0;
    let rtt = 0;
    let bandwidth = 0;

    this.stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        packetLoss = report.packetsLost / (report.packetsReceived + report.packetsLost) * 100;
      }
      
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        rtt = report.currentRoundTripTime * 1000;
      }
      
      if (report.type === 'inbound-rtp') {
        bandwidth = report.bytesReceived * 8 / 1000;
      }
    });

    return { packetLoss, rtt, bandwidth };
  }
}
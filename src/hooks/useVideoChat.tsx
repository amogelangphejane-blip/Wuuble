import { useState, useRef, useEffect, useCallback } from 'react';
import { WebRTCService, defaultWebRTCConfig, WebRTCConfig } from '@/services/webRTCService';
import { SignalingService, createSignalingService, SignalingMessage } from '@/services/signalingService';
import { FilterConfig, VideoFilterService } from '@/services/videoFilterService';
import { useToast } from '@/hooks/use-toast';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'disconnected';

export interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
}

export interface UseVideoChatOptions {
  webRTCConfig?: WebRTCConfig;
  useMockSignaling?: boolean;
  autoConnect?: boolean;
}

export interface UseVideoChatReturn {
  // Connection state
  connectionStatus: ConnectionStatus;
  connectionQuality: ConnectionQuality;
  isSearching: boolean;
  partnerConnected: boolean;
  cameraPermission: 'pending' | 'granted' | 'denied';
  
  // Media state
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isRemoteAudioEnabled: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  
  // Video filter state
  isVideoFiltersEnabled: boolean;
  filterConfig: FilterConfig | null;
  
  // Chat state
  messages: ChatMessage[];
  unreadMessages: number;
  
  // Actions
  startChat: () => Promise<void>;
  endChat: () => void;
  nextPartner: () => void;
  sendMessage: (text: string) => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  toggleRemoteAudio: () => void;
  markMessagesAsRead: () => void;
  
  // Video filter actions
  toggleVideoFilters: () => void;
  updateFilterConfig: (config: Partial<FilterConfig>) => void;
  setFilterPreset: (preset: string) => void;
  toggleIndividualFilter: (filterType: keyof FilterConfig) => void;
  updateFilterIntensity: (filterType: keyof FilterConfig, value: number) => void;
  
  // Utils
  getConnectionQualityIcon: () => React.ReactNode;
  getConnectionQualityText: () => string;
}

export const useVideoChat = (options: UseVideoChatOptions = {}): UseVideoChatReturn => {
  const {
    webRTCConfig = defaultWebRTCConfig,
    useMockSignaling = true,
    autoConnect = false
  } = options;

  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('disconnected');
  const [isSearching, setIsSearching] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Media state
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isRemoteAudioEnabled, setIsRemoteAudioEnabled] = useState(true);

  // Video filter state
  const [isVideoFiltersEnabled, setIsVideoFiltersEnabled] = useState(false);
  const [filterConfig, setFilterConfig] = useState<FilterConfig | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webRTCServiceRef = useRef<WebRTCService | null>(null);
  const signalingServiceRef = useRef<SignalingService | null>(null);
  const partnerIdRef = useRef<string | null>(null);

  const { toast } = useToast();

  // Generate unique user ID
  const userId = useRef(Math.random().toString(36).substr(2, 9)).current;

  // Initialize services
  const initializeServices = useCallback(async () => {
    try {
      // Prevent multiple initializations
      if (webRTCServiceRef.current || signalingServiceRef.current) {
        console.log('Services already initialized, skipping...');
        return;
      }

      // Initialize WebRTC service
      webRTCServiceRef.current = new WebRTCService(webRTCConfig, {
        onLocalStream: (stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        },
        onFilteredStream: (stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        },
        onRemoteStream: (stream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
          setPartnerConnected(true);
        },
        onConnectionStateChange: (state) => {
          if (state === 'connected') {
            setConnectionStatus('connected');
            setConnectionQuality('excellent');
            setReconnectAttempts(0);
          } else if (state === 'disconnected' || state === 'failed') {
            handleConnectionLost();
          }
        },
        onDataChannelMessage: (message: ChatMessage) => {
          setMessages(prev => [...prev, { ...message, isOwn: false }]);
          setUnreadMessages(prev => prev + 1);
        }
      });

      // Initialize signaling service
      signalingServiceRef.current = createSignalingService(userId, {
        onMessage: handleSignalingMessage,
        onUserJoined: (partnerId) => {
          partnerIdRef.current = partnerId;
          initiateWebRTCConnection();
        },
        onUserLeft: () => {
          handlePartnerLeft();
        },
        onError: (error) => {
          toast({
            title: "Connection Error",
            description: error,
            variant: "destructive"
          });
        }
      }, useMockSignaling);

      // Initialize local media with better error handling
      try {
        await webRTCServiceRef.current.initializeMedia();
        setCameraPermission('granted');
      } catch (mediaError: any) {
        console.error('Media initialization failed:', mediaError);
        
        // Handle specific camera/microphone errors
        if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
          setCameraPermission('denied');
          toast({
            title: "Camera Access Blocked",
            description: "Please allow camera and microphone access in your browser settings, then click 'Enable Camera' to try again.",
            variant: "destructive"
          });
        } else if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
          setCameraPermission('denied');
          toast({
            title: "No Camera Found",
            description: "No camera or microphone detected. Please check your device connections.",
            variant: "destructive"
          });
        } else if (mediaError.name === 'NotReadableError' || mediaError.name === 'TrackStartError') {
          setCameraPermission('denied');
          toast({
            title: "Camera In Use",
            description: "Your camera might be in use by another application. Please close other apps and try again.",
            variant: "destructive"
          });
        } else if (mediaError.name === 'OverconstrainedError' || mediaError.name === 'ConstraintNotSatisfiedError') {
          setCameraPermission('denied');
          toast({
            title: "Camera Settings Issue",
            description: "Camera settings are not supported. Try refreshing the page.",
            variant: "destructive"
          });
        } else {
          setCameraPermission('denied');
          toast({
            title: "Camera Access Failed",
            description: "Unable to access camera. Please check your browser permissions and try again.",
            variant: "destructive"
          });
        }
        return; // Don't proceed if media initialization failed
      }

      // Connect to signaling server
      await signalingServiceRef.current.connect();

      if (autoConnect) {
        await startChat();
      }

    } catch (error) {
      console.error('Failed to initialize services:', error);
      setCameraPermission('denied');
      toast({
        title: "Setup Failed",
        description: "Could not connect to server. Please check your internet connection and try again.",
        variant: "destructive"
      });
    }
  }, []); // Fixed: Empty dependency array to prevent infinite loop

  // Handle signaling messages
  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    if (!webRTCServiceRef.current || !message.from) return;

    try {
      switch (message.type) {
        case 'offer': {
          await webRTCServiceRef.current.setRemoteDescription(message.data);
          const answer = await webRTCServiceRef.current.createAnswer();
          signalingServiceRef.current?.sendAnswer(answer, message.from);
          break;
        }

        case 'answer':
          await webRTCServiceRef.current.setRemoteDescription(message.data);
          break;

        case 'ice-candidate':
          await webRTCServiceRef.current.addIceCandidate(message.data);
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }, []);

  // Initiate WebRTC connection
  const initiateWebRTCConnection = useCallback(async () => {
    if (!webRTCServiceRef.current || !signalingServiceRef.current || !partnerIdRef.current) return;

    try {
      webRTCServiceRef.current.createPeerConnection();
      const offer = await webRTCServiceRef.current.createOffer();
      signalingServiceRef.current.sendOffer(offer, partnerIdRef.current);
    } catch (error) {
      console.error('Failed to initiate WebRTC connection:', error);
    }
  }, []);

  // Handle connection lost
  const handleConnectionLost = useCallback(() => {
    if (reconnectAttempts < 3) {
      setConnectionStatus('reconnecting');
      setReconnectAttempts(prev => prev + 1);
      setTimeout(() => {
        if (partnerIdRef.current) {
          initiateWebRTCConnection();
        }
      }, 2000);
    } else {
      setConnectionStatus('disconnected');
      setPartnerConnected(false);
      setConnectionQuality('disconnected');
      toast({
        title: "Connection Lost",
        description: "Unable to reconnect. Please try again.",
        variant: "destructive"
      });
    }
  }, [reconnectAttempts, initiateWebRTCConnection, toast]);

  // Handle partner left
  const handlePartnerLeft = useCallback(() => {
    setPartnerConnected(false);
    setConnectionStatus('disconnected');
    setConnectionQuality('disconnected');
    partnerIdRef.current = null;
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    toast({
      title: "Partner Disconnected",
      description: "Your chat partner has left the conversation.",
    });
  }, [toast]);

  // Start chat - Fixed: Better service initialization flow
  const startChat = useCallback(async () => {
    try {
      setIsSearching(true);
      setConnectionStatus('connecting');
      
      // Reset camera permission state for retry
      if (cameraPermission === 'denied') {
        setCameraPermission('pending');
      }

      // Ensure services are initialized
      if (!signalingServiceRef.current || !webRTCServiceRef.current) {
        toast({
          title: "Initializing...",
          description: "Setting up video chat services"
        });
        await initializeServices();
        
        // Wait a moment for services to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Verify services are ready
      if (!signalingServiceRef.current || !webRTCServiceRef.current) {
        throw new Error('Failed to initialize services');
      }

      if (cameraPermission !== 'granted') {
        try {
          setCameraPermission('pending');
          await webRTCServiceRef.current.initializeMedia();
          setCameraPermission('granted');
          
          toast({
            title: "Camera Ready! 📹",
            description: "Camera and microphone access granted successfully.",
          });
        } catch (mediaError: any) {
          console.error('Media retry failed:', mediaError);
          
          // Handle specific camera/microphone errors for retry
          if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
            setCameraPermission('denied');
            toast({
              title: "Camera Still Blocked",
              description: "Please click the camera icon in your browser's address bar and allow camera access, then try again.",
              variant: "destructive"
            });
          } else if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
            setCameraPermission('denied');
            toast({
              title: "No Camera Found",
              description: "Please connect a camera and microphone, then try again.",
              variant: "destructive"
            });
          } else {
            setCameraPermission('denied');
            toast({
              title: "Camera Access Failed",
              description: "Please refresh the page and try again.",
              variant: "destructive"
            });
          }
          setIsSearching(false);
          setConnectionStatus('disconnected');
          return;
        }
      }

      // Clear previous state
      setMessages([]);
      setUnreadMessages(0);

      // Join a random room to find a partner
      const roomId = 'random-' + Date.now();
      signalingServiceRef.current.joinRoom(roomId);

      // Timeout if no partner found
      setTimeout(() => {
        if (!partnerConnected) {
          setIsSearching(false);
          setConnectionStatus('disconnected');
          toast({
            title: "No Partners Found",
            description: "Try again in a moment. There might be fewer users online right now.",
          });
        }
      }, 15000); // Increased timeout to 15 seconds
      
    } catch (error: any) {
      console.error('Failed to start chat:', error);
      setIsSearching(false);
      setConnectionStatus('disconnected');
      toast({
        title: "Chat Start Failed",
        description: error.message || "Unable to start video chat. Please refresh and try again.",
        variant: "destructive"
      });
    }
  }, [cameraPermission, partnerConnected, toast]);

  // End chat
  const endChat = useCallback(() => {
    setConnectionStatus('disconnected');
    setPartnerConnected(false);
    setIsSearching(false);
    setConnectionQuality('disconnected');
    setMessages([]);
    setUnreadMessages(0);

    signalingServiceRef.current?.leaveRoom();
    webRTCServiceRef.current?.cleanup();
    partnerIdRef.current = null;

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    toast({
      title: "Chat Ended",
      description: "You've disconnected from the chat.",
    });
  }, [toast]);

  // Next partner
  const nextPartner = useCallback(() => {
    endChat();
    setTimeout(() => {
      startChat();
    }, 500);
  }, [endChat, startChat]);

  // Send message
  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || !webRTCServiceRef.current) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      timestamp: new Date(),
      isOwn: true
    };

    setMessages(prev => [...prev, message]);
    webRTCServiceRef.current.sendMessage(message);
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    webRTCServiceRef.current?.toggleVideo(newState);
  }, [isVideoEnabled]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    webRTCServiceRef.current?.toggleAudio(newState);
  }, [isAudioEnabled]);

  // Toggle remote audio
  const toggleRemoteAudio = useCallback(() => {
    setIsRemoteAudioEnabled(!isRemoteAudioEnabled);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = isRemoteAudioEnabled;
    }
  }, [isRemoteAudioEnabled]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(() => {
    setUnreadMessages(0);
  }, []);

  // Toggle video filters
  const toggleVideoFilters = useCallback(() => {
    const newState = !isVideoFiltersEnabled;
    setIsVideoFiltersEnabled(newState);
    webRTCServiceRef.current?.enableVideoFilters(newState);
    
    if (newState) {
      // Initialize filter config if not already set
      const currentConfig = webRTCServiceRef.current?.getFilterConfig();
      if (currentConfig) {
        setFilterConfig(currentConfig);
      } else {
        // Set default light skin smoothing
        const defaultConfig = VideoFilterService.getPresetConfigs().light;
        setFilterConfig(defaultConfig);
        webRTCServiceRef.current?.updateFilterConfig(defaultConfig);
      }
    }
  }, [isVideoFiltersEnabled]);

  // Update filter configuration
  const updateFilterConfig = useCallback((config: Partial<FilterConfig>) => {
    if (!isVideoFiltersEnabled) return;
    
    const newConfig = filterConfig ? { ...filterConfig, ...config } : config as FilterConfig;
    setFilterConfig(newConfig);
    webRTCServiceRef.current?.updateFilterConfig(newConfig);
  }, [isVideoFiltersEnabled, filterConfig]);

  // Set filter preset
  const setFilterPreset = useCallback((preset: string) => {
    const presets = VideoFilterService.getPresetConfigs();
    if (presets[preset]) {
      const presetConfig = presets[preset];
      setFilterConfig(presetConfig);
      webRTCServiceRef.current?.updateFilterConfig(presetConfig);
      
      // Enable filters if preset is not 'none'
      const shouldEnable = preset !== 'none';
      if (shouldEnable !== isVideoFiltersEnabled) {
        setIsVideoFiltersEnabled(shouldEnable);
        webRTCServiceRef.current?.enableVideoFilters(shouldEnable);
      }
    }
  }, [isVideoFiltersEnabled]);

  // Toggle individual filter
  const toggleIndividualFilter = useCallback((filterType: keyof FilterConfig) => {
    if (!filterConfig) return;
    
    const currentlyEnabled = filterConfig[filterType]?.enabled || false;
    const newConfig = {
      ...filterConfig,
      [filterType]: {
        ...filterConfig[filterType],
        enabled: !currentlyEnabled
      }
    };
    
    setFilterConfig(newConfig);
    webRTCServiceRef.current?.updateFilterConfig(newConfig);
  }, [filterConfig]);

  // Update filter intensity
  const updateFilterIntensity = useCallback((filterType: keyof FilterConfig, value: number) => {
    if (!filterConfig) return;
    
    const newConfig = { ...filterConfig };
    
    if (filterType === 'skinSmoothing') {
      newConfig.skinSmoothing = {
        ...newConfig.skinSmoothing,
        intensity: Math.max(0, Math.min(100, value))
      };
    } else if (filterType === 'brightness') {
      newConfig.brightness = {
        ...newConfig.brightness,
        value: Math.max(-100, Math.min(100, value))
      };
    } else if (filterType === 'contrast') {
      newConfig.contrast = {
        ...newConfig.contrast,
        value: Math.max(-100, Math.min(100, value))
      };
    }
    
    setFilterConfig(newConfig);
    webRTCServiceRef.current?.updateFilterConfig(newConfig);
  }, [filterConfig]);

  // Get connection quality icon
  const getConnectionQualityIcon = useCallback(() => {
    // This would return actual icon components based on quality
    // For now, return string representation
    switch (connectionQuality) {
      case 'excellent': return '📶';
      case 'good': return '📶';
      case 'poor': return '📶';
      default: return '❌';
    }
  }, [connectionQuality]);

  // Get connection quality text
  const getConnectionQualityText = useCallback(() => {
    switch (connectionQuality) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'poor': return 'Poor';
      default: return 'Disconnected';
    }
  }, [connectionQuality]);

  // Initialize on mount - Fixed: Removed dependency loop
  useEffect(() => {
    initializeServices();

    return () => {
      webRTCServiceRef.current?.cleanup();
      signalingServiceRef.current?.disconnect();
    };
  }, []); // Fixed: Empty dependency array to prevent infinite loop

  // Simulate connection quality monitoring
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const interval = setInterval(() => {
        const qualities: ConnectionQuality[] = ['excellent', 'good', 'poor'];
        const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
        setConnectionQuality(randomQuality);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [connectionStatus]);

  // Update searching state when partner connects
  useEffect(() => {
    if (partnerConnected) {
      setIsSearching(false);
      toast({
        title: "Connected! 🎉",
        description: "Say hello to your new chat partner!",
      });
    }
  }, [partnerConnected, toast]);

  return {
    // Connection state
    connectionStatus,
    connectionQuality,
    isSearching,
    partnerConnected,
    cameraPermission,
    
    // Media state
    isVideoEnabled,
    isAudioEnabled,
    isRemoteAudioEnabled,
    localVideoRef,
    remoteVideoRef,
    
    // Video filter state
    isVideoFiltersEnabled,
    filterConfig,
    
    // Chat state
    messages,
    unreadMessages,
    
    // Actions
    startChat,
    endChat,
    nextPartner,
    sendMessage,
    toggleVideo,
    toggleAudio,
    toggleRemoteAudio,
    markMessagesAsRead,
    
    // Video filter actions
    toggleVideoFilters,
    updateFilterConfig,
    setFilterPreset,
    toggleIndividualFilter,
    updateFilterIntensity,
    
    // Utils
    getConnectionQualityIcon,
    getConnectionQualityText
  };
};
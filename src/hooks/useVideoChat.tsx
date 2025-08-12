import { useState, useRef, useEffect, useCallback } from 'react';
import { WebRTCService, defaultWebRTCConfig, WebRTCConfig } from '@/services/webRTCService';
import { SignalingService, createSignalingService, SignalingMessage } from '@/services/signalingService';
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
      // Initialize WebRTC service
      webRTCServiceRef.current = new WebRTCService(webRTCConfig, {
        onLocalStream: (stream) => {
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

      // Initialize local media
      await webRTCServiceRef.current.initializeMedia();
      setCameraPermission('granted');

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
        description: "Could not access camera/microphone or connect to server.",
        variant: "destructive"
      });
    }
  }, [webRTCConfig, useMockSignaling, autoConnect, toast]);

  // Handle signaling messages
  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    if (!webRTCServiceRef.current || !message.from) return;

    try {
      switch (message.type) {
        case 'offer':
          await webRTCServiceRef.current.setRemoteDescription(message.data);
          const answer = await webRTCServiceRef.current.createAnswer();
          signalingServiceRef.current?.sendAnswer(answer, message.from);
          break;

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

  // Start chat
  const startChat = useCallback(async () => {
    if (!signalingServiceRef.current) {
      await initializeServices();
    }

    if (cameraPermission !== 'granted') {
      try {
        await webRTCServiceRef.current?.initializeMedia();
        setCameraPermission('granted');
      } catch (error) {
        return;
      }
    }

    setIsSearching(true);
    setConnectionStatus('connecting');
    setMessages([]);
    setUnreadMessages(0);

    // Join a random room to find a partner
    const roomId = 'random-' + Date.now();
    signalingServiceRef.current?.joinRoom(roomId);

    // Timeout if no partner found
    setTimeout(() => {
      if (!partnerConnected) {
        setIsSearching(false);
        setConnectionStatus('disconnected');
        toast({
          title: "No Partners Found",
          description: "Try again in a moment.",
        });
      }
    }, 10000);
  }, [cameraPermission, partnerConnected, initializeServices, toast]);

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

  // Initialize on mount
  useEffect(() => {
    initializeServices();

    return () => {
      webRTCServiceRef.current?.cleanup();
      signalingServiceRef.current?.disconnect();
    };
  }, [initializeServices]);

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
    
    // Utils
    getConnectionQualityIcon,
    getConnectionQualityText
  };
};
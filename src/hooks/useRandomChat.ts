import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SocketIOSignalingService, UserPreferences as SocketPreferences } from '@/services/socketIOSignalingService';
import { WebRTCService, defaultWebRTCConfig } from '@/services/webRTCService';
import { randomChatService, RandomChatSession } from '@/services/randomChatService';
import { rateLimitService } from '@/services/rateLimitService';
import { connectionRetryService } from '@/services/connectionRetryService';
import { safetyService } from '@/services/safetyService';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
}

export interface QueueStatus {
  position: number;
  estimatedWaitTime: number;
  totalWaiting: number;
  message: string;
}

export interface UserPreferences {
  ageRange: [number, number];
  interests: string[];
  language: string;
}

export interface UseRandomChatReturn {
  // Connection state
  connectionStatus: ConnectionStatus;
  connectionQuality: ConnectionQuality | null;
  isSearching: boolean;
  partnerConnected: boolean;
  queueStatus: QueueStatus | null;
  currentRoomId: string | null;
  partnerId: string | null;
  
  // Media refs
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  
  // Media state
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isRemoteAudioEnabled: boolean;
  
  // Chat state
  messages: ChatMessage[];
  unreadMessages: number;
  
  // Actions
  startSearch: (preferences?: UserPreferences) => Promise<void>;
  endChat: () => void;
  nextPartner: () => void;
  sendMessage: (text: string) => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  toggleRemoteAudio: () => void;
  reportUser: (userId: string, reason: string, description?: string) => Promise<void>;
}

export const useRandomChat = (): UseRandomChatReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const signalingServiceRef = useRef<SocketIOSignalingService | null>(null);
  const webRTCServiceRef = useRef<WebRTCService | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // State for database session
  const [currentSession, setCurrentSession] = useState<RandomChatSession | null>(null);
  const messageSubscriptionRef = useRef<(() => void) | null>(null);
  
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  
  // Media state
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isRemoteAudioEnabled, setIsRemoteAudioEnabled] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Initialize services
  const initializeServices = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('🚀 Initializing random chat services...');
      
      // Initialize signaling service
      signalingServiceRef.current = new SocketIOSignalingService(user.id, {
        onConnected: () => {
          console.log('✅ Signaling service connected');
          setConnectionStatus('connected');
        },
        onDisconnected: () => {
          console.log('💔 Signaling service disconnected');
          setConnectionStatus('disconnected');
          setPartnerConnected(false);
          setCurrentRoomId(null);
          setPartnerId(null);
        },
        onSearching: (data) => {
          console.log('🔍 Searching for partner...', data);
          setIsSearching(true);
        },
        onQueueStatus: (data) => {
          console.log('📍 Queue status:', data);
          setQueueStatus(data);
        },
        onUserJoined: async (userId: string, roomId?: string) => {
          console.log('👤 Partner joined:', userId);
          setPartnerId(userId);
          setPartnerConnected(true);
          setIsSearching(false);
          setQueueStatus(null);
          
          // If roomId is provided (from matched event), use it
          if (roomId) {
            setCurrentRoomId(roomId);
            
            // Create database session
            try {
              const session = await randomChatService.createSession(
                roomId,
                user.id,
                userId
              );
              setCurrentSession(session);
              
              // Subscribe to messages for this session
              if (messageSubscriptionRef.current) {
                messageSubscriptionRef.current();
              }
              
              messageSubscriptionRef.current = randomChatService.subscribeToSessionMessages(
                session.id,
                (message) => {
                  if (message.sender_id !== user.id) {
                    const chatMessage: ChatMessage = {
                      id: message.id,
                      text: message.content,
                      timestamp: new Date(message.created_at),
                      isOwn: false
                    };
                    setMessages(prev => [...prev, chatMessage]);
                    setUnreadMessages(prev => prev + 1);
                  }
                }
              );
              
              console.log('✅ Database session created:', session.id);
            } catch (error) {
              console.error('❌ Failed to create database session:', error);
              // Continue without database session
            }
          }
        },
        onUserLeft: (userId: string) => {
          console.log('👋 Partner left:', userId);
          
          // End database session if it exists
          if (currentSession) {
            randomChatService.endSession(currentSession.id, 'partner_left').catch(error => {
              console.error('Failed to end database session:', error);
            });
            setCurrentSession(null);
          }
          
          // Clean up message subscription
          if (messageSubscriptionRef.current) {
            messageSubscriptionRef.current();
            messageSubscriptionRef.current = null;
          }
          
          setPartnerConnected(false);
          setPartnerId(null);
          setMessages([]);
          
          toast({
            title: "Partner disconnected",
            description: "Your chat partner has left the conversation.",
          });
        },
        onMessage: async (message) => {
          console.log('📨 Signaling message received:', message);
          
          if (message.type === 'chat-message') {
            const chatMessage: ChatMessage = {
              id: message.data.id || Date.now().toString(),
              text: message.data.message || message.data.text,
              timestamp: new Date(message.data.timestamp || Date.now()),
              isOwn: message.from === user.id
            };
            
            setMessages(prev => [...prev, chatMessage]);
            
            if (!chatMessage.isOwn) {
              setUnreadMessages(prev => prev + 1);
            }
          }
          
          // Handle WebRTC signaling
          if (webRTCServiceRef.current) {
            await webRTCServiceRef.current.handleSignalingMessage(message);
          }
        },
        onError: (error) => {
          console.error('❌ Signaling error:', error);
          toast({
            title: "Connection error",
            description: error,
            variant: "destructive",
          });
        }
      });

      // Initialize WebRTC service
      webRTCServiceRef.current = new WebRTCService(defaultWebRTCConfig);
      
      // Set up WebRTC event handlers
      webRTCServiceRef.current.onRemoteStream = (stream) => {
        console.log('📹 Remote stream received');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      };

      webRTCServiceRef.current.onSignalingMessage = (message) => {
        console.log('📡 Sending signaling message:', message);
        if (signalingServiceRef.current && currentRoomId) {
          signalingServiceRef.current.sendMessage({
            type: message.type as any,
            data: message.data,
            to: partnerId || undefined
          });
        }
      };

      webRTCServiceRef.current.onConnectionStateChange = (state) => {
        console.log('🔗 WebRTC connection state:', state);
        
        switch (state) {
          case 'connected':
            setConnectionQuality('excellent');
            break;
          case 'connecting':
            setConnectionQuality('fair');
            break;
          case 'disconnected':
            setConnectionQuality('poor');
            setPartnerConnected(false);
            break;
        }
      };

      // Connect to signaling server
      await signalingServiceRef.current.connect();
      
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }, [user?.id, toast]);

  // Get user media
  const getUserMedia = useCallback(async () => {
    try {
      console.log('🎥 Getting user media...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      if (webRTCServiceRef.current) {
        webRTCServiceRef.current.addLocalStream(stream);
      }
      
      console.log('✅ User media acquired successfully');
      return stream;
    } catch (error) {
      console.error('❌ Failed to get user media:', error);
      throw error;
    }
  }, []);

  // Start search for random partner
  const startSearch = useCallback(async (preferences?: UserPreferences) => {
    if (!user?.id) return;

    try {
      // Check if user is eligible to start session
      const eligibility = await safetyService.canUserStartSession(user.id);
      if (!eligibility.allowed) {
        toast({
          title: "Cannot start session",
          description: eligibility.reason,
          variant: "destructive",
        });
        return;
      }

      // Check rate limits
      const connectionLimit = rateLimitService.canStartConnection(user.id);
      if (!connectionLimit.allowed) {
        toast({
          title: "Rate limit exceeded",
          description: connectionLimit.message,
          variant: "destructive",
        });
        return;
      }

      // Check session cooldown
      const cooldownCheck = rateLimitService.canStartNewSession(user.id);
      if (!cooldownCheck.allowed) {
        toast({
          title: "Please wait",
          description: `Please wait ${cooldownCheck.retryAfter} seconds before starting a new session.`,
          variant: "destructive",
        });
        return;
      }

      if (!signalingServiceRef.current) {
        await initializeServices();
      }

      console.log('🔍 Starting search with preferences:', preferences);
      setIsSearching(true);
      setMessages([]);
      setUnreadMessages(0);
      
      // Record rate limit actions
      rateLimitService.recordConnection(user.id);
      rateLimitService.recordSessionStart(user.id);
      
      // Get user media first
      await getUserMedia();
      
      // Convert preferences to socket format
      const socketPreferences: SocketPreferences = {
        ageRange: preferences?.ageRange,
        interests: preferences?.interests,
        language: preferences?.language !== 'any' ? preferences?.language : undefined
      };
      
      // Start search through signaling service with retry mechanism
      const searchAttempt = async (): Promise<boolean> => {
        try {
          await signalingServiceRef.current!.findRandomPartner(socketPreferences);
          return true;
        } catch (error) {
          console.error('Search attempt failed:', error);
          return false;
        }
      };

      // Use retry service for connection attempts
      connectionRetryService.startRetry(
        `search-${user.id}`,
        searchAttempt,
        () => {
          console.log('✅ Search successful with retry');
        },
        (reason) => {
          console.error('❌ Search failed after retries:', reason);
          setIsSearching(false);
          toast({
            title: "Connection failed",
            description: "Unable to find a chat partner. Please try again later.",
            variant: "destructive",
          });
        },
        {
          maxAttempts: 3,
          initialDelay: 2000,
          maxDelay: 10000
        }
      );
      
    } catch (error) {
      console.error('❌ Failed to start search:', error);
      setIsSearching(false);
      throw error;
    }
  }, [user?.id, initializeServices, getUserMedia, toast]);

  // End current chat
  const endChat = useCallback(() => {
    console.log('🛑 Ending chat...');
    
    // End database session if it exists
    if (currentSession) {
      randomChatService.endSession(currentSession.id, 'user_ended').catch(error => {
        console.error('Failed to end database session:', error);
      });
      setCurrentSession(null);
    }
    
    // Clean up message subscription
    if (messageSubscriptionRef.current) {
      messageSubscriptionRef.current();
      messageSubscriptionRef.current = null;
    }
    
    if (signalingServiceRef.current) {
      signalingServiceRef.current.endChat();
    }
    
    if (webRTCServiceRef.current) {
      webRTCServiceRef.current.disconnect();
    }
    
    // Clean up local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Reset state
    setPartnerConnected(false);
    setPartnerId(null);
    setCurrentRoomId(null);
    setIsSearching(false);
    setMessages([]);
    setUnreadMessages(0);
    setConnectionStatus('disconnected');
    setConnectionQuality(null);
  }, [currentSession]);

  // Skip to next partner
  const nextPartner = useCallback(() => {
    if (!user?.id) return;

    // Check skip rate limit
    const skipLimit = rateLimitService.canSkipPartner(user.id);
    if (!skipLimit.allowed) {
      toast({
        title: "Rate limit exceeded",
        description: skipLimit.message,
        variant: "destructive",
      });
      return;
    }

    console.log('⏭️ Skipping to next partner...');
    
    // Record skip for rate limiting and safety monitoring
    rateLimitService.recordSkip(user.id);
    safetyService.recordSessionBehavior(user.id, { type: 'skip' });
    
    // End current database session
    if (currentSession) {
      randomChatService.endSession(currentSession.id, 'user_ended').catch(error => {
        console.error('Failed to end database session:', error);
      });
      setCurrentSession(null);
    }
    
    // Clean up message subscription
    if (messageSubscriptionRef.current) {
      messageSubscriptionRef.current();
      messageSubscriptionRef.current = null;
    }
    
    // Stop any active retry processes
    connectionRetryService.cancelRetry(`search-${user.id}`);
    
    if (signalingServiceRef.current) {
      signalingServiceRef.current.nextPartner();
    }
    
    if (webRTCServiceRef.current) {
      webRTCServiceRef.current.disconnect();
    }
    
    // Reset partner state but keep services running
    setPartnerConnected(false);
    setPartnerId(null);
    setCurrentRoomId(null);
    setIsSearching(true);
    setMessages([]);
    setUnreadMessages(0);
  }, [currentSession, user?.id, toast]);

  // Send chat message
  const sendMessage = useCallback(async (text: string) => {
    if (!signalingServiceRef.current || !currentRoomId || !text.trim() || !user?.id) return;
    
    // Check message rate limit
    const messageLimit = rateLimitService.canSendMessage(user.id);
    if (!messageLimit.allowed) {
      toast({
        title: "Rate limit exceeded",
        description: messageLimit.message,
        variant: "destructive",
      });
      return;
    }

    // Filter message content for safety
    const messageFilter = safetyService.filterMessage(text, user.id);
    
    if (!messageFilter.allowed) {
      toast({
        title: "Message blocked",
        description: messageFilter.reason || "Message contains inappropriate content",
        variant: "destructive",
      });
      
      // Handle severe violations
      if (messageFilter.action === 'end_session') {
        endChat();
        return;
      } else if (messageFilter.action === 'ban') {
        // User would be banned by the safety service
        endChat();
        toast({
          title: "Account suspended",
          description: "Your account has been suspended for violating community guidelines.",
          variant: "destructive",
        });
        return;
      }
      
      return;
    }

    // Use filtered message if available
    const finalMessage = messageFilter.filteredMessage || text.trim();
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      text: finalMessage,
      timestamp: new Date(),
      isOwn: true
    };
    
    // Add to local messages immediately
    setMessages(prev => [...prev, message]);
    
    // Record rate limit
    rateLimitService.recordMessage(user.id);
    
    // Send through signaling service
    signalingServiceRef.current.sendMessage({
      type: 'chat-message' as any,
      data: {
        id: message.id,
        message: message.text,
        timestamp: message.timestamp.getTime()
      }
    });
    
    // Save to database if session exists
    if (currentSession && user?.id) {
      try {
        await randomChatService.sendMessage(
          currentSession.id,
          user.id,
          message.text,
          'text'
        );
        console.log('💾 Message saved to database');
      } catch (error) {
        console.error('❌ Failed to save message to database:', error);
        // Don't fail the entire operation if database save fails
      }
    }
    
    // Show warning if message was filtered
    if (messageFilter.filteredMessage && messageFilter.action === 'warn') {
      toast({
        title: "Content filtered",
        description: "Your message was modified to remove inappropriate content.",
        variant: "default",
      });
    }
    
    console.log('📤 Message sent:', finalMessage);
  }, [currentRoomId, currentSession, user?.id, toast, endChat]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        console.log('📹 Video toggled:', videoTrack.enabled);
      }
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        console.log('🎤 Audio toggled:', audioTrack.enabled);
      }
    }
  }, []);

  // Toggle remote audio
  const toggleRemoteAudio = useCallback(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !remoteVideoRef.current.muted;
      setIsRemoteAudioEnabled(!remoteVideoRef.current.muted);
      console.log('🔊 Remote audio toggled:', !remoteVideoRef.current.muted);
    }
  }, []);

  // Report user
  const reportUser = useCallback(async (userId: string, reason: string, description?: string) => {
    if (!user?.id) return;

    // Check report rate limit
    const reportLimit = rateLimitService.canSubmitReport(user.id);
    if (!reportLimit.allowed) {
      toast({
        title: "Rate limit exceeded",
        description: reportLimit.message,
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🚨 Reporting user:', userId, reason);
      
      // Record report for rate limiting
      rateLimitService.recordReport(user.id);
      
      // Report to signaling server
      if (signalingServiceRef.current) {
        await signalingServiceRef.current.reportUser(userId, reason, description);
      }
      
      // Report to database
      await randomChatService.reportUser(userId, reason, description, currentSession?.id);
      
      // Report to safety service
      safetyService.reportUser(user.id, userId, reason as any, description);
      
      // End current session due to report
      if (currentSession) {
        await randomChatService.endSession(currentSession.id, 'reported');
      }
      
      // Also end the current chat
      endChat();
      
    } catch (error) {
      console.error('❌ Failed to report user:', error);
      throw error;
    }
  }, [endChat, currentSession?.id, user?.id, toast]);

  // Initialize services when component mounts
  useEffect(() => {
    if (user?.id && !signalingServiceRef.current) {
      initializeServices().catch(error => {
        console.error('Failed to initialize services:', error);
      });
    }
    
    // Cleanup on unmount
    return () => {
      // Clean up message subscription
      if (messageSubscriptionRef.current) {
        messageSubscriptionRef.current();
        messageSubscriptionRef.current = null;
      }
      
      if (signalingServiceRef.current) {
        signalingServiceRef.current.disconnect();
      }
      if (webRTCServiceRef.current) {
        webRTCServiceRef.current.disconnect();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // End current session if exists
      if (currentSession) {
        randomChatService.endSession(currentSession.id, 'connection_lost').catch(error => {
          console.error('Failed to end session on unmount:', error);
        });
      }
    };
  }, [user?.id, initializeServices, currentSession]);

  return {
    // Connection state
    connectionStatus,
    connectionQuality,
    isSearching,
    partnerConnected,
    queueStatus,
    currentRoomId,
    partnerId,
    
    // Media refs
    localVideoRef,
    remoteVideoRef,
    
    // Media state
    isVideoEnabled,
    isAudioEnabled,
    isRemoteAudioEnabled,
    
    // Chat state
    messages,
    unreadMessages,
    
    // Actions
    startSearch,
    endChat,
    nextPartner,
    sendMessage,
    toggleVideo,
    toggleAudio,
    toggleRemoteAudio,
    reportUser
  };
};
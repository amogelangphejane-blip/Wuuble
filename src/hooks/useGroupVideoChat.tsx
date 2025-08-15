import { useState, useRef, useEffect, useCallback } from 'react';
import { GroupWebRTCService, GroupParticipant, GroupWebRTCEvents } from '@/services/groupWebRTCService';
import { GroupSignalingService, createGroupSignalingService, GroupSignalingEvents } from '@/services/groupSignalingService';
import { defaultWebRTCConfig, WebRTCConfig } from '@/services/webRTCService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type GroupCallStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface GroupChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  participantId: string;
  participantName: string;
}

export interface UseGroupVideoChatOptions {
  webRTCConfig?: WebRTCConfig;
  useMockSignaling?: boolean;
  maxParticipants?: number;
  communityId: string;
  callId?: string;
}

export interface UseGroupVideoChatReturn {
  // Connection state
  callStatus: GroupCallStatus;
  isConnecting: boolean;
  isConnected: boolean;
  servicesReady: boolean;
  cameraPermission: 'pending' | 'granted' | 'denied';
  
  // Participants
  participants: GroupParticipant[];
  localParticipant: GroupParticipant | null;
  participantStreams: Map<string, MediaStream>;
  
  // Media state
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  
  // Chat
  messages: GroupChatMessage[];
  unreadMessages: number;
  
  // Actions
  startCall: (callTitle?: string) => Promise<void>;
  joinCall: (callId: string) => Promise<void>;
  endCall: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  sendMessage: (text: string) => void;
  markMessagesAsRead: () => void;
  
  // Participant management
  muteParticipant: (participantId: string) => void;
  kickParticipant: (participantId: string) => void;
  promoteToModerator: (participantId: string) => void;
  
  // Utils
  getParticipantStream: (participantId: string) => MediaStream | null;
  getCurrentCall: () => any;
}

export const useGroupVideoChat = (options: UseGroupVideoChatOptions): UseGroupVideoChatReturn => {
  const {
    webRTCConfig = defaultWebRTCConfig,
    useMockSignaling = true,
    maxParticipants = 50,
    communityId,
    callId: initialCallId
  } = options;

  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [callStatus, setCallStatus] = useState<GroupCallStatus>('disconnected');
  const [servicesReady, setServicesReady] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [participants, setParticipants] = useState<GroupParticipant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<GroupParticipant | null>(null);
  const [participantStreams, setParticipantStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [currentCall, setCurrentCall] = useState<any>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const webRTCServiceRef = useRef<GroupWebRTCService | null>(null);
  const signalingServiceRef = useRef<GroupSignalingService | null>(null);
  const participantIdRef = useRef<string>(Math.random().toString(36).substr(2, 9));

  const isConnecting = callStatus === 'connecting';
  const isConnected = callStatus === 'connected';

  // Initialize services
  const initializeServices = useCallback(async () => {
    if (!user) return;

    try {
      // Create participant data
      const participantData = {
        id: participantIdRef.current,
        userId: user.id,
        displayName: user.user_metadata?.display_name || user.email || 'Anonymous',
        avatarUrl: user.user_metadata?.avatar_url,
        isVideoEnabled: true,
        isAudioEnabled: true,
        isScreenSharing: false,
        connectionQuality: 'good' as const,
        joinedAt: new Date(),
        role: 'participant' as const
      };

      setLocalParticipant(participantData);

      // Initialize WebRTC service
      const webRTCEvents: GroupWebRTCEvents = {
        onLocalStreamReady: (stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        },
        onRemoteStream: (participantId, stream) => {
          setParticipantStreams(prev => new Map(prev.set(participantId, stream)));
        },
        onParticipantJoined: (participant) => {
          setParticipants(prev => [...prev.filter(p => p.id !== participant.id), participant]);
          toast({
            title: "Participant Joined",
            description: `${participant.displayName} joined the call`,
          });
        },
        onParticipantLeft: (participantId) => {
          setParticipants(prev => prev.filter(p => p.id !== participantId));
          setParticipantStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(participantId);
            return newMap;
          });
          
          const leavingParticipant = participants.find(p => p.id === participantId);
          if (leavingParticipant) {
            toast({
              title: "Participant Left",
              description: `${leavingParticipant.displayName} left the call`,
            });
          }
        },
        onParticipantUpdated: (participant) => {
          setParticipants(prev => prev.map(p => p.id === participant.id ? participant : p));
        },
        onDataChannelMessage: (participantId, message) => {
          if (message.type === 'chat') {
            const participant = participants.find(p => p.id === participantId);
            const chatMessage: GroupChatMessage = {
              id: Date.now().toString(),
              text: message.text,
              timestamp: new Date(),
              participantId,
              participantName: participant?.displayName || 'Unknown'
            };
            setMessages(prev => [...prev, chatMessage]);
            setUnreadMessages(prev => prev + 1);
          }
        },
        onIceCandidate: (participantId, candidate) => {
          signalingServiceRef.current?.sendGroupIceCandidate(candidate, participantId);
        },
        onError: (error) => {
          toast({
            title: "Connection Error",
            description: error,
            variant: "destructive"
          });
        }
      };

      webRTCServiceRef.current = new GroupWebRTCService(
        participantIdRef.current,
        webRTCConfig,
        webRTCEvents
      );

      // Initialize signaling service
      const signalingEvents: GroupSignalingEvents = {
        onParticipantJoined: async (participantId, participantData) => {
          // Add participant to WebRTC service
          if (webRTCServiceRef.current) {
            webRTCServiceRef.current.addParticipant(participantData);
            await webRTCServiceRef.current.createPeerConnection(participantId, participantData.userId, true);
            const offer = await webRTCServiceRef.current.createOffer(participantId);
            signalingServiceRef.current?.sendGroupOffer(offer, participantId);
          }
        },
        onParticipantLeft: (participantId) => {
          webRTCServiceRef.current?.removeParticipant(participantId);
        },
        onGroupOffer: async (fromParticipantId, offer) => {
          if (webRTCServiceRef.current) {
            const fromParticipant = signalingServiceRef.current?.getParticipant(fromParticipantId);
            if (fromParticipant) {
              await webRTCServiceRef.current.createPeerConnection(fromParticipantId, fromParticipant.userId, false);
              await webRTCServiceRef.current.setRemoteDescription(fromParticipantId, offer);
              const answer = await webRTCServiceRef.current.createAnswer(fromParticipantId);
              signalingServiceRef.current?.sendGroupAnswer(answer, fromParticipantId);
            }
          }
        },
        onGroupAnswer: async (fromParticipantId, answer) => {
          if (webRTCServiceRef.current) {
            await webRTCServiceRef.current.setRemoteDescription(fromParticipantId, answer);
          }
        },
        onGroupIceCandidate: async (fromParticipantId, candidate) => {
          if (webRTCServiceRef.current) {
            await webRTCServiceRef.current.addIceCandidate(fromParticipantId, candidate);
          }
        },
        onError: (error) => {
          toast({
            title: "Signaling Error",
            description: error,
            variant: "destructive"
          });
        }
      };

      signalingServiceRef.current = createGroupSignalingService(
        participantIdRef.current,
        signalingEvents,
        useMockSignaling
      );

      await signalingServiceRef.current.connect();
      setServicesReady(true);

    } catch (error) {
      console.error('Failed to initialize services:', error);
      toast({
        title: "Setup Failed",
        description: "Could not initialize video call services",
        variant: "destructive"
      });
    }
  }, [user, webRTCConfig, useMockSignaling, toast]);

  // Helper function to check if user is a community member
  const checkCommunityMembership = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking community membership:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking community membership:', error);
      return false;
    }
  }, [user, communityId]);

  // Start a new group call
  const startCall = useCallback(async (callTitle?: string) => {
    if (!user || !webRTCServiceRef.current || !signalingServiceRef.current || !localParticipant) {
      console.error('Services or user data not ready');
      toast({
        title: "Setup Error",
        description: "Please wait for the services to initialize and try again",
        variant: "destructive"
      });
      return;
    }

    try {
      setCallStatus('connecting');

      // Check community membership first
      const isMember = await checkCommunityMembership();
      if (!isMember) {
        throw new Error('You must be a member of this community to start group calls. Please join the community first.');
      }

      // Initialize local media
      setCameraPermission('pending');
      await webRTCServiceRef.current.initializeLocalMedia();
      setCameraPermission('granted');

      // Create call in database
      console.log('Creating group call in database...', {
        community_id: communityId,
        creator_id: user.id,
        title: callTitle || 'Community Video Call',
        max_participants: maxParticipants,
        status: 'active'
      });

      const { data: newCall, error } = await supabase
        .from('community_group_calls')
        .insert({
          community_id: communityId,
          creator_id: user.id,
          title: callTitle || 'Community Video Call',
          max_participants: maxParticipants,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error creating group call:', error);
        // Provide better error messages for common issues
        if (error.code === '42501') {
          throw new Error('You must be a member of this community to start group calls. Please join the community first.');
        }
        if (error.code === '42P01') {
          throw new Error('Database tables are not set up. Please contact an administrator to configure group video calls.');
        }
        throw new Error(`Database error: ${error.message}`);
      }

      setCurrentCall(newCall);

      // Join the group call
      const groupId = `community-${communityId}-call-${newCall.id}`;
      signalingServiceRef.current.joinGroup(groupId, {
        ...localParticipant,
        role: 'host'
      });

      // Add self as participant in database
      const { error: participantError } = await supabase
        .from('community_group_call_participants')
        .insert({
          call_id: newCall.id,
          user_id: user.id,
          role: 'host'
        });

      if (participantError) {
        console.warn('Failed to add participant record:', participantError);
        // Don't fail the entire call for this
      }

      setCallStatus('connected');
      toast({
        title: "Call Started",
        description: "Your group video call is now active",
      });

    } catch (error: any) {
      console.error('Failed to start call:', error);
      setCallStatus('disconnected');
      
      if (error.name === 'NotAllowedError') {
        setCameraPermission('denied');
        toast({
          title: "Camera Access Denied",
          description: "Please allow camera access to start the call",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Failed to Start Call",
          description: error.message || "Could not start the video call",
          variant: "destructive"
        });
      }
    }
  }, [user, communityId, maxParticipants, localParticipant, toast, checkCommunityMembership]);

  // Join an existing group call
  const joinCall = useCallback(async (callId: string) => {
    if (!user || !webRTCServiceRef.current || !signalingServiceRef.current || !localParticipant) {
      console.error('Services or user data not ready');
      toast({
        title: "Setup Error",
        description: "Please wait for the services to initialize and try again",
        variant: "destructive"
      });
      return;
    }

    try {
      setCallStatus('connecting');

      // Check community membership first
      const isMember = await checkCommunityMembership();
      if (!isMember) {
        throw new Error('You must be a member of this community to join group calls. Please join the community first.');
      }

      // Get call details
      console.log('Fetching call details for callId:', callId);
      const { data: call, error: callError } = await supabase
        .from('community_group_calls')
        .select('*')
        .eq('id', callId)
        .single();

      if (callError) {
        console.error('Database error fetching call:', callError);
        if (callError.code === '42501') {
          throw new Error('You must be a member of this community to join group calls. Please join the community first.');
        }
        if (callError.code === '42P01') {
          throw new Error('Database tables are not set up. Please contact an administrator to configure group video calls.');
        }
        throw new Error(`Database error: ${callError.message}`);
      }

      if (!call) {
        throw new Error('Call not found or has ended');
      }

      if (call.status !== 'active') {
        throw new Error('This call has ended or is no longer active');
      }

      setCurrentCall(call);

      // Initialize local media
      setCameraPermission('pending');
      await webRTCServiceRef.current.initializeLocalMedia();
      setCameraPermission('granted');

      // Join the group call
      const groupId = `community-${communityId}-call-${callId}`;
      signalingServiceRef.current.joinGroup(groupId, localParticipant);

      // Add self as participant in database
      const { error: participantError } = await supabase
        .from('community_group_call_participants')
        .insert({
          call_id: callId,
          user_id: user.id,
          role: 'participant'
        });

      if (participantError) {
        console.warn('Failed to add participant record:', participantError);
        // Don't fail the entire call for this
      }

      setCallStatus('connected');
      toast({
        title: "Joined Call",
        description: "You've successfully joined the group video call",
      });

    } catch (error: any) {
      console.error('Failed to join call:', error);
      setCallStatus('disconnected');
      
      if (error.name === 'NotAllowedError') {
        setCameraPermission('denied');
        toast({
          title: "Camera Access Denied",
          description: "Please allow camera access to join the call",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Failed to Join Call",
          description: error.message || "Could not join the video call",
          variant: "destructive"
        });
      }
    }
  }, [user, communityId, localParticipant, toast, checkCommunityMembership]);

  // End the call
  const endCall = useCallback(async () => {
    setCallStatus('disconnected');
    
    if (currentCall && user) {
      // Update participant as left
      await supabase
        .from('community_group_call_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('call_id', currentCall.id)
        .eq('user_id', user.id);

      // If host is leaving, end the call
      if (localParticipant?.role === 'host') {
        await supabase
          .from('community_group_calls')
          .update({ 
            status: 'ended',
            ended_at: new Date().toISOString()
          })
          .eq('id', currentCall.id);
      }
    }

    signalingServiceRef.current?.leaveGroup();
    webRTCServiceRef.current?.cleanup();
    
    setParticipants([]);
    setParticipantStreams(new Map());
    setMessages([]);
    setUnreadMessages(0);
    setCurrentCall(null);
    
    toast({
      title: "Call Ended",
      description: "You've left the group video call",
    });
  }, [currentCall, user, localParticipant, toast]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    webRTCServiceRef.current?.toggleVideo(newState);
    
    if (localParticipant) {
      const updatedParticipant = { ...localParticipant, isVideoEnabled: newState };
      setLocalParticipant(updatedParticipant);
      signalingServiceRef.current?.sendParticipantUpdate({ isVideoEnabled: newState });
    }
  }, [isVideoEnabled, localParticipant]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    webRTCServiceRef.current?.toggleAudio(newState);
    
    if (localParticipant) {
      const updatedParticipant = { ...localParticipant, isAudioEnabled: newState };
      setLocalParticipant(updatedParticipant);
      signalingServiceRef.current?.sendParticipantUpdate({ isAudioEnabled: newState });
    }
  }, [isAudioEnabled, localParticipant]);

  // Start screen share
  const startScreenShare = useCallback(async () => {
    try {
      if (webRTCServiceRef.current) {
        await webRTCServiceRef.current.startScreenShare();
        setIsScreenSharing(true);
        
        if (localParticipant) {
          const updatedParticipant = { ...localParticipant, isScreenSharing: true };
          setLocalParticipant(updatedParticipant);
          signalingServiceRef.current?.sendParticipantUpdate({ isScreenSharing: true });
        }
        
        toast({
          title: "Screen Sharing Started",
          description: "Your screen is now being shared with participants",
        });
      }
    } catch (error) {
      toast({
        title: "Screen Share Failed",
        description: "Could not start screen sharing",
        variant: "destructive"
      });
    }
  }, [localParticipant, toast]);

  // Stop screen share
  const stopScreenShare = useCallback(async () => {
    if (webRTCServiceRef.current) {
      await webRTCServiceRef.current.stopScreenShare();
      setIsScreenSharing(false);
      
      if (localParticipant) {
        const updatedParticipant = { ...localParticipant, isScreenSharing: false };
        setLocalParticipant(updatedParticipant);
        signalingServiceRef.current?.sendParticipantUpdate({ isScreenSharing: false });
      }
      
      toast({
        title: "Screen Sharing Stopped",
        description: "You've stopped sharing your screen",
      });
    }
  }, [localParticipant, toast]);

  // Send message
  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const message = {
      type: 'chat',
      text: text.trim(),
      timestamp: Date.now()
    };

    webRTCServiceRef.current?.sendMessage(message);
    
    // Add to local messages
    const chatMessage: GroupChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      timestamp: new Date(),
      participantId: participantIdRef.current,
      participantName: localParticipant?.displayName || 'You'
    };
    setMessages(prev => [...prev, chatMessage]);
  }, [localParticipant]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(() => {
    setUnreadMessages(0);
  }, []);

  // Participant management functions
  const muteParticipant = useCallback((participantId: string) => {
    // This would typically send a command to the server
    // For now, just show a toast
    toast({
      title: "Participant Muted",
      description: "Participant has been muted",
    });
  }, [toast]);

  const kickParticipant = useCallback((participantId: string) => {
    // This would typically send a command to the server
    toast({
      title: "Participant Removed",
      description: "Participant has been removed from the call",
    });
  }, [toast]);

  const promoteToModerator = useCallback((participantId: string) => {
    // This would typically send a command to the server
    toast({
      title: "Participant Promoted",
      description: "Participant has been promoted to moderator",
    });
  }, [toast]);

  // Utility functions
  const getParticipantStream = useCallback((participantId: string): MediaStream | null => {
    return participantStreams.get(participantId) || null;
  }, [participantStreams]);

  const getCurrentCall = useCallback(() => {
    return currentCall;
  }, [currentCall]);

  // Initialize on mount
  useEffect(() => {
    if (user) {
      initializeServices();
    }

    return () => {
      webRTCServiceRef.current?.cleanup();
      signalingServiceRef.current?.disconnect();
      setServicesReady(false);
    };
  }, [user, initializeServices]);

  // Auto-join call if callId is provided
  useEffect(() => {
    if (initialCallId && servicesReady && !currentCall) {
      joinCall(initialCallId);
    }
  }, [initialCallId, servicesReady, currentCall, joinCall]);

  return {
    // Connection state
    callStatus,
    isConnecting,
    isConnected,
    servicesReady,
    cameraPermission,
    
    // Participants
    participants,
    localParticipant,
    participantStreams,
    
    // Media state
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    localVideoRef,
    
    // Chat
    messages,
    unreadMessages,
    
    // Actions
    startCall,
    joinCall,
    endCall,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    sendMessage,
    markMessagesAsRead,
    
    // Participant management
    muteParticipant,
    kickParticipant,
    promoteToModerator,
    
    // Utils
    getParticipantStream,
    getCurrentCall
  };
};
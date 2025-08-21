import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  livestreamService, 
  LiveStream, 
  StreamMessage, 
  StreamReaction, 
  StreamViewer,
  LiveStreamConfig 
} from '@/services/livestreamService';

export interface LivestreamState {
  // Stream data
  currentStream: LiveStream | null;
  streams: LiveStream[];
  isLoading: boolean;
  error: string | null;

  // Broadcasting state
  isBroadcasting: boolean;
  localStream: MediaStream | null;
  broadcastConfig: LiveStreamConfig;

  // Viewing state
  isViewing: boolean;
  remoteStream: MediaStream | null;
  viewerCount: number;
  viewers: StreamViewer[];

  // Chat state
  messages: StreamMessage[];
  unreadCount: number;
  isChatOpen: boolean;
  chatUserProfiles: Record<string, { display_name?: string; avatar_url?: string }>;

  // Reactions state
  reactions: StreamReaction[];
  reactionAnimations: Array<{
    id: string;
    type: string;
    x: number;
    y: number;
    timestamp: number;
  }>;

  // UI state
  isControlsVisible: boolean;
  isSettingsOpen: boolean;
  volume: number;
  isMuted: boolean;
}

export const useLivestream = () => {
  const { toast } = useToast();
  const [state, setState] = useState<LivestreamState>({
    currentStream: null,
    streams: [],
    isLoading: false,
    error: null,
    isBroadcasting: false,
    localStream: null,
    broadcastConfig: {
      video: true,
      audio: true,
      quality: 'medium',
      maxViewers: 1000,
      enableChat: true,
      enableReactions: true,
    },
    isViewing: false,
    remoteStream: null,
    viewerCount: 0,
    viewers: [],
    messages: [],
    unreadCount: 0,
    isChatOpen: false,
    chatUserProfiles: {},
    reactions: [],
    reactionAnimations: [],
    isControlsVisible: true,
    isSettingsOpen: false,
    volume: 100,
    isMuted: false,
  });

  const subscriptionsRef = useRef<any[]>([]);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup subscriptions
  const cleanup = useCallback(() => {
    subscriptionsRef.current.forEach(subscription => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    });
    subscriptionsRef.current = [];
  }, []);

  // Create a new livestream
  const createStream = useCallback(async (data: {
    title: string;
    description?: string;
    community_id?: string;
    max_viewers?: number;
    settings?: any;
    tags?: string[];
  }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const stream = await livestreamService.createLivestream(data);
      
      setState(prev => ({ 
        ...prev, 
        currentStream: stream,
        isLoading: false 
      }));
      
      toast({
        title: "Stream Created",
        description: `"${data.title}" is ready to go live!`,
      });
      
      return stream;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message,
        isLoading: false 
      }));
      
      toast({
        title: "Failed to Create Stream",
        description: error.message,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [toast]);

  // Start broadcasting
  const startBroadcast = useCallback(async (streamId?: string, config?: Partial<LiveStreamConfig>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const broadcastConfig = { ...state.broadcastConfig, ...config };
      const localStream = await livestreamService.startBroadcast(broadcastConfig);
      
      if (streamId) {
        await livestreamService.startLivestream(streamId);
      }
      
      setState(prev => ({ 
        ...prev, 
        isBroadcasting: true,
        localStream,
        broadcastConfig,
        isLoading: false 
      }));
      
      toast({
        title: "Live Stream Started",
        description: "You are now broadcasting live!",
      });
      
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message,
        isLoading: false 
      }));
      
      toast({
        title: "Failed to Start Broadcast",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [state.broadcastConfig, toast]);

  // Stop broadcasting
  const stopBroadcast = useCallback(async (streamId?: string) => {
    try {
      await livestreamService.stopBroadcast();
      
      if (streamId) {
        await livestreamService.endLivestream(streamId);
      }
      
      setState(prev => ({ 
        ...prev, 
        isBroadcasting: false,
        localStream: null 
      }));
      
      toast({
        title: "Broadcast Ended",
        description: "Your live stream has ended.",
      });
      
    } catch (error: any) {
      toast({
        title: "Error Ending Broadcast",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Join a livestream as viewer
  const joinStream = useCallback(async (streamId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await livestreamService.joinLivestream(streamId);
      
      // Subscribe to real-time updates
      const chatSubscription = livestreamService.subscribeToChatMessages(streamId, (message) => {
        setState(prev => ({ 
          ...prev, 
          messages: [...prev.messages, message],
          unreadCount: prev.isChatOpen ? prev.unreadCount : prev.unreadCount + 1
        }));
      });

      // Load initial chat user profiles
      const loadChatProfiles = async () => {
        try {
          const profiles = await livestreamService.getChatUserProfiles(streamId);
          setState(prev => ({ ...prev, chatUserProfiles: profiles }));
        } catch (error) {
          console.error('Error loading chat profiles:', error);
        }
      };

      loadChatProfiles();
      
      const reactionSubscription = livestreamService.subscribeToReactions(streamId, (reaction) => {
        setState(prev => ({ 
          ...prev, 
          reactions: [...prev.reactions, reaction],
          reactionAnimations: [...prev.reactionAnimations, {
            id: reaction.id,
            type: reaction.reaction_type,
            x: reaction.position_x || Math.random() * 100,
            y: reaction.position_y || Math.random() * 100,
            timestamp: Date.now()
          }]
        }));
        
        // Remove animation after 3 seconds
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            reactionAnimations: prev.reactionAnimations.filter(anim => anim.id !== reaction.id)
          }));
        }, 3000);
      });
      
      const viewerSubscription = livestreamService.subscribeToViewerUpdates(streamId, (data) => {
        setState(prev => ({ 
          ...prev, 
          viewerCount: data.count,
          viewers: data.viewers 
        }));
      });
      
      subscriptionsRef.current = [chatSubscription, reactionSubscription, viewerSubscription];
      
      setState(prev => ({ 
        ...prev, 
        isViewing: true,
        isLoading: false 
      }));
      
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message,
        isLoading: false 
      }));
      
      toast({
        title: "Failed to Join Stream",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Leave a livestream
  const leaveStream = useCallback(async (streamId: string) => {
    try {
      await livestreamService.leaveLivestream(streamId);
      cleanup();
      
      setState(prev => ({ 
        ...prev, 
        isViewing: false,
        messages: [],
        reactions: [],
        reactionAnimations: [],
        unreadCount: 0
      }));
      
    } catch (error: any) {
      console.error('Error leaving stream:', error);
    }
  }, [cleanup]);

  // Send chat message
  const sendMessage = useCallback(async (streamId: string, message: string, type: 'text' | 'emoji' | 'question' = 'text') => {
    if (!message.trim()) {
      toast({
        title: "Cannot Send Empty Message",
        description: "Please enter a message before sending.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await livestreamService.sendChatMessage(streamId, message, type);
      
      // Show success feedback for questions
      if (type === 'question') {
        toast({
          title: "Question Sent",
          description: "Your question has been sent to the streamer.",
        });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to Send Message",
        description: error.message || "An unexpected error occurred while sending your message.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Send reaction
  const sendReaction = useCallback(async (streamId: string, type: StreamReaction['reaction_type'], position?: { x: number; y: number }) => {
    try {
      await livestreamService.sendReaction(streamId, type, position);
      
      // Show brief success feedback
      toast({
        title: "Reaction Sent! 🎉",
        description: `Your ${type} reaction was sent successfully.`,
        duration: 2000,
      });
    } catch (error: any) {
      console.error('Error sending reaction:', error);
      toast({
        title: "Failed to Send Reaction",
        description: error.message || "An unexpected error occurred while sending your reaction.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Load available streams
  const loadStreams = useCallback(async (filters?: { status?: string; community_id?: string }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const streams = await livestreamService.getLivestreams(filters);
      
      setState(prev => ({ 
        ...prev, 
        streams,
        isLoading: false 
      }));
      
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message,
        isLoading: false 
      }));
    }
  }, []);

  // Toggle chat
  const toggleChat = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isChatOpen: !prev.isChatOpen,
      unreadCount: prev.isChatOpen ? prev.unreadCount : 0
    }));
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    setState(prev => ({ ...prev, volume }));
  }, []);

  // Show/hide controls
  const showControls = useCallback(() => {
    setState(prev => ({ ...prev, isControlsVisible: true }));
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isControlsVisible: false }));
    }, 3000);
  }, []);

  const hideControls = useCallback(() => {
    setState(prev => ({ ...prev, isControlsVisible: false }));
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  }, []);

  // Toggle settings
  const toggleSettings = useCallback(() => {
    setState(prev => ({ ...prev, isSettingsOpen: !prev.isSettingsOpen }));
  }, []);

  // Update broadcast config
  const updateBroadcastConfig = useCallback((config: Partial<LiveStreamConfig>) => {
    setState(prev => ({ 
      ...prev, 
      broadcastConfig: { ...prev.broadcastConfig, ...config }
    }));
  }, []);

  // Delete a stream
  const deleteStream = useCallback(async (streamId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await livestreamService.deleteLivestream(streamId);
      
      // Remove the stream from the local state
      setState(prev => ({ 
        ...prev, 
        streams: prev.streams.filter(stream => stream.id !== streamId),
        isLoading: false 
      }));
      
      toast({
        title: "Stream Deleted",
        description: "The stream has been permanently deleted.",
      });
      
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      toast({
        title: "Error Deleting Stream",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [cleanup]);

  return {
    // State
    ...state,
    
    // Actions
    createStream,
    startBroadcast,
    stopBroadcast,
    joinStream,
    leaveStream,
    sendMessage,
    sendReaction,
    loadStreams,
    deleteStream,
    toggleChat,
    toggleMute,
    setVolume,
    showControls,
    hideControls,
    toggleSettings,
    updateBroadcastConfig,
  };
};
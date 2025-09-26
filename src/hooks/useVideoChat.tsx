import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface VideoChatState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  currentPartner: any | null;
  chatMessages: any[];
  error: string | null;
}

export const useVideoChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<VideoChatState>({
    localStream: null,
    remoteStream: null,
    isConnected: false,
    isConnecting: false,
    isMuted: false,
    isVideoOff: false,
    currentPartner: null,
    chatMessages: [],
    error: null
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize media stream
  const initializeMedia = useCallback(async () => {
    try {
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

      setState(prev => ({ ...prev, localStream: stream }));
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to access camera/microphone. Please check permissions.' 
      }));
      toast({
        title: 'Media Access Error',
        description: 'Could not access camera or microphone',
        variant: 'destructive'
      });
      return null;
    }
  }, [toast]);

  // Connect to a random partner
  const connectToPartner = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to start video chat',
        variant: 'destructive'
      });
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Initialize local media first
      const stream = await initializeMedia();
      if (!stream) {
        setState(prev => ({ ...prev, isConnecting: false }));
        return;
      }

      // Here you would implement WebRTC connection logic
      // This is a simplified version
      
      // Simulate finding a partner
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          currentPartner: {
            id: 'mock-partner',
            name: 'Random User',
            location: 'Unknown'
          }
        }));
      }, 2000);

    } catch (error) {
      console.error('Connection error:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: 'Failed to connect. Please try again.'
      }));
    }
  }, [user, initializeMedia, toast]);

  // Disconnect from current chat
  const disconnect = useCallback(() => {
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setState({
      localStream: null,
      remoteStream: null,
      isConnected: false,
      isConnecting: false,
      isMuted: false,
      isVideoOff: false,
      currentPartner: null,
      chatMessages: [],
      error: null
    });
  }, [state.localStream]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (state.localStream) {
      const audioTrack = state.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
      }
    }
  }, [state.localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (state.localStream) {
      const videoTrack = state.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setState(prev => ({ ...prev, isVideoOff: !videoTrack.enabled }));
      }
    }
  }, [state.localStream]);

  // Send chat message
  const sendMessage = useCallback((message: string) => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'local',
      timestamp: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, newMessage]
    }));

    // Here you would send the message through WebRTC data channel
  }, []);

  // Skip to next partner
  const skipPartner = useCallback(async () => {
    disconnect();
    await connectToPartner();
  }, [disconnect, connectToPartner]);

  // Report user
  const reportUser = useCallback(async (reason: string) => {
    if (!state.currentPartner) return;

    try {
      // Here you would implement the reporting logic
      toast({
        title: 'User Reported',
        description: 'Thank you for helping keep our community safe',
      });
      
      // Skip to next partner after reporting
      await skipPartner();
    } catch (error) {
      console.error('Error reporting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to report user',
        variant: 'destructive'
      });
    }
  }, [state.currentPartner, skipPartner, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    localVideoRef,
    remoteVideoRef,
    connectToPartner,
    disconnect,
    toggleMute,
    toggleVideo,
    sendMessage,
    skipPartner,
    reportUser,
    initializeMedia
  };
};

export default useVideoChat;
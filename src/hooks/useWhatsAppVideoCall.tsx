import { useState, useCallback } from 'react';

export interface WhatsAppCallState {
  isOpen: boolean;
  isMinimized: boolean;
  callId?: string;
  contactName?: string;
  contactAvatar?: string;
  communityId?: string;
}

export const useWhatsAppVideoCall = () => {
  const [callState, setCallState] = useState<WhatsAppCallState>({
    isOpen: false,
    isMinimized: false,
  });

  const startCall = useCallback((params: {
    communityId: string;
    contactName?: string;
    contactAvatar?: string;
    callId?: string;
  }) => {
    setCallState({
      isOpen: true,
      isMinimized: false,
      ...params,
    });
  }, []);

  const joinCall = useCallback((params: {
    communityId: string;
    callId: string;
    contactName?: string;
    contactAvatar?: string;
  }) => {
    setCallState({
      isOpen: true,
      isMinimized: false,
      ...params,
    });
  }, []);

  const minimizeCall = useCallback(() => {
    setCallState(prev => ({
      ...prev,
      isMinimized: true,
    }));
  }, []);

  const maximizeCall = useCallback(() => {
    setCallState(prev => ({
      ...prev,
      isMinimized: false,
    }));
  }, []);

  const endCall = useCallback(() => {
    setCallState({
      isOpen: false,
      isMinimized: false,
    });
  }, []);

  return {
    callState,
    startCall,
    joinCall,
    minimizeCall,
    maximizeCall,
    endCall,
  };
};
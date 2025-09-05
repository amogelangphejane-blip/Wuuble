import { useState, useCallback } from 'react';

interface RandomTextChatState {
  isOpen: boolean;
}

interface UseRandomTextChatReturn {
  chatState: RandomTextChatState;
  openRandomChat: () => void;
  closeRandomChat: () => void;
}

export const useRandomTextChat = (): UseRandomTextChatReturn => {
  const [chatState, setChatState] = useState<RandomTextChatState>({
    isOpen: false
  });

  const openRandomChat = useCallback(() => {
    setChatState({
      isOpen: true
    });
  }, []);

  const closeRandomChat = useCallback(() => {
    setChatState({
      isOpen: false
    });
  }, []);

  return {
    chatState,
    openRandomChat,
    closeRandomChat
  };
};
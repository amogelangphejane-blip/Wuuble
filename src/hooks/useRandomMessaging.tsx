import { useState, useEffect, useCallback } from 'react';
import { 
  randomMessagingService, 
  RandomMessagingPreferences, 
  RandomPartner, 
  RandomMessage, 
  RandomConversation 
} from '@/services/randomMessagingService';

export interface UseRandomMessagingReturn {
  // State
  currentPartner: RandomPartner | null;
  messages: RandomMessage[];
  status: 'disconnected' | 'searching' | 'connected';
  isTyping: boolean;
  
  // Actions
  findPartner: (preferences: RandomMessagingPreferences) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  endConversation: () => void;
  skipToNext: (preferences: RandomMessagingPreferences) => Promise<void>;
  reportUser: (reason: string, description?: string) => Promise<void>;
  likeUser: () => Promise<void>;
  
  // Utilities
  getCurrentConversation: () => RandomConversation | null;
  getConversationHistory: () => RandomConversation[];
}

export const useRandomMessaging = (): UseRandomMessagingReturn => {
  const [currentPartner, setCurrentPartner] = useState<RandomPartner | null>(null);
  const [messages, setMessages] = useState<RandomMessage[]>([]);
  const [status, setStatus] = useState<'disconnected' | 'searching' | 'connected'>('disconnected');
  const [isTyping, setIsTyping] = useState(false);

  // Initialize service listeners
  useEffect(() => {
    const unsubscribeMessage = randomMessagingService.onMessage((message) => {
      setMessages(prev => [...prev, message]);
    });

    const unsubscribePartner = randomMessagingService.onPartnerChange((partner) => {
      setCurrentPartner(partner);
      if (partner) {
        // Reset messages when partner changes
        const conversation = randomMessagingService.getCurrentConversation();
        setMessages(conversation?.messages || []);
      } else {
        setMessages([]);
      }
    });

    const unsubscribeStatus = randomMessagingService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unsubscribeMessage();
      unsubscribePartner();
      unsubscribeStatus();
    };
  }, []);

  // Find a random partner
  const findPartner = useCallback(async (preferences: RandomMessagingPreferences) => {
    try {
      await randomMessagingService.findRandomPartner(preferences);
    } catch (error) {
      console.error('Failed to find partner:', error);
      setStatus('disconnected');
      throw error;
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    try {
      setIsTyping(true);
      const message = await randomMessagingService.sendMessage(text);
      setMessages(prev => [...prev, message]);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    } finally {
      setIsTyping(false);
    }
  }, []);

  // End current conversation
  const endConversation = useCallback(() => {
    randomMessagingService.endConversation();
  }, []);

  // Skip to next partner
  const skipToNext = useCallback(async (preferences: RandomMessagingPreferences) => {
    try {
      await randomMessagingService.skipToNext(preferences);
    } catch (error) {
      console.error('Failed to skip to next partner:', error);
      setStatus('disconnected');
      throw error;
    }
  }, []);

  // Report current partner
  const reportUser = useCallback(async (reason: string, description?: string) => {
    if (!currentPartner) return;

    try {
      await randomMessagingService.reportUser(currentPartner.id, reason, description);
    } catch (error) {
      console.error('Failed to report user:', error);
      throw error;
    }
  }, [currentPartner]);

  // Like current partner
  const likeUser = useCallback(async () => {
    if (!currentPartner) return;

    try {
      await randomMessagingService.likeUser(currentPartner.id);
    } catch (error) {
      console.error('Failed to like user:', error);
      throw error;
    }
  }, [currentPartner]);

  // Get current conversation
  const getCurrentConversation = useCallback(() => {
    return randomMessagingService.getCurrentConversation();
  }, []);

  // Get conversation history
  const getConversationHistory = useCallback(() => {
    return randomMessagingService.getConversationHistory();
  }, []);

  return {
    // State
    currentPartner,
    messages,
    status,
    isTyping,
    
    // Actions
    findPartner,
    sendMessage,
    endConversation,
    skipToNext,
    reportUser,
    likeUser,
    
    // Utilities
    getCurrentConversation,
    getConversationHistory
  };
};
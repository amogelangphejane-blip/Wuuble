import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService, type ConversationWithParticipant, type MessageWithSender } from '@/services/messageService';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to manage conversations list
 */
export const useConversations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: conversations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      try {
        return await messageService.getConversations();
      } catch (error) {
        console.warn('Error fetching conversations:', error);
        // Return empty array instead of throwing to prevent error boundary
        return [];
      }
    },
    staleTime: 30000, // 30 seconds
    retry: false, // Disable automatic retries to prevent error boundary triggers
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = messageService.subscribeToConversations(() => {
      try {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch (error) {
        console.warn('Error invalidating conversations query:', error);
      }
    });

    return () => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing from conversations:', error);
      }
    };
  }, [queryClient]);

  return {
    conversations,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook to manage messages in a specific conversation
 */
export const useMessages = (conversationId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: messages = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      try {
        return await messageService.getMessages(conversationId);
      } catch (error) {
        console.warn('Error fetching messages:', error);
        // Return empty array instead of throwing to prevent error boundary
        return [];
      }
    },
    enabled: !!conversationId,
    staleTime: 10000, // 10 seconds
    retry: false, // Disable automatic retries to prevent error boundary triggers
  });

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = messageService.subscribeToMessages(conversationId, (newMessage) => {
      try {
        queryClient.setQueryData(['messages', conversationId], (oldMessages: MessageWithSender[] = []) => {
          // Avoid duplicates
          const exists = oldMessages.some(msg => msg.id === newMessage.id);
          if (exists) return oldMessages;
          
          return [...oldMessages, newMessage as MessageWithSender];
        });

        // Also invalidate conversations to update last message
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch (error) {
        console.warn('Error updating messages from subscription:', error);
      }
    });

    return () => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing from messages:', error);
      }
    };
  }, [conversationId, queryClient]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      messageService.markMessagesAsRead(conversationId).catch((error) => {
        // Silently handle read status errors - they shouldn't break the UI
        console.warn('Failed to mark messages as read:', error);
      });
    }
  }, [conversationId, messages.length]);

  return {
    messages,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook to send messages
 */
export const useSendMessage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      messageService.sendMessage(conversationId, content),
    onSuccess: (newMessage, variables) => {
      try {
        // Optimistically update the messages list
        queryClient.setQueryData(['messages', variables.conversationId], (oldMessages: MessageWithSender[] = []) => {
          const exists = oldMessages.some(msg => msg.id === newMessage.id);
          if (exists) return oldMessages;
          
          return [...oldMessages, newMessage as MessageWithSender];
        });

        // Invalidate conversations to update last message timestamp
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch (error) {
        console.warn('Error updating UI after message send:', error);
      }
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    sendMessage: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

/**
 * Hook to create or get a conversation with another user
 */
export const useCreateConversation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (otherUserId: string) => messageService.getOrCreateConversation(otherUserId),
    onSuccess: () => {
      try {
        // Refresh conversations list
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch (error) {
        console.warn('Error invalidating conversations after creation:', error);
      }
    },
    onError: (error) => {
      console.error('Failed to create conversation:', error);
      toast({
        title: "Failed to start conversation",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    createConversation: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

/**
 * Hook to search for users
 */
export const useUserSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  }>>([]);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await messageService.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    clearResults: () => setSearchResults([]),
  };
};

/**
 * Hook to manage message input state
 */
export const useMessageInput = (onSend: (content: string) => void) => {
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = useCallback(() => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    onSend(trimmedContent);
    setContent('');
    setIsTyping(false);
  }, [content, onSend]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsTyping(newContent.trim().length > 0);
  }, []);

  return {
    content,
    isTyping,
    handleSend,
    handleKeyPress,
    handleContentChange,
    canSend: content.trim().length > 0,
  };
};
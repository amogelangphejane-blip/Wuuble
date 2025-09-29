import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { messagingService } from '@/services/messaging.service';
import type {
  ConversationWithDetails,
  MessageWithSender,
  User,
  UseMessagesReturn,
  UseConversationsReturn,
  UseTypingReturn,
  MessagingUIState,
  MessagingError
} from '@/types/messaging';

// ============================================================================
// CONVERSATIONS HOOK
// ============================================================================

export function useConversations(): UseConversationsReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: conversationsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      return await messagingService.getConversations({
        offset: pageParam,
        limit: 20
      });
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.has_more) {
        return pages.length * 20;
      }
      return undefined;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  const conversations = conversationsData?.pages.flatMap(page => page.conversations) || [];

  const createConversationMutation = useMutation({
    mutationFn: ({ userIds, isGroup, name }: { userIds: string[]; isGroup?: boolean; name?: string }) =>
      messagingService.createConversation(userIds, isGroup, name),
    onSuccess: (newConversation) => {
      queryClient.setQueryData(['conversations', user?.id], (old: any) => {
        if (!old) return { pages: [{ conversations: [newConversation], total: 1, has_more: false }], pageParams: [0] };
        
        const updatedPages = [...old.pages];
        updatedPages[0] = {
          ...updatedPages[0],
          conversations: [newConversation, ...updatedPages[0].conversations]
        };
        
        return { ...old, pages: updatedPages };
      });
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (conversationId: string) => messagingService.markConversationAsRead(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.setQueryData(['conversations', user?.id], (old: any) => {
        if (!old) return old;
        
        const updatedPages = old.pages.map((page: any) => ({
          ...page,
          conversations: page.conversations.map((conv: ConversationWithDetails) =>
            conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
          )
        }));
        
        return { ...old, pages: updatedPages };
      });
    }
  });

  const searchConversations = useCallback(async (query: string): Promise<ConversationWithDetails[]> => {
    if (!query.trim()) return conversations;
    
    return conversations.filter(conv => {
      const searchText = `${conv.name || ''} ${conv.other_participant?.display_name || ''} ${conv.last_message?.content || ''}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });
  }, [conversations]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const subscription = messagingService.subscribeToConversations(
      user.id,
      (event) => {
        queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, queryClient]);

  return {
    conversations,
    isLoading: isLoading || isFetchingNextPage,
    isError: !!error,
    error: error as MessagingError | null,
    hasMore: hasNextPage || false,
    loadMore: fetchNextPage,
    createConversation: createConversationMutation.mutateAsync,
    updateConversation: async (conversationId: string, updates: any) => {
      // Implementation for updating conversation
      throw new Error('Not implemented');
    },
    deleteConversation: async (conversationId: string) => {
      // Implementation for deleting conversation
      throw new Error('Not implemented');
    },
    markAsRead: markAsReadMutation.mutateAsync,
    searchConversations
  };
}

// ============================================================================
// MESSAGES HOOK
// ============================================================================

export function useMessages(conversationId: string | null): UseMessagesReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: messagesData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!conversationId) throw new Error('No conversation ID provided');
      
      return await messagingService.getMessages(conversationId, {
        offset: pageParam,
        limit: 50
      });
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.has_more) {
        return pages.length * 50;
      }
      return undefined;
    },
    enabled: !!conversationId && !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  const messages = messagesData?.pages.flatMap(page => page.messages) || [];

  const sendMessageMutation = useMutation({
    mutationFn: ({ content, messageType, replyTo }: { 
      content: string; 
      messageType?: any; 
      replyTo?: string 
    }) => {
      if (!conversationId) throw new Error('No conversation ID');
      return messagingService.sendMessage(conversationId, content, messageType, replyTo);
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(['messages', conversationId], (old: any) => {
        if (!old) return { pages: [{ messages: [newMessage], total: 1, has_more: false }], pageParams: [0] };
        
        const updatedPages = [...old.pages];
        const lastPageIndex = updatedPages.length - 1;
        updatedPages[lastPageIndex] = {
          ...updatedPages[lastPageIndex],
          messages: [...updatedPages[lastPageIndex].messages, newMessage]
        };
        
        return { ...old, pages: updatedPages };
      });
      
      // Update conversations list with new last message
      queryClient.setQueryData(['conversations', user?.id], (old: any) => {
        if (!old) return old;
        
        const updatedPages = old.pages.map((page: any) => ({
          ...page,
          conversations: page.conversations.map((conv: ConversationWithDetails) =>
            conv.id === conversationId ? { 
              ...conv, 
              last_message: newMessage,
              last_message_at: newMessage.created_at
            } : conv
          )
        }));
        
        return { ...old, pages: updatedPages };
      });
    }
  });

  const editMessageMutation = useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      messagingService.editMessage(messageId, content),
    onSuccess: (updatedMessage) => {
      queryClient.setQueryData(['messages', conversationId], (old: any) => {
        if (!old) return old;
        
        const updatedPages = old.pages.map((page: any) => ({
          ...page,
          messages: page.messages.map((msg: MessageWithSender) =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          )
        }));
        
        return { ...old, pages: updatedPages };
      });
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => messagingService.deleteMessage(messageId),
    onSuccess: (_, messageId) => {
      queryClient.setQueryData(['messages', conversationId], (old: any) => {
        if (!old) return old;
        
        const updatedPages = old.pages.map((page: any) => ({
          ...page,
          messages: page.messages.map((msg: MessageWithSender) =>
            msg.id === messageId ? { 
              ...msg, 
              content: '[This message was deleted]',
              is_deleted: true 
            } : msg
          )
        }));
        
        return { ...old, pages: updatedPages };
      });
    }
  });

  // Real-time subscription
  useEffect(() => {
    if (!conversationId) return;

    const subscription = messagingService.subscribeToMessages(
      conversationId,
      (event) => {
        if (event.eventType === 'INSERT') {
          queryClient.setQueryData(['messages', conversationId], (old: any) => {
            if (!old) return old;
            
            // Avoid duplicate messages
            const lastPage = old.pages[old.pages.length - 1];
            const messageExists = lastPage.messages.some((msg: MessageWithSender) => msg.id === event.new.id);
            
            if (!messageExists) {
              const updatedPages = [...old.pages];
              const lastPageIndex = updatedPages.length - 1;
              updatedPages[lastPageIndex] = {
                ...updatedPages[lastPageIndex],
                messages: [...updatedPages[lastPageIndex].messages, event.new]
              };
              
              return { ...old, pages: updatedPages };
            }
            
            return old;
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, queryClient]);

  return {
    messages,
    isLoading: isLoading || isFetchingNextPage,
    isError: !!error,
    error: error as MessagingError | null,
    hasMore: hasNextPage || false,
    loadMore: fetchNextPage,
    sendMessage: sendMessageMutation.mutateAsync,
    editMessage: editMessageMutation.mutateAsync,
    deleteMessage: deleteMessageMutation.mutateAsync,
    addReaction: async (messageId: string, emoji: string) => {
      // Implementation for adding reaction
      throw new Error('Not implemented');
    },
    removeReaction: async (messageId: string, emoji: string) => {
      // Implementation for removing reaction
      throw new Error('Not implemented');
    }
  };
}

// ============================================================================
// USER SEARCH HOOK
// ============================================================================

export function useUserSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const queryClient = useQueryClient();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const {
    data: usersData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['users', 'search', debouncedQuery],
    queryFn: async ({ pageParam = 0 }) => {
      if (!debouncedQuery.trim()) {
        return { users: [], total: 0, has_more: false };
      }
      
      return await messagingService.searchUsers(debouncedQuery, {
        offset: pageParam,
        limit: 20
      });
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.has_more) {
        return pages.length * 20;
      }
      return undefined;
    },
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const users = usersData?.pages.flatMap(page => page.users) || [];

  return {
    query,
    setQuery,
    users,
    isLoading: isLoading || isFetchingNextPage,
    isError: !!error,
    error: error as MessagingError | null,
    hasMore: hasNextPage || false,
    loadMore: fetchNextPage
  };
}

// ============================================================================
// TYPING INDICATOR HOOK
// ============================================================================

export function useTyping(conversationId: string | null): UseTypingReturn {
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  const { user } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTyping = useCallback((convId: string) => {
    if (!user) return;
    
    messagingService.startTyping(convId);
    
    // Auto-stop typing after 3 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      messagingService.stopTyping(convId);
    }, 3000);
  }, [user]);

  const stopTyping = useCallback((convId: string) => {
    if (!user) return;
    
    messagingService.stopTyping(convId);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [user]);

  // Real-time typing subscription
  useEffect(() => {
    if (!conversationId) return;

    const subscription = messagingService.subscribeToTyping(
      conversationId,
      (event) => {
        if (event.type === 'sync' || event.type === 'join' || event.type === 'leave') {
          const typingUserIds = Object.keys(event.currentPresences || {})
            .filter(userId => userId !== user?.id);
          
          // In a real implementation, you'd fetch user details
          // For now, we'll just track user IDs
          setTypingUsers(typingUserIds.map(id => ({
            id,
            display_name: 'User',
            email: '',
            avatar_url: null,
            created_at: '',
            updated_at: ''
          })));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, user?.id]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    startTyping,
    stopTyping
  };
}

// ============================================================================
// MESSAGING UI STATE HOOK
// ============================================================================

export function useMessagingUI() {
  const [uiState, setUIState] = useState<MessagingUIState>({
    selectedConversationId: null,
    isMobileView: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    showConversationList: true,
    showUserSearch: false,
    searchQuery: '',
    replyingTo: null,
    editingMessage: null
  });

  // Handle window resize for mobile view
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setUIState(prev => ({
        ...prev,
        isMobileView: isMobile,
        showConversationList: isMobile ? !prev.selectedConversationId : true
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectConversation = useCallback((conversationId: string | null) => {
    setUIState(prev => ({
      ...prev,
      selectedConversationId: conversationId,
      showConversationList: prev.isMobileView ? false : true,
      replyingTo: null,
      editingMessage: null
    }));
  }, []);

  const toggleConversationList = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      showConversationList: !prev.showConversationList,
      selectedConversationId: prev.showConversationList ? null : prev.selectedConversationId
    }));
  }, []);

  const setReplyingTo = useCallback((message: MessageWithSender | null) => {
    setUIState(prev => ({
      ...prev,
      replyingTo: message,
      editingMessage: null
    }));
  }, []);

  const setEditingMessage = useCallback((message: MessageWithSender | null) => {
    setUIState(prev => ({
      ...prev,
      editingMessage: message,
      replyingTo: null
    }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setUIState(prev => ({
      ...prev,
      searchQuery: query
    }));
  }, []);

  const toggleUserSearch = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      showUserSearch: !prev.showUserSearch,
      searchQuery: ''
    }));
  }, []);

  return {
    ...uiState,
    selectConversation,
    toggleConversationList,
    setReplyingTo,
    setEditingMessage,
    setSearchQuery,
    toggleUserSearch
  };
}
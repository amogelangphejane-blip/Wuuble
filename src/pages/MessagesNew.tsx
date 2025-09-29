import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  MoreVertical, 
  Info, 
  Search,
  Users,
  Settings,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Import our new components
import { ConversationList } from '@/components/messaging/ConversationList';
import { MessageBubble } from '@/components/messaging/MessageBubble';
import { MessageInput } from '@/components/messaging/MessageInput';

// Import hooks
import { useAuth } from '@/hooks/useAuth';
import { useConversations, useMessages, useUserSearch, useMessagingUI, useTyping } from '@/hooks/useMessaging';

// Types
import type { ConversationWithDetails, MessageWithSender, User } from '@/types/messaging';

const MessagesNew: React.FC = () => {
  const { user } = useAuth();
  
  // Messaging hooks
  const {
    conversations,
    isLoading: conversationsLoading,
    isError: conversationsError,
    createConversation,
    markAsRead
  } = useConversations();
  
  const {
    selectedConversationId,
    isMobileView,
    showConversationList,
    showUserSearch,
    searchQuery,
    replyingTo,
    editingMessage,
    selectConversation,
    toggleConversationList,
    setReplyingTo,
    setEditingMessage,
    setSearchQuery,
    toggleUserSearch
  } = useMessagingUI();
  
  const {
    messages,
    isLoading: messagesLoading,
    sendMessage,
    editMessage,
    deleteMessage
  } = useMessages(selectedConversationId);
  
  const {
    query: userSearchQuery,
    setQuery: setUserSearchQuery,
    users: searchUsers,
    isLoading: userSearchLoading
  } = useUserSearch();
  
  const {
    typingUsers,
    startTyping,
    stopTyping
  } = useTyping(selectedConversationId);

  // Get current conversation
  const currentConversation = selectedConversationId 
    ? conversations.find(c => c.id === selectedConversationId) 
    : null;

  // Authentication check
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-xl">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-300">Please sign in to access your messages.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (conversationsError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-xl">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Unable to Load Messages</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            There was an error loading your conversations. Please try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  const handleSelectConversation = (conversation: ConversationWithDetails) => {
    selectConversation(conversation.id);
    markAsRead(conversation.id);
  };

  const handleSendMessage = async (content: string, replyToId?: string) => {
    if (!selectedConversationId) return;
    
    await sendMessage({
      content,
      messageType: 'text',
      replyTo: replyToId
    });
  };

  const handleStartConversation = async (userId: string) => {
    try {
      const conversation = await createConversation({
        userIds: [userId],
        isGroup: false
      });
      selectConversation(conversation.id);
      toggleUserSearch();
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const handleReply = (message: MessageWithSender) => {
    setReplyingTo(message);
  };

  const handleEdit = (message: MessageWithSender) => {
    setEditingMessage(message);
  };

  const handleDelete = async (messageId: string) => {
    await deleteMessage(messageId);
  };

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900 overflow-hidden">
      {/* Conversation List */}
      <div className={cn(
        "transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700",
        "w-full sm:w-80 md:w-80 lg:w-96 flex-shrink-0",
        isMobileView && selectedConversationId ? "hidden" : "flex flex-col"
      )}>
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          onCreateConversation={toggleUserSearch}
          isLoading={conversationsLoading}
          currentUser={user}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
        !selectedConversationId && isMobileView ? "hidden" : "flex"
      )}>
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <ChatHeader
              conversation={currentConversation}
              onBack={() => selectConversation(null)}
              showBackButton={isMobileView}
              typingUsers={typingUsers}
            />

            {/* Messages Area */}
            <MessagesArea
              messages={messages}
              isLoading={messagesLoading}
              currentUser={user}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              onStartTyping={() => startTyping(selectedConversationId!)}
              onStopTyping={() => stopTyping(selectedConversationId!)}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              editingMessage={editingMessage}
              onCancelEdit={() => setEditingMessage(null)}
              className="border-t border-gray-200 dark:border-gray-700"
            />
          </>
        ) : (
          /* Empty State */
          <EmptyState />
        )}
      </div>

      {/* User Search Dialog */}
      <UserSearchDialog
        isOpen={showUserSearch}
        onClose={toggleUserSearch}
        searchQuery={userSearchQuery}
        onSearchChange={setUserSearchQuery}
        users={searchUsers}
        isLoading={userSearchLoading}
        onSelectUser={handleStartConversation}
      />
    </div>
  );
};

// ============================================================================
// CHAT HEADER COMPONENT
// ============================================================================

interface ChatHeaderProps {
  conversation: ConversationWithDetails;
  onBack: () => void;
  showBackButton: boolean;
  typingUsers: User[];
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onBack,
  showBackButton,
  typingUsers
}) => {
  const displayName = conversation.is_group 
    ? conversation.name || 'Group Chat'
    : conversation.other_participant?.display_name || 'Unknown User';

  const displayAvatar = conversation.is_group 
    ? conversation.avatar_url 
    : conversation.other_participant?.avatar_url;

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Mock online status
  const isOnline = Math.random() > 0.5;

  return (
    <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Back Button */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full flex-shrink-0"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={displayAvatar || undefined} />
              <AvatarFallback className={cn(
                "text-sm font-medium",
                conversation.is_group 
                  ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                  : "bg-gradient-to-br from-blue-500 to-teal-500 text-white"
              )}>
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            
            {!conversation.is_group && isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-50 dark:border-gray-800" />
            )}
          </div>
          
          {/* Name and Status */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {displayName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {typingUsers.length > 0 
                ? `${typingUsers.map(u => u.display_name).join(', ')} typing...`
                : !conversation.is_group && isOnline 
                  ? 'Active now' 
                  : 'Last seen recently'
              }
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-full"
            disabled
          >
            <Video className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-full"
            disabled
          >
            <Phone className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-full"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Info className="mr-2 h-4 w-4" />
                Conversation Info
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Search className="mr-2 h-4 w-4" />
                Search Messages
              </DropdownMenuItem>
              {conversation.is_group && (
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Members
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MESSAGES AREA COMPONENT
// ============================================================================

interface MessagesAreaProps {
  messages: MessageWithSender[];
  isLoading: boolean;
  currentUser: User;
  onReply: (message: MessageWithSender) => void;
  onEdit: (message: MessageWithSender) => void;
  onDelete: (messageId: string) => void;
}

const MessagesArea: React.FC<MessagesAreaProps> = ({
  messages,
  isLoading,
  currentUser,
  onReply,
  onEdit,
  onDelete
}) => {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="space-y-2 flex-1 max-w-[70%]">
              <Skeleton className="h-4 w-20" />
              <Skeleton className={`h-16 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-32'}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Start the conversation</h3>
          <p className="text-gray-600 dark:text-gray-300">Send a message to begin your conversation</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea 
      className="flex-1 bg-gray-50 dark:bg-gray-900" 
      ref={scrollAreaRef}
    >
      <div className="p-4 space-y-1">
        {messages.map((message, index) => {
          const isOwn = message.sender_id === currentUser.id;
          const previousMessage = messages[index - 1];
          const showAvatar = !previousMessage || previousMessage.sender_id !== message.sender_id;
          const isLast = index === messages.length - 1;
          
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={isOwn}
              showAvatar={showAvatar}
              isLast={isLast}
              currentUser={currentUser}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          );
        })}
        
        <div className="h-4" />
      </div>
    </ScrollArea>
  );
};

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

const EmptyState: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md p-8">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        
        <h3 className="text-2xl font-light mb-4 text-gray-600 dark:text-gray-300">
          Welcome to Messages
        </h3>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
          Select a conversation to start messaging, or create a new conversation to connect with others.
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// USER SEARCH DIALOG COMPONENT
// ============================================================================

interface UserSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  users: User[];
  isLoading: boolean;
  onSelectUser: (userId: string) => void;
}

const UserSearchDialog: React.FC<UserSearchDialogProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  users,
  isLoading,
  onSelectUser
}) => {
  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search for users..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="max-h-60">
            <div className="space-y-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))
              ) : users.length === 0 && searchQuery ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">No users found</p>
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => onSelectUser(user.id)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                        {getInitials(user.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {user.display_name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessagesNew;
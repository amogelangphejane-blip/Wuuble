import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Video, MoreVertical, Info, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConversationList } from '@/components/ConversationList';
import { MessageThread } from '@/components/MessageThread';
import { MessageInput } from '@/components/MessageInput';
import { MessagingErrorBoundary, useMessagingErrorHandler } from '@/components/MessagingErrorBoundary';
import { useSendMessage, useConversations } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Messages: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { handleError } = useMessagingErrorHandler();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);
  const { sendMessage, isLoading: isSending, error: sendError } = useSendMessage();
  const { conversations, error: conversationsError } = useConversations();

  // Find the selected conversation to show participant info in header
  const selectedConversation = selectedConversationId 
    ? conversations.find(c => c.id === selectedConversationId)
    : null;

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) {
      toast({
        title: "No conversation selected",
        description: "Please select a conversation to send a message.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to send messages.",
        variant: "destructive",
      });
      return;
    }

    try {
      sendMessage({
        conversationId: selectedConversationId,
        content,
      });
    } catch (error) {
      console.warn('Error in handleSendMessage:', error);
      const errorInfo = handleError(error as Error, 'sendMessage');
      toast({
        title: "Failed to send message",
        description: errorInfo.message,
        variant: "destructive",
      });
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsMobileConversationOpen(true);
  };

  const handleBackToList = () => {
    setIsMobileConversationOpen(false);
    setSelectedConversationId(null);
  };

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
  const isParticipantOnline = Math.random() > 0.5;

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center max-w-md p-8 rounded-2xl bg-card/50 backdrop-blur-sm border shadow-lg">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-muted-foreground/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Please log in to access messages</h2>
          <p className="text-muted-foreground">You need to be authenticated to view and send messages.</p>
        </div>
      </div>
    );
  }

  // Show error state if conversations failed to load
  if (conversationsError) {
    const errorInfo = handleError(conversationsError as Error, 'conversations');
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center max-w-md p-8 rounded-2xl bg-card/50 backdrop-blur-sm border shadow-lg">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Unable to load conversations</h2>
          <p className="text-muted-foreground mb-4">{errorInfo.message}</p>
          {errorInfo.canRetry && (
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <MessagingErrorBoundary>
      <div className="h-screen flex bg-white dark:bg-[#111b21] overflow-hidden">
      {/* Conversation List - Hidden on mobile when conversation is open */}
      <div className={cn(
        "w-full sm:w-80 md:w-80 lg:w-96 flex-shrink-0 transition-all duration-300 ease-in-out",
        "md:block",
        isMobileConversationOpen ? "hidden" : "block"
      )}>
        <ConversationList
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0",
        "md:flex",
        !isMobileConversationOpen && selectedConversationId ? "hidden md:flex" : "flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-[#f0f2f5] dark:bg-[#202c33] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full h-8 w-8 flex-shrink-0"
                    onClick={handleBackToList}
                  >
                    <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                  
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-8 w-8 md:h-10 md:w-10">
                      <AvatarImage src={selectedConversation.participant.avatar_url || undefined} />
                      <AvatarFallback className="bg-[#ddd] dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs md:text-sm">
                        {getInitials(selectedConversation.participant.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    {isParticipantOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 bg-[#25d366] rounded-full border-2 border-[#f0f2f5] dark:border-[#202c33]" />
                    )}
                  </div>
                  
                  <div className="cursor-pointer min-w-0 flex-1">
                    <h3 className="font-medium text-sm md:text-[17px] text-gray-900 dark:text-gray-100 truncate">
                      {selectedConversation.participant.display_name || 'Unknown User'}
                    </h3>
                    <p className="text-xs md:text-[13px] text-gray-500 dark:text-gray-400">
                      {isParticipantOnline ? 'online' : 'last seen recently'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full h-8 w-8 md:h-10 md:w-10"
                    disabled
                  >
                    <Video className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full h-8 w-8 md:h-10 md:w-10"
                    disabled
                  >
                    <Phone className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full h-8 w-8 md:h-10 md:w-10"
                      >
                        <MoreVertical className="h-4 w-4 md:h-5 md:w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 md:w-48">
                      <DropdownMenuItem className="flex items-center gap-2 md:gap-3 py-2 md:py-3 text-sm">
                        <Info className="h-3 w-3 md:h-4 md:w-4" />
                        Contact info
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 md:gap-3 py-2 md:py-3 text-sm">
                        Select messages
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 md:gap-3 py-2 md:py-3 text-sm">
                        Mute notifications
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 md:gap-3 py-2 md:py-3 text-sm">
                        Clear messages
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 md:gap-3 py-2 md:py-3 text-sm text-red-600 dark:text-red-400">
                        Delete chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Message Thread */}
            <MessageThread conversationId={selectedConversationId} />

            {/* Message Input */}
            <MessageInput
              onSend={handleSendMessage}
              disabled={isSending}
              placeholder="Type a message..."
            />
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-[#f0f2f5] dark:bg-[#0b141a] border-l border-gray-200 dark:border-gray-700 px-4">
            <div className="text-center max-w-sm md:max-w-md p-4 md:p-8">
              <div className="relative mb-6 md:mb-8">
                {/* Messaging logo placeholder */}
                <div className="w-20 h-20 md:w-32 md:h-32 mx-auto mb-4 md:mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 md:w-16 md:h-16 text-primary/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-xl md:text-[32px] font-light mb-3 md:mb-4 text-gray-400 dark:text-gray-500">
                Messages
              </h3>
              <p className="text-sm md:text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed mb-4 md:mb-6">
                Send and receive messages instantly.<br />
                Stay connected with your community and friends.
              </p>
              
              <div className="flex items-center justify-center gap-1 md:gap-2 text-[10px] md:text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-4 md:pt-6 mt-4 md:mt-6">
                <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-center">Your personal messages are end-to-end encrypted</span>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </MessagingErrorBoundary>
  );
};

export default Messages;
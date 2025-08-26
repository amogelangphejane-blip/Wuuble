import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Video, MoreVertical, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConversationList } from '@/components/ConversationList';
import { MessageThread } from '@/components/MessageThread';
import { MessageInput } from '@/components/MessageInput';
import { useSendMessage, useConversations } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);
  const { sendMessage, isLoading: isSending } = useSendMessage();
  const { conversations } = useConversations();

  // Find the selected conversation to show participant info in header
  const selectedConversation = selectedConversationId 
    ? conversations.find(c => c.id === selectedConversationId)
    : null;

  const handleSendMessage = (content: string) => {
    if (!selectedConversationId) return;
    
    sendMessage({
      conversationId: selectedConversationId,
      content,
    });
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

  return (
    <div className="h-screen flex bg-background">
      {/* Conversation List - Hidden on mobile when conversation is open */}
      <div className={cn(
        "flex-shrink-0 transition-all duration-300 ease-in-out",
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
        "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        "md:block",
        !isMobileConversationOpen && selectedConversationId ? "hidden md:flex" : "flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-background/95 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden hover:bg-muted/80 transition-colors"
                    onClick={handleBackToList}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="relative">
                    <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                      <AvatarImage src={selectedConversation.participant.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {getInitials(selectedConversation.participant.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    {isParticipantOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background shadow-sm" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {selectedConversation.participant.display_name || 'Unknown User'}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {isParticipantOnline ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          Online now
                        </>
                      ) : (
                        'Last seen recently'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-muted/80 transition-colors"
                    disabled
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-muted/80 transition-colors"
                    disabled
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:bg-muted/80 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>Search Messages</DropdownMenuItem>
                      <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete Conversation
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
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-muted/10 to-background">
            <div className="text-center max-w-md p-8">
              <div className="relative mb-8">
                {/* Animated background circles */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full animate-pulse" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full animate-pulse delay-75" />
                </div>
                
                {/* Main icon */}
                <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg">
                  <svg
                    className="w-10 h-10 text-muted-foreground/70"
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
              
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Welcome to Messages
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Select a conversation from the sidebar to start chatting, or create a new conversation 
                to connect with other members.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Your messages are private and secure</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
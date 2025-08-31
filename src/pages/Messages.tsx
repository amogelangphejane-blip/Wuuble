import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Video, MoreVertical, Info, AlertCircle, Palette } from 'lucide-react';
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
import { WallpaperSettings } from '@/components/WallpaperSettings';
import { WallpaperProvider, useWallpaper } from '@/contexts/WallpaperContext';
import { useSendMessage, useConversations } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MessagesContent: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { handleError } = useMessagingErrorHandler();
  const { currentWallpaper, setWallpaper, customWallpapers, addCustomWallpaper } = useWallpaper();
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
      <div className="h-screen flex relative overflow-hidden" style={currentWallpaper.style}>
        {/* Global overlay for better contrast */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] pointer-events-none" />
        
        {/* Conversation List - Hidden on mobile when conversation is open */}
        <div className={cn(
          "w-full md:w-96 flex-shrink-0 transition-all duration-500 ease-in-out relative z-10",
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
          "flex-1 flex flex-col transition-all duration-500 ease-in-out relative z-10",
          "md:flex",
          !isMobileConversationOpen && selectedConversationId ? "hidden md:flex" : "flex"
        )}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-white/10 bg-black/20 backdrop-blur-xl shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden text-white/80 hover:bg-white/10 rounded-full h-10 w-10 backdrop-blur-sm border border-white/20"
                      onClick={handleBackToList}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-white/20 shadow-lg">
                        <AvatarImage src={selectedConversation.participant.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                          {getInitials(selectedConversation.participant.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      {isParticipantOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black/20 shadow-lg animate-pulse" />
                      )}
                    </div>
                    
                    <div className="cursor-pointer">
                      <h3 className="font-bold text-lg text-white drop-shadow-sm">
                        {selectedConversation.participant.display_name || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-white/70 drop-shadow-sm">
                        {isParticipantOnline ? 'online' : 'last seen recently'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white/70 hover:bg-white/10 rounded-full h-12 w-12 backdrop-blur-sm border border-white/20 shadow-lg transition-all duration-200 hover:scale-105"
                      disabled
                    >
                      <Video className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white/70 hover:bg-white/10 rounded-full h-12 w-12 backdrop-blur-sm border border-white/20 shadow-lg transition-all duration-200 hover:scale-105"
                      disabled
                    >
                      <Phone className="h-5 w-5" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-white/70 hover:bg-white/10 rounded-full h-12 w-12 backdrop-blur-sm border border-white/20 shadow-lg transition-all duration-200 hover:scale-105"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-black/90 backdrop-blur-md border-white/20">
                        <DropdownMenuItem className="flex items-center gap-3 py-3 text-white hover:bg-white/10">
                          <Info className="h-4 w-4" />
                          Contact info
                        </DropdownMenuItem>
                        <DropdownMenuItem className="p-0">
                          <WallpaperSettings
                            selectedWallpaper={currentWallpaper.id}
                            onWallpaperChange={setWallpaper}
                            customWallpapers={customWallpapers}
                            onCustomUpload={addCustomWallpaper}
                            trigger="text"
                          />
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-3 py-3 text-white hover:bg-white/10">
                          Select messages
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-3 py-3 text-white hover:bg-white/10">
                          Mute notifications
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-3 py-3 text-white hover:bg-white/10">
                          Clear messages
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-3 py-3 text-red-400 hover:bg-red-500/10">
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
            <div className="flex-1 flex items-center justify-center relative">
              <div className="text-center max-w-md p-8 relative z-10">
                <div className="relative mb-8">
                  {/* Messaging logo placeholder */}
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-xl">
                    <svg
                      className="w-16 h-16 text-white/80"
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
                
                <h3 className="text-3xl font-bold mb-4 text-white drop-shadow-lg">
                  Messages
                </h3>
                <p className="text-white/80 leading-relaxed mb-8 text-base drop-shadow-md">
                  Send and receive messages instantly.<br />
                  Stay connected with your community and friends.
                </p>
                
                {/* Wallpaper Settings Button */}
                <div className="mb-8">
                  <WallpaperSettings
                    selectedWallpaper={currentWallpaper.id}
                    onWallpaperChange={setWallpaper}
                    customWallpapers={customWallpapers}
                    onCustomUpload={addCustomWallpaper}
                  />
                </div>
                
                <div className="flex items-center justify-center gap-2 text-xs text-white/60 border-t border-white/20 pt-6 mt-6 drop-shadow-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Your personal messages are end-to-end encrypted</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MessagingErrorBoundary>
  );
};

const Messages: React.FC = () => {
  return (
    <WallpaperProvider>
      <MessagesContent />
    </WallpaperProvider>
  );
};

export default Messages;
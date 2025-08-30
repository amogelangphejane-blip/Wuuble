import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageBubble } from './MessageBubble';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useWallpaper } from '@/contexts/WallpaperContext';

interface MessageThreadProps {
  conversationId: string | null;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  conversationId,
}) => {
  const { user } = useAuth();
  const { messages, isLoading } = useMessages(conversationId);
  const { currentWallpaper } = useWallpaper();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  if (!conversationId) {
    return (
      <div 
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        style={currentWallpaper.style}
        role="main"
        aria-label="No conversation selected"
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
        
        <div className="text-center max-w-md relative z-10">
          <div 
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-xl"
            aria-hidden="true"
          >
            <svg
              className="w-12 h-12 text-white/80"
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
          <h3 className="text-lg font-semibold mb-2 text-white drop-shadow-lg">No conversation selected</h3>
          <p className="text-sm text-white/80 drop-shadow-md">
            Choose a conversation from the list to start messaging
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        className="flex-1 p-6 space-y-6 relative overflow-hidden"
        style={currentWallpaper.style}
        role="main"
        aria-label="Loading messages"
        aria-busy="true"
      >
        {/* Overlay for better skeleton visibility */}
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
        
        <div className="relative z-10">
          <div className="sr-only" aria-live="polite">
            Loading conversation messages...
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
              <Skeleton className="h-8 w-8 rounded-full shrink-0 bg-white/20" />
              <div className="space-y-2 flex-1 max-w-[70%]">
                <Skeleton className="h-4 w-20 bg-white/20" />
                <Skeleton className={`h-12 rounded-3xl ${i % 2 === 0 ? 'w-48' : 'w-32'} bg-white/30`} />
                <Skeleton className="h-3 w-16 bg-white/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div 
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        style={currentWallpaper.style}
        role="main"
        aria-label="Empty conversation"
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
        
        <div className="text-center max-w-md relative z-10">
          <div 
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-xl"
            aria-hidden="true"
          >
            <svg
              className="w-10 h-10 text-white/80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-white drop-shadow-lg">Start the conversation</h3>
          <p className="text-sm text-white/80 drop-shadow-md">
            Send a message to begin your conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea 
      className="flex-1 relative overflow-hidden custom-scrollbar" 
      ref={scrollAreaRef}
      role="main"
      aria-label={`Conversation with ${messages.length} messages`}
      style={currentWallpaper.style}
    >
      {/* Subtle overlay for better message readability */}
      <div className="absolute inset-0 bg-black/5 backdrop-blur-[0.5px] pointer-events-none" />
      
      <div 
        className="p-6 space-y-2 relative z-10"
        role="list"
        aria-label="Messages"
      >
        <div className="sr-only" aria-live="polite" id="message-count">
          {messages.length} message{messages.length !== 1 ? 's' : ''} in conversation
        </div>
        
        {messages.map((message, index) => {
          const isOwn = message.sender_id === user?.id;
          const previousMessage = messages[index - 1];
          const nextMessage = messages[index + 1];
          const isLast = index === messages.length - 1;
          
          // Show avatar if it's the first message or sender changed
          const showAvatar = !previousMessage || previousMessage.sender_id !== message.sender_id;
          
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={isOwn}
              showAvatar={showAvatar}
              isLast={isLast}
            />
          );
        })}
        
        {/* Extra padding at the bottom for better UX */}
        <div className="h-6" aria-hidden="true" />
      </div>
    </ScrollArea>
  );
};
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Clock, MoreHorizontal, Reply, Heart, ThumbsUp, Smile, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MessageWithSender } from '@/services/messageService';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showAvatar?: boolean;
  isLast?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  isLast = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMessageStatus = () => {
    if (!isOwn) return null;
    
    // Message status indicators
    // In a real implementation, this would be based on message.status
    const messageAge = Date.now() - new Date(message.created_at).getTime();
    const isRead = messageAge > 10000; // Simulate read status after 10 seconds
    const isDelivered = messageAge > 2000; // Simulate delivered status after 2 seconds
    
    if (isRead) {
      return <CheckCheck className="h-3 w-3 text-emerald-400 drop-shadow-sm" />; // Emerald checkmarks for read
    } else if (isDelivered) {
      return <CheckCheck className="h-3 w-3 text-white/50 drop-shadow-sm" />; // White checkmarks for delivered
    } else {
      return <Check className="h-3 w-3 text-white/40 drop-shadow-sm" />; // Single checkmark for sent
    }
  };

  const handleReaction = (emoji: string) => {
    // TODO: Implement reaction functionality
    console.log('Reaction:', emoji, 'on message:', message.id);
    setShowReactions(false);
  };

  const handleReply = () => {
    // TODO: Implement reply functionality
    console.log('Reply to message:', message.id);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Could implement message selection or context menu
    }
  };

  const messageTime = message.created_at ? format(new Date(message.created_at), 'HH:mm') : '--:--';
  const senderName = message.sender?.display_name || 'Unknown User';

  return (
    <div 
      className={cn(
        "group flex gap-3 mb-4 transition-all duration-300 animate-messageSlideIn",
        isOwn ? "flex-row-reverse" : "flex-row",
        isLast ? "mb-6" : ""
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="listitem"
      aria-label={`Message from ${isOwn ? 'you' : senderName} sent ${messageTime}`}
    >
      {/* Avatar - only show for other users and when showAvatar is true */}
      {showAvatar && !isOwn && (
        <Avatar 
          className="h-8 w-8 mt-1 flex-shrink-0 ring-2 ring-white/20 shadow-lg"
          role="img"
          aria-label={`${senderName}'s profile picture`}
        >
          <AvatarImage 
            src={message.sender?.avatar_url || undefined} 
            alt={`${senderName}'s avatar`}
          />
          <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
            {getInitials(message.sender?.display_name)}
          </AvatarFallback>
        </Avatar>
      )}
      
      {/* Spacer for non-avatar messages */}
      {!showAvatar && !isOwn && (
        <div className="h-8 w-8 flex-shrink-0" />
      )}
      
      <div className={cn(
        "max-w-[70%] relative",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Sender name for received messages */}
        {!isOwn && showAvatar && (
          <div className="mb-1 ml-1">
            <span className="text-xs font-medium text-white/80 drop-shadow-sm">
              {senderName}
            </span>
          </div>
        )}
        
        {/* Message content */}
        <div className="relative group/message">
          {/* Message reactions overlay */}
          {isHovered && (
            <div className={cn(
              "absolute -top-8 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10",
              isOwn ? "right-0" : "left-0"
            )}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-black/20 backdrop-blur-sm text-white/80 hover:bg-black/30 rounded-full"
                onClick={() => setShowReactions(!showReactions)}
              >
                <Smile className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-black/20 backdrop-blur-sm text-white/80 hover:bg-black/30 rounded-full"
                onClick={handleReply}
              >
                <Reply className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <div 
            className={cn(
              "relative px-4 py-3 text-sm break-words max-w-full min-w-[100px]",
              "backdrop-blur-md border border-white/10 shadow-xl message-glow",
              "transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] animate-floatingBubble",
              isOwn 
                ? "bg-gradient-to-br from-indigo-500/90 to-purple-600/90 text-white rounded-3xl rounded-br-lg ml-auto animate-glowPulse" 
                : "bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-100 rounded-3xl rounded-bl-lg shadow-lg"
            )}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            role="article"
            aria-label={`Message content: ${message.content}`}
          >
            {/* Subtle glow effect for own messages */}
            {isOwn && (
              <div className="absolute inset-0 rounded-3xl rounded-br-lg bg-gradient-to-br from-indigo-400/20 to-purple-500/20 blur-sm -z-10" />
            )}
            
            {/* Message text */}
            <div className="pr-16 leading-[1.4] font-medium">
              {message.content || '[Message content unavailable]'}
            </div>
            
            {/* Time and status in bottom right */}
            <div className={cn(
              "absolute bottom-2 right-3 flex items-center gap-1.5 text-[10px] leading-none font-medium",
              isOwn 
                ? "text-white/70" 
                : "text-gray-500 dark:text-gray-400"
            )}>
              <time dateTime={message.created_at || ''} aria-label={`Sent ${messageTime}`}>
                {messageTime}
              </time>
              {getMessageStatus()}
            </div>
          </div>
          
          {/* Quick reactions */}
          {showReactions && (
            <div className={cn(
              "absolute -bottom-8 flex gap-1 bg-black/80 backdrop-blur-md rounded-full px-2 py-1 shadow-lg z-20",
              isOwn ? "right-0" : "left-0"
            )}>
              {['❤️', '👍', '😂', '😮', '😢', '🔥'].map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-white hover:bg-white/20 rounded-full text-xs"
                  onClick={() => handleReaction(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
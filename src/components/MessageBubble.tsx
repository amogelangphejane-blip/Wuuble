import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Clock, MoreHorizontal, Reply, Heart, ThumbsUp, Smile } from 'lucide-react';
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
      return <CheckCheck className="h-3 w-3 text-blue-500" />; // Blue checkmarks for read
    } else if (isDelivered) {
      return <CheckCheck className="h-3 w-3 text-gray-400" />; // Gray checkmarks for delivered
    } else {
      return <Check className="h-3 w-3 text-gray-400" />; // Single checkmark for sent
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
        "group flex gap-1 mb-1 transition-all duration-200 animate-messageSlideIn",
        isOwn ? "flex-row-reverse" : "flex-row",
        isLast ? "mb-3" : ""
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="listitem"
      aria-label={`Message from ${isOwn ? 'you' : senderName} sent ${messageTime}`}
    >
      {/* Avatar - only show for other users and when showAvatar is true */}
      {showAvatar && !isOwn && (
        <Avatar 
          className="h-6 w-6 mt-1 flex-shrink-0"
          role="img"
          aria-label={`${senderName}'s profile picture`}
        >
          <AvatarImage 
            src={message.sender?.avatar_url || undefined} 
            alt={`${senderName}'s avatar`}
          />
          <AvatarFallback className="text-[10px] bg-gradient-to-br from-gray-400 to-gray-500 text-white">
            {getInitials(message.sender?.display_name)}
          </AvatarFallback>
        </Avatar>
      )}
      
      {/* Spacer for non-avatar messages */}
      {!showAvatar && !isOwn && (
        <div className="h-6 w-6 flex-shrink-0" />
      )}
      
      <div className={cn(
        "max-w-[75%] relative",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Message content */}
        <div className="relative group/message">
          <div 
            className={cn(
              "relative px-3 py-2 text-[14px] break-words shadow-sm max-w-full min-w-[80px]",
              "transition-shadow duration-200 hover:shadow-md",
              isOwn 
                ? "bg-[#dcf8c6] dark:bg-[#005c4b] text-gray-800 dark:text-white rounded-lg rounded-br-sm ml-auto"
                : "bg-white dark:bg-[#202c33] text-gray-800 dark:text-gray-100 rounded-lg rounded-bl-sm shadow-sm"
            )}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            role="article"
            aria-label={`Message content: ${message.content}`}
          >
            {/* Message tail */}
            {showAvatar && (
              <div 
                className={cn(
                  "absolute top-0 w-0 h-0",
                  isOwn 
                    ? "right-[-6px] border-l-[6px] border-l-[#dcf8c6] dark:border-l-[#005c4b] border-t-[6px] border-t-transparent"
                    : "left-[-6px] border-r-[6px] border-r-white dark:border-r-[#202c33] border-t-[6px] border-t-transparent"
                )}
              />
            )}
            
            {/* Message text */}
            <div className="pr-16 leading-[1.3]">
              {message.content || '[Message content unavailable]'}
            </div>
            
            {/* Time and status in bottom right */}
            <div className={cn(
              "absolute bottom-1 right-2 flex items-center gap-1 text-[11px] leading-none",
              isOwn 
                ? "text-gray-600 dark:text-gray-300" 
                : "text-gray-500 dark:text-gray-400"
            )}>
              <time dateTime={message.created_at || ''} aria-label={`Sent ${messageTime}`}>
                {messageTime}
              </time>
              {getMessageStatus()}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
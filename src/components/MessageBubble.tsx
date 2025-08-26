import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
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
    
    // For now, we'll show delivered status. In a real app, this would come from the message data
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <CheckCheck className="h-3 w-3" />
        <span className="sr-only">Message delivered</span>
      </div>
    );
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

  const messageTime = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });
  const senderName = message.sender.display_name || 'Unknown User';

  return (
    <div 
      className={cn(
        "group flex gap-3 mb-2 transition-all duration-200",
        isOwn ? "flex-row-reverse" : "flex-row",
        isLast ? "mb-4" : ""
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="listitem"
      aria-label={`Message from ${isOwn ? 'you' : senderName} sent ${messageTime}`}
    >
      {/* Avatar - only show for other users and when showAvatar is true */}
      {showAvatar && !isOwn && (
        <Avatar 
          className="h-8 w-8 mt-1 ring-2 ring-background shadow-sm"
          role="img"
          aria-label={`${senderName}'s profile picture`}
        >
          <AvatarImage 
            src={message.sender.avatar_url || undefined} 
            alt={`${senderName}'s avatar`}
          />
          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {getInitials(message.sender.display_name)}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "max-w-[70%] space-y-1 relative",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Sender name - only show for other users when avatar is shown */}
        {showAvatar && !isOwn && (
          <p className="text-xs text-muted-foreground font-medium px-1">
            {senderName}
          </p>
        )}
        
        {/* Message content with improved styling */}
        <div className="relative">
          <div 
            className={cn(
              "rounded-2xl px-4 py-3 text-sm break-words shadow-sm transition-all duration-200",
              "relative overflow-hidden backdrop-blur-sm",
              isOwn 
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto shadow-blue-500/25" 
                : "bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50",
              "hover:shadow-md hover:scale-[1.02] transform focus-within:ring-2 focus-within:ring-primary/20"
            )}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            role="article"
            aria-label={`Message content: ${message.content}`}
          >
            {/* Message text */}
            <div className="relative z-10">
              {message.content}
            </div>
            
            {/* Subtle gradient overlay for own messages */}
            {isOwn && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </div>
          
          {/* Quick actions - appear on hover */}
          <div 
            className={cn(
              "absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200",
              isOwn ? "-left-20" : "-right-20",
              "transform translate-y-1"
            )}
            role="toolbar"
            aria-label="Message actions"
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 dark:bg-gray-800/90 shadow-sm hover:shadow-md backdrop-blur-sm"
              onClick={() => setShowReactions(!showReactions)}
              aria-label="Add reaction"
              aria-expanded={showReactions}
            >
              <Smile className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 dark:bg-gray-800/90 shadow-sm hover:shadow-md backdrop-blur-sm"
              onClick={handleReply}
              aria-label={`Reply to message from ${isOwn ? 'you' : senderName}`}
            >
              <Reply className="h-3 w-3" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/90 dark:bg-gray-800/90 shadow-sm hover:shadow-md backdrop-blur-sm"
                  aria-label="More message options"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? "end" : "start"}>
                <DropdownMenuItem onClick={handleReply}>
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </DropdownMenuItem>
                {isOwn && (
                  <>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem>Copy</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Quick reaction picker */}
          {showReactions && (
            <div 
              className={cn(
                "absolute top-0 flex items-center gap-1 bg-white dark:bg-gray-800 rounded-full shadow-lg border p-1 z-20",
                isOwn ? "-left-32" : "-right-32",
                "transform -translate-y-2 animate-in fade-in-0 zoom-in-95 duration-200"
              )}
              role="toolbar"
              aria-label="Quick reactions"
            >
              {['❤️', '👍', '😊', '😂', '😮', '😢'].map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 text-lg"
                  onClick={() => handleReaction(emoji)}
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        {/* Timestamp and status */}
        <div className={cn(
          "flex items-center gap-2 px-1",
          isOwn ? "flex-row-reverse text-right" : "flex-row text-left"
        )}>
          <p className="text-xs text-muted-foreground">
            <time dateTime={message.created_at} aria-label={`Sent ${messageTime}`}>
              {messageTime}
            </time>
          </p>
          {getMessageStatus()}
        </div>
      </div>
      
      {/* Avatar placeholder for own messages to maintain spacing */}
      {showAvatar && isOwn && (
        <div className="h-8 w-8 mt-1" aria-hidden="true" />
      )}
    </div>
  );
};
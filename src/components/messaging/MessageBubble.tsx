import React, { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  CheckCheck, 
  Clock, 
  MoreHorizontal, 
  Reply, 
  Edit, 
  Trash2,
  Copy,
  SmilePlus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import type { MessageWithSender, User } from '@/types/messaging';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isLast?: boolean;
  currentUser: User;
  onReply?: (message: MessageWithSender) => void;
  onEdit?: (message: MessageWithSender) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  className?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = false,
  isLast = false,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

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
    
    // In a real implementation, this would come from the message status
    const messageAge = Date.now() - new Date(message.created_at).getTime();
    const isRead = messageAge > 30000; // Simulate read after 30s
    const isDelivered = messageAge > 5000; // Simulate delivered after 5s
    
    if (isRead) {
      return <CheckCheck className="h-3 w-3 text-blue-500" title="Read" />;
    } else if (isDelivered) {
      return <CheckCheck className="h-3 w-3 text-gray-400" title="Delivered" />;
    } else {
      return <Check className="h-3 w-3 text-gray-400" title="Sent" />;
    }
  };

  const formatMessageTime = useMemo(() => {
    const messageDate = new Date(message.created_at);
    
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, 'HH:mm')}`;
    } else {
      return format(messageDate, 'MMM dd, HH:mm');
    }
  }, [message.created_at]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setShowActions(false);
  };

  const handleReactionSelect = (emoji: string) => {
    onReaction?.(message.id, emoji);
    setShowActions(false);
  };

  if (message.is_deleted) {
    return (
      <div className={cn(
        "flex gap-2 md:gap-3 mb-1 transition-all duration-200",
        isOwn ? "flex-row-reverse" : "flex-row",
        className
      )}>
        {showAvatar && !isOwn && (
          <div className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0" />
        )}
        
        <div className={cn(
          "max-w-[85%] sm:max-w-[75%] md:max-w-[70%]",
          isOwn ? "items-end" : "items-start"
        )}>
          <div className="italic text-gray-500 text-sm p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            This message was deleted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group flex gap-2 md:gap-3 mb-1 transition-all duration-200",
        isOwn ? "flex-row-reverse" : "flex-row",
        isLast ? "mb-4" : "",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <Avatar className="h-8 w-8 md:h-9 md:w-9 mt-1 flex-shrink-0">
          <AvatarImage 
            src={message.sender.avatar_url || undefined} 
            alt={message.sender.display_name || 'User'} 
          />
          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {getInitials(message.sender.display_name)}
          </AvatarFallback>
        </Avatar>
      )}
      
      {/* Spacer for grouped messages */}
      {!showAvatar && !isOwn && (
        <div className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0" />
      )}
      
      <div className={cn(
        "max-w-[85%] sm:max-w-[75%] md:max-w-[70%] relative",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Reply reference */}
        {message.reply_to_message && (
          <div className={cn(
            "text-xs text-gray-500 mb-1 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-l-2",
            isOwn ? "border-l-blue-500" : "border-l-green-500"
          )}>
            <div className="font-medium">
              {message.reply_to_message.sender.display_name || 'User'}
            </div>
            <div className="truncate">
              {message.reply_to_message.content}
            </div>
          </div>
        )}

        {/* Message content */}
        <div className="relative group/message">
          <div 
            className={cn(
              "relative px-3 py-2 md:px-4 md:py-2.5 text-sm md:text-base break-words shadow-sm rounded-2xl transition-all duration-200",
              "hover:shadow-md min-w-[60px] max-w-full",
              isOwn 
                ? "bg-blue-500 text-white rounded-br-md ml-auto" 
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-700"
            )}
          >
            {/* Message tail */}
            {showAvatar && (
              <div 
                className={cn(
                  "absolute top-0 w-0 h-0",
                  isOwn 
                    ? "right-[-6px] border-l-[6px] border-l-blue-500 border-t-[6px] border-t-transparent"
                    : "left-[-6px] border-r-[6px] border-r-white dark:border-r-gray-800 border-t-[6px] border-t-transparent"
                )}
              />
            )}
            
            {/* Message text */}
            <div className={cn(
              "leading-relaxed whitespace-pre-wrap",
              isOwn ? "pr-16" : "pr-14"
            )}>
              {message.content}
            </div>
            
            {/* Message edited indicator */}
            {message.is_edited && (
              <div className="text-xs opacity-70 mt-1">
                (edited)
              </div>
            )}
            
            {/* Time and status */}
            <div className={cn(
              "absolute bottom-1 right-2 flex items-center gap-1 text-xs leading-none",
              isOwn 
                ? "text-blue-100" 
                : "text-gray-500 dark:text-gray-400"
            )}>
              <time dateTime={message.created_at}>
                {formatMessageTime}
              </time>
              {getMessageStatus()}
            </div>
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={cn(
              "flex flex-wrap gap-1 mt-1 mb-1",
              isOwn ? "justify-end" : "justify-start"
            )}>
              {message.reactions.reduce((acc, reaction) => {
                const existing = acc.find(r => r.emoji === reaction.emoji);
                if (existing) {
                  existing.count++;
                } else {
                  acc.push({ emoji: reaction.emoji, count: 1 });
                }
                return acc;
              }, [] as { emoji: string; count: number }[]).map(({ emoji, count }) => (
                <Badge 
                  key={emoji}
                  variant="secondary" 
                  className="text-xs px-2 py-0.5 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={() => handleReactionSelect(emoji)}
                >
                  {emoji} {count > 1 && count}
                </Badge>
              ))}
            </div>
          )}

          {/* Message actions */}
          {isHovered && (
            <div className={cn(
              "absolute top-0 flex items-center gap-1 transition-all duration-200",
              isOwn 
                ? "right-full mr-2" 
                : "left-full ml-2"
            )}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex">
                {/* Quick reactions */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleReactionSelect('👍')}
                >
                  👍
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleReactionSelect('❤️')}
                >
                  ❤️
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleReactionSelect('😂')}
                >
                  😂
                </Button>
                
                {/* Reply button */}
                {onReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => onReply(message)}
                    title="Reply"
                  >
                    <Reply className="h-3 w-3" />
                  </Button>
                )}

                {/* More actions */}
                <DropdownMenu open={showActions} onOpenChange={setShowActions}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isOwn ? "end" : "start"} className="w-48">
                    <DropdownMenuItem onClick={() => handleReactionSelect('👍')}>
                      <SmilePlus className="mr-2 h-4 w-4" />
                      Add Reaction
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyMessage}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Message
                    </DropdownMenuItem>
                    {onReply && (
                      <DropdownMenuItem onClick={() => onReply(message)}>
                        <Reply className="mr-2 h-4 w-4" />
                        Reply
                      </DropdownMenuItem>
                    )}
                    
                    {/* Own message actions */}
                    {isOwn && (
                      <>
                        <DropdownMenuSeparator />
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(message)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem 
                            onClick={() => onDelete(message.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>

        {/* Timestamp */}
        {showTimestamp && (
          <div className={cn(
            "text-xs text-gray-500 mt-1 px-1",
            isOwn ? "text-right" : "text-left"
          )}>
            {format(new Date(message.created_at), 'PPp')}
          </div>
        )}
      </div>
    </div>
  );
};

export { MessageBubble };
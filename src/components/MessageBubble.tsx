import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { MessageWithSender } from '@/services/messageService';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showAvatar?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
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
    <div className={cn(
      "flex gap-3 mb-4",
      isOwn ? "flex-row-reverse" : "flex-row"
    )}>
      {showAvatar && !isOwn && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={message.sender.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(message.sender.display_name)}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "max-w-[70%] space-y-1",
        isOwn ? "items-end" : "items-start"
      )}>
        {showAvatar && !isOwn && (
          <p className="text-xs text-muted-foreground font-medium">
            {message.sender.display_name || 'Unknown User'}
          </p>
        )}
        
        <div className={cn(
          "rounded-lg px-3 py-2 text-sm break-words",
          isOwn 
            ? "bg-primary text-primary-foreground ml-auto" 
            : "bg-muted"
        )}>
          {message.content}
        </div>
        
        <p className={cn(
          "text-xs text-muted-foreground",
          isOwn ? "text-right" : "text-left"
        )}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
      
      {showAvatar && isOwn && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={message.sender.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(message.sender.display_name)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
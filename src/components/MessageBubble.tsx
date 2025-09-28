import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Check, 
  CheckCheck, 
  Clock, 
  MoreHorizontal, 
  Reply, 
  Heart, 
  ThumbsUp, 
  Smile, 
  Forward,
  Copy,
  Edit,
  Trash2,
  Pin,
  Star,
  Laugh,
  Angry,
  Frown,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import type { MessageWithSender } from '@/services/messageService';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showAvatar?: boolean;
  isLast?: boolean;
  onReply?: (message: MessageWithSender) => void;
  onEdit?: (message: MessageWithSender) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  isLast = false,
  onReply,
  onEdit,
  onDelete,
  onReact,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');

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

  // Enhanced reaction emojis with categories
  const reactionEmojis = [
    { emoji: '😀', label: 'Happy' },
    { emoji: '😂', label: 'Laugh' },
    { emoji: '❤️', label: 'Love' },
    { emoji: '👍', label: 'Thumbs Up' },
    { emoji: '👎', label: 'Thumbs Down' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😮', label: 'Surprised' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '🙄', label: 'Eye Roll' },
    { emoji: '🤔', label: 'Thinking' },
    { emoji: '🔥', label: 'Fire' },
    { emoji: '💯', label: '100' },
    { emoji: '🎉', label: 'Party' },
    { emoji: '👏', label: 'Clap' },
    { emoji: '🤷', label: 'Shrug' },
    { emoji: '😍', label: 'Heart Eyes' }
  ];

  // Mock reactions data - in real app this would come from the message
  const messageReactions = [
    { emoji: '👍', count: 2, users: ['Alice', 'Bob'] },
    { emoji: '❤️', count: 1, users: ['Charlie'] }
  ];

  const handleReaction = (emoji: string) => {
    onReact?.(message.id, emoji);
    setShowReactionPicker(false);
  };

  const handleReply = () => {
    onReply?.(message);
  };

  const handleEdit = () => {
    if (isOwn) {
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit({ ...message, content: editContent });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(message.content || '');
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (isOwn && onDelete) {
      onDelete(message.id);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content || '');
  };

  const handleForward = () => {
    // TODO: Implement forward functionality
    console.log('Forward message:', message.id);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Could implement message selection or context menu
    }
  };

  const messageTime = message.created_at ? format(new Date(message.created_at), 'HH:mm') : '--:--';
  const senderName = message.sender?.display_name || 'Unknown User';

  if (isEditing) {
    return (
      <div className={cn(
        "group flex gap-1 mb-1 transition-all duration-200",
        isOwn ? "flex-row-reverse" : "flex-row",
        isLast ? "mb-3" : ""
      )}>
        {showAvatar && !isOwn && <div className="h-6 w-6 flex-shrink-0" />}
        
        <div className={cn(
          "max-w-[75%] relative",
          isOwn ? "items-end" : "items-start"
        )}>
          <div className={cn(
            "relative p-3 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20",
            isOwn ? "rounded-br-sm ml-auto" : "rounded-bl-sm"
          )}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full resize-none bg-transparent outline-none text-gray-900 dark:text-gray-100"
              autoFocus
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelEdit();
                }
              }}
            />
            <div className="flex items-center gap-2 mt-2">
              <Button size="sm" onClick={handleSaveEdit}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group flex gap-1 mb-1 transition-all duration-200 animate-messageSlideIn hover:bg-gray-50/50 dark:hover:bg-gray-800/20 rounded-lg px-2 py-1 -mx-2 -my-1",
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
              "transition-all duration-200 hover:shadow-md",
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
              {/* Edited indicator */}
              {message.updated_at && message.updated_at !== message.created_at && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(edited)</span>
              )}
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

            {/* Quick action buttons (visible on hover) */}
            {isHovered && (
              <div className={cn(
                "absolute top-0 flex items-center gap-1 transition-all duration-200",
                isOwn ? "right-full mr-2" : "left-full ml-2"
              )}>
                {/* React button */}
                <Popover open={showReactionPicker} onOpenChange={setShowReactionPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 bg-white dark:bg-gray-700 shadow-md border hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <Smile className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" side="top">
                    <div className="grid grid-cols-8 gap-1">
                      {reactionEmojis.map(({ emoji, label }) => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110 transition-transform"
                          onClick={() => handleReaction(emoji)}
                          title={label}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Reply button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReply}
                  className="h-6 w-6 p-0 bg-white dark:bg-gray-700 shadow-md border hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <Reply className="h-3 w-3" />
                </Button>

                {/* More actions dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 bg-white dark:bg-gray-700 shadow-md border hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isOwn ? "end" : "start"}>
                    <DropdownMenuItem onClick={handleReply}>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleForward}>
                      <Forward className="h-4 w-4 mr-2" />
                      Forward
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyMessage}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Star className="h-4 w-4 mr-2" />
                      Star
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Pin className="h-4 w-4 mr-2" />
                      Pin
                    </DropdownMenuItem>
                    {isOwn && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleEdit}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600 dark:text-red-400">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Message reactions */}
          {messageReactions.length > 0 && (
            <div className={cn(
              "flex items-center gap-1 mt-1",
              isOwn ? "justify-end" : "justify-start"
            )}>
              {messageReactions.map(({ emoji, count, users }) => (
                <Badge
                  key={emoji}
                  variant="secondary"
                  className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                  title={`${users.join(', ')} reacted with ${emoji}`}
                >
                  <span className="mr-1">{emoji}</span>
                  <span>{count}</span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
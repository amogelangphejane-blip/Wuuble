import React, { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  MessageCircle, 
  Plus, 
  X,
  Filter,
  Check,
  MoreVertical,
  Pin,
  Archive,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ConversationWithDetails, ConversationFilter, User } from '@/types/messaging';

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  selectedConversationId: string | null;
  onSelectConversation: (conversation: ConversationWithDetails) => void;
  onCreateConversation?: () => void;
  isLoading?: boolean;
  currentUser: User;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  className?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onCreateConversation,
  isLoading = false,
  currentUser,
  searchQuery = '',
  onSearchChange,
  className
}) => {
  const [filter, setFilter] = useState<ConversationFilter>('all');

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const truncateMessage = (content: string, maxLength = 50) => {
    return content.length > maxLength ? content.slice(0, maxLength) + '...' : content;
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        return format(date, 'EEE'); // Mon, Tue, etc.
      } else {
        return format(date, 'MMM dd');
      }
    }
  };

  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(conversation => {
        const searchText = [
          conversation.name || '',
          conversation.other_participant?.display_name || '',
          conversation.last_message?.content || ''
        ].join(' ').toLowerCase();
        
        return searchText.includes(searchQuery.toLowerCase());
      });
    }

    // Apply type filter
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(conv => conv.unread_count > 0);
        break;
      case 'archived':
        // Implementation for archived conversations
        break;
      case 'muted':
        // Implementation for muted conversations
        break;
      default:
        break;
    }

    // Sort by last message time
    return filtered.sort((a, b) => {
      const aTime = a.last_message_at || a.created_at;
      const bTime = b.last_message_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [conversations, searchQuery, filter]);

  const clearSearch = () => {
    onSearchChange?.('');
  };

  if (isLoading && conversations.length === 0) {
    return (
      <div className={cn("w-full h-full border-r bg-white dark:bg-gray-900 flex flex-col", className)}>
        <div className="p-3 md:p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="p-2 md:p-4 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full border-r bg-white dark:bg-gray-900 flex flex-col", className)}>
      {/* Header */}
      <div className="p-3 md:p-4 border-b bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
            <span className="hidden sm:inline">Messages</span>
          </h2>
          <div className="flex items-center gap-1 md:gap-2">
            {/* Filter menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost"
                  className={cn(
                    "h-8 w-8 rounded-full",
                    filter !== 'all' && "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                  )}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setFilter('all')}
                  className="flex items-center gap-2"
                >
                  {filter === 'all' && <Check className="h-4 w-4 text-blue-500" />}
                  <span className={filter !== 'all' ? 'ml-6' : ''}>All Conversations</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilter('unread')}
                  className="flex items-center gap-2"
                >
                  {filter === 'unread' && <Check className="h-4 w-4 text-blue-500" />}
                  <span className={filter !== 'unread' ? 'ml-6' : ''}>Unread</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilter('archived')}
                  className="flex items-center gap-2"
                >
                  {filter === 'archived' && <Check className="h-4 w-4 text-blue-500" />}
                  <span className={filter !== 'archived' ? 'ml-6' : ''}>Archived</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilter('muted')}
                  className="flex items-center gap-2"
                >
                  {filter === 'muted' && <Check className="h-4 w-4 text-blue-500" />}
                  <span className={filter !== 'muted' ? 'ml-6' : ''}>Muted</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* New chat button */}
            {onCreateConversation && (
              <Button 
                size="icon" 
                variant="outline"
                className="h-8 w-8 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50"
                onClick={onCreateConversation}
              >
                <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </Button>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className={cn(
              "pl-10 pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg",
              "focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:ring-blue-800",
              "text-sm placeholder:text-gray-500"
            )}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              onClick={clearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-1 md:p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              {searchQuery ? (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No conversations found</p>
                  <p className="text-xs text-gray-500 mt-1">Try adjusting your search terms</p>
                </>
              ) : conversations.length === 0 ? (
                <>
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No conversations yet</p>
                  <p className="text-xs text-gray-500 mt-1">Start a new conversation to get chatting</p>
                  {onCreateConversation && (
                    <Button 
                      onClick={onCreateConversation}
                      className="mt-4"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Conversation
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Filter className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No conversations match this filter</p>
                  <p className="text-xs text-gray-500 mt-1">Try changing your filter settings</p>
                </>
              )}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedConversationId === conversation.id}
                onClick={() => onSelectConversation(conversation)}
                getInitials={getInitials}
                truncateMessage={truncateMessage}
                formatLastMessageTime={formatLastMessageTime}
                currentUser={currentUser}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// ============================================================================
// CONVERSATION ITEM COMPONENT
// ============================================================================

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  isSelected: boolean;
  onClick: () => void;
  getInitials: (name: string | null) => string;
  truncateMessage: (content: string, maxLength?: number) => string;
  formatLastMessageTime: (dateString: string) => string;
  currentUser: User;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onClick,
  getInitials,
  truncateMessage,
  formatLastMessageTime,
  currentUser
}) => {
  const [showActions, setShowActions] = useState(false);

  // Get display info for the conversation
  const displayName = conversation.is_group 
    ? conversation.name || 'Group Chat'
    : conversation.other_participant?.display_name || 'Unknown User';

  const displayAvatar = conversation.is_group 
    ? conversation.avatar_url 
    : conversation.other_participant?.avatar_url;

  // Mock online status - in a real app this would come from presence data
  const isOnline = Math.random() > 0.7;

  const handleAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    setShowActions(false);
    
    switch (action) {
      case 'pin':
        // Implementation for pinning conversation
        break;
      case 'archive':
        // Implementation for archiving conversation
        break;
      case 'mute':
        // Implementation for muting conversation
        break;
      case 'delete':
        // Implementation for deleting conversation
        break;
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 rounded-lg mx-1",
        "hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-800",
        isSelected && "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800",
        "touch-manipulation"
      )}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={displayAvatar || undefined} />
          <AvatarFallback className={cn(
            "text-sm font-medium",
            conversation.is_group 
              ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
              : "bg-gradient-to-br from-blue-500 to-teal-500 text-white"
          )}>
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        
        {/* Online indicator for 1-on-1 conversations */}
        {!conversation.is_group && isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
        )}
        
        {/* Unread indicator */}
        {conversation.unread_count > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-medium">
              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "text-sm font-medium text-gray-900 dark:text-gray-100 truncate",
              conversation.unread_count > 0 && "font-semibold"
            )}>
              {displayName}
            </h3>
            
            {/* Last message */}
            {conversation.last_message && (
              <div className="flex items-center gap-1 mt-0.5">
                {conversation.last_message.sender_id === currentUser.id && (
                  <span className="text-gray-500 dark:text-gray-400 text-xs">You:</span>
                )}
                <p className={cn(
                  "text-xs truncate",
                  conversation.unread_count > 0 
                    ? "text-gray-900 dark:text-gray-100 font-medium" 
                    : "text-gray-500 dark:text-gray-400"
                )}>
                  {conversation.last_message.is_deleted 
                    ? '[This message was deleted]'
                    : truncateMessage(conversation.last_message.content, 35)
                  }
                </p>
              </div>
            )}
            
            {/* Typing indicator */}
            {/* In a real implementation, you'd show typing indicators here */}
          </div>
          
          {/* Time and actions */}
          <div className="flex flex-col items-end gap-1 ml-2">
            <div className="flex items-center gap-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {conversation.last_message_at 
                  ? formatLastMessageTime(conversation.last_message_at)
                  : formatLastMessageTime(conversation.created_at)
                }
              </p>
              
              {/* Actions menu */}
              <DropdownMenu open={showActions} onOpenChange={setShowActions}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                      showActions && "opacity-100"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={(e) => handleAction(e, 'pin')}>
                    <Pin className="mr-2 h-4 w-4" />
                    Pin Conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleAction(e, 'archive')}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleAction(e, 'mute')}>
                    <span className="mr-2 text-sm">🔕</span>
                    Mute Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => handleAction(e, 'delete')}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ConversationList };
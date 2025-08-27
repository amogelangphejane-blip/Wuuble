import React, { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  MessageCircle, 
  Plus, 
  User, 
  X,
  Filter,
  Check,
  Clock,
  Pin
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useConversations, useUserSearch, useCreateConversation } from '@/hooks/useMessages';
import type { ConversationWithParticipant } from '@/services/messageService';

interface ConversationListProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

type FilterType = 'all' | 'unread' | 'pinned';

export const ConversationList: React.FC<ConversationListProps> = ({
  selectedConversationId,
  onSelectConversation,
}) => {
  const { conversations, isLoading } = useConversations();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  
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

  // Filter and search conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(conversation =>
        conversation.participant.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(conversation => conversation.unread_count > 0);
        break;
      case 'pinned':
        // TODO: Add pinned functionality when implemented
        break;
      default:
        break;
    }

    return filtered;
  }, [conversations, searchQuery, filter]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <div className="w-80 border-r bg-muted/20 backdrop-blur-sm">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="mt-4">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border-r bg-white dark:bg-[#111b21] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-[#f0f2f5] dark:bg-[#202c33]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Messages
          </h2>
          <div className="flex items-center gap-2">
            {/* Filter menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost"
                  className={cn(
                    "h-8 w-8",
                    filter !== 'all' && "bg-primary/10 text-primary"
                  )}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setFilter('all')}
                  className="flex items-center gap-2"
                >
                  {filter === 'all' && <Check className="h-4 w-4" />}
                  <span className={filter !== 'all' ? 'ml-6' : ''}>All Conversations</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilter('unread')}
                  className="flex items-center gap-2"
                >
                  {filter === 'unread' && <Check className="h-4 w-4" />}
                  <span className={filter !== 'unread' ? 'ml-6' : ''}>Unread</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilter('pinned')}
                  className="flex items-center gap-2"
                >
                  {filter === 'pinned' && <Check className="h-4 w-4" />}
                  <span className={filter !== 'pinned' ? 'ml-6' : ''}>Pinned</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* New chat button */}
            <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="icon" 
                  variant="outline"
                  className="h-8 w-8 border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                </DialogHeader>
                <NewChatDialog onClose={() => setIsNewChatOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-white dark:bg-[#2a3942] border-gray-300 dark:border-gray-600 rounded-lg focus:border-[#25d366] focus:ring-1 focus:ring-[#25d366] text-gray-900 dark:text-gray-100"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={clearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm font-medium">No conversations found</p>
                  <p className="text-xs mt-1">Try adjusting your search terms</p>
                </>
              ) : conversations.length === 0 ? (
                <>
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm font-medium">No conversations yet</p>
                  <p className="text-xs mt-1">Start a new chat to get started</p>
                </>
              ) : (
                <>
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm font-medium">No conversations match this filter</p>
                  <p className="text-xs mt-1">Try changing your filter settings</p>
                </>
              )}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedConversationId === conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                getInitials={getInitials}
                truncateMessage={truncateMessage}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

interface ConversationItemProps {
  conversation: ConversationWithParticipant;
  isSelected: boolean;
  onClick: () => void;
  getInitials: (name: string | null) => string;
  truncateMessage: (content: string, maxLength?: number) => string;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onClick,
  getInitials,
  truncateMessage,
}) => {
  // Mock online status - in real app this would come from presence data
  const isOnline = Math.random() > 0.5;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 cursor-pointer transition-colors duration-150",
        "hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942]",
        isSelected && "bg-[#e9edef] dark:bg-[#2a3942]",
        "border-b border-gray-200/50 dark:border-gray-700/50 last:border-b-0"
      )}
      onClick={onClick}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={conversation.participant.avatar_url || undefined} />
          <AvatarFallback className="bg-[#ddd] dark:bg-gray-600 text-gray-700 dark:text-gray-300">
            {getInitials(conversation.participant.display_name)}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "text-[17px] text-gray-900 dark:text-gray-100 truncate mb-0.5",
              conversation.unread_count > 0 && "font-semibold"
            )}>
              {conversation.participant.display_name || 'Unknown User'}
            </h3>
            
            {conversation.last_message && (
              <p className={cn(
                "text-[14px] truncate",
                conversation.unread_count > 0 
                  ? "text-gray-900 dark:text-gray-100 font-medium" 
                  : "text-gray-500 dark:text-gray-400"
              )}>
                {truncateMessage(conversation.last_message.content, 40)}
              </p>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-1 ml-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {format(new Date(conversation.last_message_at), 'HH:mm')}
            </p>
            
            {conversation.unread_count > 0 && (
              <div className="bg-[#25d366] text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface NewChatDialogProps {
  onClose: () => void;
}

const NewChatDialog: React.FC<NewChatDialogProps> = ({ onClose }) => {
  const { searchQuery, setSearchQuery, searchResults, isSearching } = useUserSearch();
  const { createConversation, isLoading: isCreating } = useCreateConversation();

  const handleStartChat = async (userId: string) => {
    try {
      await createConversation(userId);
      onClose();
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
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

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="max-h-60">
        <div className="space-y-2">
          {isSearching ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : searchResults.length === 0 && searchQuery ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            searchResults.map((user) => (
              <div
                key={user.id}
                className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                onClick={() => handleStartChat(user.id)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getInitials(user.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {user.display_name || 'Unknown User'}
                    </p>
                  </div>
                  {isCreating && (
                    <div className="flex items-center">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
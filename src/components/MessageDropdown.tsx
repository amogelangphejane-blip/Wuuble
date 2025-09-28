import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Search, 
  Send,
  Users,
  Plus,
  MoreHorizontal,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConversations, useUserSearch, useCreateConversation } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface MessageDropdownProps {
  className?: string;
}

export const MessageDropdown: React.FC<MessageDropdownProps> = ({ className }) => {
  const navigate = useNavigate();
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const { conversations, isLoading } = useConversations();
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    isSearching,
    clearResults 
  } = useUserSearch();
  const { createConversation } = useCreateConversation();

  // Calculate total unread messages
  const unreadCount = conversations.reduce((total, conv) => total + conv.unread_count, 0);

  const handleStartConversation = async (userId: string) => {
    try {
      if (!userId) {
        console.warn('No userId provided for conversation');
        return;
      }
      await createConversation(userId);
      setIsNewMessageOpen(false);
      clearResults();
      setSearchQuery('');
      navigate('/messages');
    } catch (error) {
      console.error('Failed to start conversation:', error);
      // Don't navigate on error
    }
  };

  const handleConversationClick = (conversationId: string) => {
    navigate(`/messages?conversation=${conversationId}`);
  };

  const formatLastMessageTime = (timestamp: string) => {
    try {
      if (!timestamp) return 'Recently';
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Recently';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.warn('Error formatting timestamp:', error);
      return 'Recently';
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

  const truncateMessage = (content: string, maxLength: number = 40) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "relative h-9 w-9 hover:bg-accent/50 transition-colors",
            className
          )}
        >
          <MessageCircle className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs font-medium min-w-[20px] rounded-full"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 sm:w-96 p-0 max-h-[80vh] sm:max-h-96"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Messages</h3>
            <div className="flex items-center gap-2">
              <Popover open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 sm:w-96 p-3" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium text-sm">New Message</h4>
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>

                    {searchResults.length > 0 && (
                      <ScrollArea className="max-h-40">
                        <div className="space-y-1">
                          {searchResults.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleStartConversation(user.id)}
                              className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(user.display_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {user.display_name || 'Unknown User'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    )}

                    {searchQuery && searchResults.length === 0 && !isSearching && (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        No users found matching "{searchQuery}"
                      </div>
                    )}

                    {isSearching && (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        Searching...
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 w-8 p-0"
                onClick={() => navigate('/messages')}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Conversations List */}
        <ScrollArea className="max-h-60 sm:max-h-80">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-10 w-10 bg-muted rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded mb-1" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">No conversations yet</p>
              <p className="text-xs text-muted-foreground">
                Start a conversation by clicking the + button above
              </p>
            </div>
          ) : (
            <div className="p-2">
              {conversations.slice(0, 5).map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.participant.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(conversation.participant.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.unread_count > 0 && (
                      <Badge 
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs font-bold rounded-full"
                      >
                        {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={cn(
                        "font-medium text-sm truncate",
                        conversation.unread_count > 0 && "font-semibold"
                      )}>
                        {conversation.participant.display_name || 'Unknown User'}
                      </p>
                      {conversation.last_message && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatLastMessageTime(conversation.last_message.created_at)}</span>
                        </div>
                      )}
                    </div>
                    
                    {conversation.last_message ? (
                      <p className={cn(
                        "text-sm text-muted-foreground truncate",
                        conversation.unread_count > 0 && "font-medium text-foreground"
                      )}>
                        {truncateMessage(conversation.last_message.content)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No messages yet
                      </p>
                    )}
                  </div>
                </button>
              ))}
              
              {conversations.length > 5 && (
                <>
                  <Separator className="my-2" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/messages')}
                    className="w-full justify-center text-sm text-muted-foreground hover:text-foreground"
                  >
                    View all conversations ({conversations.length - 5} more)
                  </Button>
                </>
              )}
            </div>
          )}
        </ScrollArea>

        {conversations.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/messages')}
                className="w-full justify-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Open Messages
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
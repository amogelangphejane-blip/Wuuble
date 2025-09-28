import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  X, 
  Calendar,
  Filter,
  MessageCircle,
  User,
  Clock,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MessageSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string | null;
  onJumpToMessage: (messageId: string) => void;
}

interface SearchResult {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  created_at: string;
  conversation_id: string;
  match_snippet: string;
}

export const MessageSearchDialog: React.FC<MessageSearchDialogProps> = ({
  isOpen,
  onClose,
  conversationId,
  onJumpToMessage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilter, setSearchFilter] = useState<'all' | 'media' | 'links' | 'docs'>('all');
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Mock search results - in real app this would come from API
  const mockSearchResults: SearchResult[] = [
    {
      id: '1',
      content: 'Hey everyone! Just wanted to share this amazing project I\'ve been working on. It involves building a modern messaging system with React and TypeScript.',
      sender_id: 'user1',
      sender_name: 'Alice Johnson',
      sender_avatar: null,
      created_at: '2024-01-15T10:30:00Z',
      conversation_id: conversationId || '',
      match_snippet: '...amazing project I\'ve been working on...'
    },
    {
      id: '2',
      content: 'The project includes features like real-time messaging, file sharing, and group chats. I think you all would love to see it!',
      sender_id: 'user2',
      sender_name: 'Bob Smith',
      sender_avatar: null,
      created_at: '2024-01-15T14:20:00Z',
      conversation_id: conversationId || '',
      match_snippet: '...project includes features like real-time messaging...'
    },
    {
      id: '3',
      content: 'Working on the authentication system today. Having some challenges with JWT tokens but making progress.',
      sender_id: 'user1',
      sender_name: 'Alice Johnson',
      sender_avatar: null,
      created_at: '2024-01-16T09:15:00Z',
      conversation_id: conversationId || '',
      match_snippet: '...Working on the authentication system...'
    },
  ];

  useEffect(() => {
    const searchMessages = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      
      // Simulate API delay
      setTimeout(() => {
        const filtered = mockSearchResults.filter(result =>
          result.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.sender_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        setSearchResults(filtered);
        setCurrentIndex(-1);
        setIsSearching(false);
      }, 300);
    };

    const debounceTimer = setTimeout(searchMessages, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, conversationId]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 rounded px-1">
          {part}
        </mark>
      ) : part
    );
  };

  const handleResultClick = (messageId: string, index: number) => {
    setCurrentIndex(index);
    onJumpToMessage(messageId);
    onClose();
  };

  const navigateResults = (direction: 'up' | 'down') => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'up') {
      newIndex = currentIndex <= 0 ? searchResults.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex >= searchResults.length - 1 ? 0 : currentIndex + 1;
    }
    
    setCurrentIndex(newIndex);
    onJumpToMessage(searchResults[newIndex].id);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentIndex(-1);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Messages
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-900">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for messages..."
                className="pl-10 pr-4"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Navigation buttons */}
            {searchResults.length > 0 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => navigateResults('up')}
                  disabled={searchResults.length === 0}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => navigateResults('down')}
                  disabled={searchResults.length === 0}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <span className="text-sm text-gray-500 ml-2">
                  {currentIndex >= 0 ? currentIndex + 1 : 0} of {searchResults.length}
                </span>
              </div>
            )}
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-2 mt-3">
            <Filter className="h-4 w-4 text-gray-500" />
            {['all', 'media', 'links', 'docs'].map((filter) => (
              <Button
                key={filter}
                variant={searchFilter === filter ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "text-xs capitalize",
                  searchFilter === filter && "bg-blue-500 text-white"
                )}
                onClick={() => setSearchFilter(filter as any)}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        <ScrollArea className="flex-1 max-h-96">
          {isSearching ? (
            <div className="flex items-center justify-center p-8">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                Searching...
              </div>
            </div>
          ) : searchQuery && searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm font-medium">No messages found</p>
              <p className="text-xs mt-1">Try adjusting your search terms</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y">
              {searchResults.map((result, index) => (
                <div
                  key={result.id}
                  className={cn(
                    "p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors",
                    currentIndex === index && "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
                  )}
                  onClick={() => handleResultClick(result.id, index)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={result.sender_avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                        {getInitials(result.sender_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{result.sender_name}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(result.created_at), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {highlightMatch(result.match_snippet, searchQuery)}
                      </div>
                      
                      {result.content.length > result.match_snippet.length && (
                        <Button
                          variant="link"
                          className="text-xs text-blue-600 p-0 h-auto mt-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResultClick(result.id, index);
                          }}
                        >
                          View full message
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <Search className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm font-medium">Search through messages</p>
              <p className="text-xs mt-1">Type to find messages, media, links and more</p>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {searchResults.length > 0 && (
          <div className="px-6 py-3 border-t bg-gray-50 dark:bg-gray-900 text-xs text-gray-500">
            Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} 
            {conversationId ? ' in this conversation' : ' across all conversations'}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
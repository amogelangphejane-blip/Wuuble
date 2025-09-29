import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  MoreVertical, 
  Info, 
  AlertCircle,
  MessageCircle,
  Search,
  X,
  Plus,
  Send,
  Smile,
  Paperclip,
  Check,
  CheckCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';

// Mock data for demonstration
const mockConversations = [
  {
    id: '1',
    participant: {
      id: '2',
      display_name: 'Sarah Johnson',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612d2f7?w=150&h=150&fit=crop&crop=face',
    },
    last_message: {
      content: 'Hey! How are you doing today?',
      created_at: new Date().toISOString(),
      sender_id: '2'
    },
    last_message_at: new Date().toISOString(),
    unread_count: 2
  },
  {
    id: '2', 
    participant: {
      id: '3',
      display_name: 'Mike Chen',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
    last_message: {
      content: 'Thanks for the help with the project!',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      sender_id: '3'
    },
    last_message_at: new Date(Date.now() - 3600000).toISOString(),
    unread_count: 0
  },
  {
    id: '3',
    participant: {
      id: '4', 
      display_name: 'Lisa Park',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    },
    last_message: {
      content: 'See you at the meeting tomorrow',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      sender_id: '1'
    },
    last_message_at: new Date(Date.now() - 7200000).toISOString(),
    unread_count: 0
  }
];

const mockMessages = [
  {
    id: '1',
    content: 'Hey! How are you doing today?',
    sender_id: '2',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    sender: {
      display_name: 'Sarah Johnson',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612d2f7?w=150&h=150&fit=crop&crop=face'
    }
  },
  {
    id: '2',
    content: 'I\'m doing great! Working on some new features for our app.',
    sender_id: '1',
    created_at: new Date(Date.now() - 1200000).toISOString(),
    sender: {
      display_name: 'You',
      avatar_url: null
    }
  },
  {
    id: '3',
    content: 'That sounds exciting! What kind of features are you working on?',
    sender_id: '2',
    created_at: new Date(Date.now() - 600000).toISOString(),
    sender: {
      display_name: 'Sarah Johnson',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612d2f7?w=150&h=150&fit=crop&crop=face'
    }
  },
  {
    id: '4',
    content: 'I\'m rebuilding our messaging system with a completely modern architecture! It\'s got real-time features, responsive design, and much better performance.',
    sender_id: '1', 
    created_at: new Date().toISOString(),
    sender: {
      display_name: 'You',
      avatar_url: null
    }
  }
];

const Messages: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>('1');
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');

  // Get screen size
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Find the selected conversation
  const selectedConversation = selectedConversationId 
    ? mockConversations.find(c => c.id === selectedConversationId)
    : null;

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsMobileConversationOpen(true);
  };

  const handleBackToList = () => {
    setIsMobileConversationOpen(false);
    setSelectedConversationId(null);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    toast({
      title: "Message sent!",
      description: "Your message has been delivered.",
    });
    
    setMessageInput('');
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

  // Authentication check
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-xl border">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Please sign in</h2>
          <p className="text-gray-600 dark:text-gray-300">You need to be signed in to access your messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900 overflow-hidden">
      {/* Conversation List */}
      <div className={cn(
        "transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700",
        "w-full sm:w-80 md:w-80 lg:w-96 flex-shrink-0",
        isMobile && isMobileConversationOpen ? "hidden" : "flex flex-col"
      )}>
        {/* Conversation List Header */}
        <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              <span className="hidden sm:inline">Messages</span>
            </h2>
            <Button 
              size="icon" 
              variant="outline"
              className="h-8 w-8 rounded-full border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/50"
            >
              <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </Button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:ring-blue-800 text-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-1 md:p-2">
            {mockConversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.id;
              const isOnline = Math.random() > 0.5;
              
              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "group flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 rounded-lg mx-1 touch-manipulation",
                    "hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-800",
                    isSelected && "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                  )}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.participant.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-500 text-white text-sm font-medium">
                        {getInitials(conversation.participant.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                    )}
                    
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
                          {conversation.participant.display_name}
                        </h3>
                        
                        <div className="flex items-center gap-1 mt-0.5">
                          {conversation.last_message.sender_id === user.id && (
                            <span className="text-gray-500 dark:text-gray-400 text-xs">You:</span>
                          )}
                          <p className={cn(
                            "text-xs truncate",
                            conversation.unread_count > 0 
                              ? "text-gray-900 dark:text-gray-100 font-medium" 
                              : "text-gray-500 dark:text-gray-400"
                          )}>
                            {conversation.last_message.content.slice(0, 35)}...
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 ml-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isToday(new Date(conversation.last_message_at)) 
                            ? format(new Date(conversation.last_message_at), 'HH:mm')
                            : format(new Date(conversation.last_message_at), 'MMM dd')
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
        isMobile && !isMobileConversationOpen ? "hidden" : "flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Back Button */}
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full flex-shrink-0"
                      onClick={handleBackToList}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.participant.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-500 text-white text-sm font-medium">
                        {getInitials(selectedConversation.participant.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-50 dark:border-gray-800" />
                  </div>
                  
                  {/* Name and Status */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {selectedConversation.participant.display_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Active now
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" disabled>
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" disabled>
                    <Phone className="h-4 w-4" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem>
                        <Info className="mr-2 h-4 w-4" />
                        Conversation Info
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 bg-gray-50 dark:bg-gray-900">
              <div className="p-4 space-y-4">
                {mockMessages.map((message, index) => {
                  const isOwn = message.sender_id === user.id;
                  const previousMessage = mockMessages[index - 1];
                  const showAvatar = !previousMessage || previousMessage.sender_id !== message.sender_id;
                  
                  return (
                    <div key={message.id} className={cn(
                      "flex gap-3 group",
                      isOwn ? "flex-row-reverse" : "flex-row"
                    )}>
                      {/* Avatar */}
                      {showAvatar && !isOwn && (
                        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                          <AvatarImage src={message.sender.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                            {getInitials(message.sender.display_name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      {!showAvatar && !isOwn && (
                        <div className="h-8 w-8 flex-shrink-0" />
                      )}
                      
                      {/* Message bubble */}
                      <div className={cn(
                        "max-w-[85%] sm:max-w-[75%] md:max-w-[70%]",
                        isOwn ? "items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "relative px-3 py-2 md:px-4 md:py-2.5 text-sm break-words shadow-sm rounded-2xl transition-all duration-200 hover:shadow-md",
                          isOwn 
                            ? "bg-blue-500 text-white rounded-br-md ml-auto" 
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-700"
                        )}>
                          {/* Message tail */}
                          {showAvatar && (
                            <div className={cn(
                              "absolute top-0 w-0 h-0",
                              isOwn 
                                ? "right-[-6px] border-l-[6px] border-l-blue-500 border-t-[6px] border-t-transparent"
                                : "left-[-6px] border-r-[6px] border-r-white dark:border-r-gray-800 border-t-[6px] border-t-transparent"
                            )} />
                          )}
                          
                          {/* Message content */}
                          <div className={cn("leading-relaxed whitespace-pre-wrap", isOwn ? "pr-16" : "pr-14")}>
                            {message.content}
                          </div>
                          
                          {/* Time and status */}
                          <div className={cn(
                            "absolute bottom-1 right-2 flex items-center gap-1 text-xs leading-none",
                            isOwn ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                          )}>
                            <time dateTime={message.created_at}>
                              {format(new Date(message.created_at), 'HH:mm')}
                            </time>
                            {isOwn && <CheckCheck className="h-3 w-3 text-blue-200" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex items-end gap-2 md:gap-3 p-3 md:p-4">
                {/* Attachment button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 md:h-11 md:w-11 shrink-0 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>

                {/* Message input */}
                <div className="flex-1 relative">
                  <div className="relative bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-600 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:focus-within:ring-blue-800">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      className="min-h-[44px] md:min-h-[48px] border-0 bg-transparent pl-4 pr-12 py-3 text-sm md:text-base rounded-2xl focus:ring-0 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    
                    {/* Emoji button */}
                    <div className="absolute right-2 bottom-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                      >
                        <Smile className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Send button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  size="icon"
                  className={cn(
                    "h-10 w-10 md:h-11 md:w-11 shrink-0 rounded-full transition-all duration-200",
                    "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "touch-manipulation active:scale-95"
                  )}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="text-center max-w-md p-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <MessageCircle className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              
              <h3 className="text-xl md:text-2xl font-light mb-4 text-gray-600 dark:text-gray-300">
                Welcome to Messages
              </h3>
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                Select a conversation to start messaging, or create a new conversation to connect with others.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
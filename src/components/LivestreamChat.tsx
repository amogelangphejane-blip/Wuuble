import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Send, 
  Heart, 
  Laugh, 
  ThumbsUp, 
  Flame, 
  Star,
  MessageCircle,
  X,
  Pin,
  MoreVertical,
  Flag
} from 'lucide-react';
import { StreamMessage, StreamReaction } from '@/services/livestreamService';
import { formatDistanceToNow } from 'date-fns';

interface LivestreamChatProps {
  streamId: string;
  messages: StreamMessage[];
  reactions: StreamReaction[];
  reactionAnimations: Array<{
    id: string;
    type: string;
    x: number;
    y: number;
    timestamp: number;
  }>;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string, type?: 'text' | 'emoji' | 'question') => void;
  onSendReaction: (type: StreamReaction['reaction_type'], position?: { x: number; y: number }) => void;
  unreadCount: number;
  isStreamer?: boolean;
  userProfiles?: Record<string, { display_name?: string; avatar_url?: string }>;
}

const reactionEmojis = {
  like: '👍',
  love: '❤️',
  wow: '😮',
  laugh: '😂',
  clap: '👏',
  fire: '🔥'
};

const reactionIcons = {
  like: ThumbsUp,
  love: Heart,
  wow: Star,
  laugh: Laugh,
  clap: ThumbsUp,
  fire: Flame
};

export const LivestreamChat: React.FC<LivestreamChatProps> = ({
  streamId,
  messages,
  reactions,
  reactionAnimations,
  isOpen,
  onClose,
  onSendMessage,
  onSendReaction,
  unreadCount,
  isStreamer = false,
  userProfiles = {}
}) => {
  const [messageText, setMessageText] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [isQuestionMode, setIsQuestionMode] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      console.log('[LivestreamChat] Sending message:', {
        streamId,
        message: messageText,
        type: isQuestionMode ? 'question' : 'text',
        timestamp: new Date().toISOString()
      });
      
      onSendMessage(messageText, isQuestionMode ? 'question' : 'text');
      setMessageText('');
    } else {
      console.warn('[LivestreamChat] Attempted to send empty message');
    }
  };

  const handleReactionClick = (type: StreamReaction['reaction_type'], event: React.MouseEvent) => {
    const rect = chatContainerRef.current?.getBoundingClientRect();
    let position;
    
    if (rect) {
      position = {
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100
      };
    }
    
    console.log('[LivestreamChat] Sending reaction:', {
      streamId,
      type,
      position,
      timestamp: new Date().toISOString()
    });
    
    onSendReaction(type, position);
    setShowReactions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'question':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'system':
        return 'bg-gray-100 border-gray-300 text-gray-600';
      default:
        return 'bg-white border-gray-200';
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          onClick={() => {}}
          className="rounded-full w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg relative"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[20px] h-5 text-xs flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div 
      ref={chatContainerRef}
      className="fixed inset-y-0 right-0 w-80 bg-white/95 backdrop-blur-md border-l border-gray-200 shadow-2xl z-40 flex flex-col"
    >
      {/* Reaction Animations Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50">
        {reactionAnimations.map((animation) => {
          const ReactionIcon = reactionIcons[animation.type as keyof typeof reactionIcons];
          return (
            <div
              key={animation.id}
              className="absolute animate-bounce"
              style={{
                left: `${animation.x}%`,
                top: `${animation.y}%`,
                animation: 'float-up 3s ease-out forwards'
              }}
            >
              <div className="text-2xl animate-pulse">
                {reactionEmojis[animation.type as keyof typeof reactionEmojis]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Live Chat</h3>
          <Badge variant="secondary" className="text-xs">
            {messages.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg border ${getMessageTypeColor(message.message_type)}`}
            >
              <div className="flex items-start space-x-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={userProfiles[message.user_id]?.avatar_url || "/placeholder-avatar.jpg"} />
                  <AvatarFallback className="text-xs">
                    {userProfiles[message.user_id]?.display_name?.slice(0, 2).toUpperCase() || message.user_id.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {userProfiles[message.user_id]?.display_name || 'Anonymous'}
                    </span>
                    {message.message_type === 'question' && (
                      <Badge variant="outline" className="text-xs">Q</Badge>
                    )}
                    {message.is_pinned && (
                      <Pin className="w-3 h-3 text-yellow-500" />
                    )}
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 break-words">
                    {message.message}
                  </p>
                </div>
                {isStreamer && (
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {messages.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Reactions */}
      {showReactions && (
        <div className="p-4 border-t border-gray-200 bg-white/90">
          <div className="grid grid-cols-6 gap-2">
            {Object.entries(reactionEmojis).map(([type, emoji]) => (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                className="text-2xl hover:scale-110 transition-transform"
                onClick={(e) => handleReactionClick(type as StreamReaction['reaction_type'], e)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-2 mb-2">
          <Button
            variant={isQuestionMode ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsQuestionMode(!isQuestionMode)}
            className="text-xs"
          >
            Q&A
          </Button>
          <Button
            variant={showReactions ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowReactions(!showReactions)}
          >
            <Heart className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isQuestionMode ? "Ask a question..." : "Type a message..."}
            className="flex-1 text-sm"
            maxLength={500}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>{messageText.length}/500</span>
          {isQuestionMode && (
            <span className="text-blue-600">Question mode active</span>
          )}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-50px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
};
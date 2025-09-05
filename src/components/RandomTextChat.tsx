import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { validateAvatarUrl } from '@/lib/utils';
import { 
  MessageCircle, 
  Send, 
  X, 
  User, 
  Clock,
  Users,
  Shuffle,
  Heart,
  Smile,
  MoreHorizontal,
  Flag,
  UserX,
  Volume2,
  VolumeX
} from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  isSystem?: boolean;
}

interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  joinedAt: Date;
}

interface RandomTextChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RandomTextChat: React.FC<RandomTextChatProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chatPartner, setChatPartner] = useState<ChatParticipant | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mock data for demonstration
  const mockUsers = [
    { id: 'user1', name: 'Alex Chen', avatar: null, location: 'New York' },
    { id: 'user2', name: 'Sarah Johnson', avatar: null, location: 'London' },
    { id: 'user3', name: 'Mike Rodriguez', avatar: null, location: 'Tokyo' },
    { id: 'user4', name: 'Emma Wilson', avatar: null, location: 'Sydney' },
    { id: 'user5', name: 'David Kim', avatar: null, location: 'Seoul' },
  ];

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect to random chat
  const connectToRandomChat = async () => {
    if (!user) return;
    
    setIsConnecting(true);
    setMessages([]);
    setChatPartner(null);
    
    // Simulate connection delay
    setTimeout(() => {
      // Pick a random mock user
      const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      const partner: ChatParticipant = {
        id: randomUser.id,
        name: randomUser.name,
        avatar: randomUser.avatar,
        isOnline: true,
        joinedAt: new Date()
      };
      
      setChatPartner(partner);
      setIsConnected(true);
      setIsConnecting(false);
      
      // Add system message
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        text: `You're now connected with ${partner.name}! Say hello 👋`,
        timestamp: new Date(),
        senderId: 'system',
        senderName: 'System',
        isSystem: true
      };
      
      setMessages([systemMessage]);
      
      // Simulate partner typing and sending a message
      setTimeout(() => {
        setTypingUsers([partner.name]);
        setTimeout(() => {
          setTypingUsers([]);
          const welcomeMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: 'Hello! Nice to meet you! 😊',
            timestamp: new Date(),
            senderId: partner.id,
            senderName: partner.name,
            senderAvatar: partner.avatar
          };
          setMessages(prev => [...prev, welcomeMessage]);
          
          if (soundEnabled) {
            // Play notification sound (mock)
            console.log('🔊 New message sound');
          }
        }, 2000);
      }, 1000);
      
      toast({
        title: "Connected!",
        description: `You're now chatting with ${partner.name}`,
      });
    }, 2000);
  };

  // Send message
  const sendMessage = () => {
    if (!messageInput.trim() || !user || !chatPartner) return;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageInput.trim(),
      timestamp: new Date(),
      senderId: user.id,
      senderName: profile?.display_name || user.email?.split('@')[0] || 'You',
      senderAvatar: profile?.avatar_url
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');
    
    // Simulate partner response (for demo)
    if (Math.random() > 0.3) {
      setTimeout(() => {
        setTypingUsers([chatPartner.name]);
        setTimeout(() => {
          setTypingUsers([]);
          const responses = [
            "That's interesting! Tell me more 🤔",
            "I totally agree with you!",
            "Haha, that's funny! 😄",
            "What do you think about that?",
            "That's a great point!",
            "I've never thought about it that way",
            "Where are you from?",
            "What do you like to do for fun?",
            "That sounds really cool!",
            "I love that! ❤️"
          ];
          
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          const responseMessage: ChatMessage = {
            id: (Date.now() + Math.random()).toString(),
            text: randomResponse,
            timestamp: new Date(),
            senderId: chatPartner.id,
            senderName: chatPartner.name,
            senderAvatar: chatPartner.avatar
          };
          
          setMessages(prev => [...prev, responseMessage]);
          
          if (soundEnabled) {
            console.log('🔊 New message sound');
          }
        }, 1000 + Math.random() * 2000);
      }, 500 + Math.random() * 1000);
    }
  };

  // Disconnect from chat
  const disconnectChat = () => {
    setIsConnected(false);
    setIsConnecting(false);
    setChatPartner(null);
    setMessages([]);
    setTypingUsers([]);
    
    toast({
      title: "Disconnected",
      description: "You've left the random chat",
    });
  };

  // Next chat
  const nextChat = () => {
    disconnectChat();
    setTimeout(() => {
      connectToRandomChat();
    }, 500);
  };

  // Report user (mock)
  const reportUser = () => {
    toast({
      title: "User Reported",
      description: "Thank you for keeping our community safe",
    });
  };

  // Block user (mock)
  const blockUser = () => {
    toast({
      title: "User Blocked",
      description: "This user has been blocked",
    });
    disconnectChat();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-primary" />
              <div>
                <DialogTitle>Random Text Chat</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {isConnected && chatPartner ? (
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Connected with {chatPartner.name}
                    </span>
                  ) : isConnecting ? (
                    'Connecting to a random person...'
                  ) : (
                    'Connect with random people around the world'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {!isConnected && !isConnecting ? (
            // Connection screen
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-6 max-w-md">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Random Text Chat</h3>
                  <p className="text-muted-foreground">
                    Connect with random people from around the world and have interesting conversations.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button onClick={connectToRandomChat} size="lg" className="w-full">
                    <Shuffle className="w-5 h-5 mr-2" />
                    Start Random Chat
                  </Button>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>1.2k online</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Avg wait: 3s</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <p className="font-medium mb-1">Chat Guidelines:</p>
                  <ul className="space-y-1">
                    <li>• Be respectful and kind</li>
                    <li>• No inappropriate content</li>
                    <li>• Report any abuse immediately</li>
                    <li>• Have fun and make new friends!</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : isConnecting ? (
            // Connecting screen
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <div>
                  <h3 className="text-lg font-semibold">Finding someone to chat with...</h3>
                  <p className="text-muted-foreground">This usually takes just a few seconds</p>
                </div>
              </div>
            </div>
          ) : (
            // Chat screen
            <>
              {/* Chat partner info */}
              {chatPartner && (
                <div className="px-4 py-3 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage 
                            src={validateAvatarUrl(chatPartner.avatar)} 
                            alt={chatPartner.name}
                          />
                          <AvatarFallback>
                            {chatPartner.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <h4 className="font-medium">{chatPartner.name}</h4>
                        <p className="text-xs text-muted-foreground">Online now</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={nextChat}>
                        <Shuffle className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={reportUser}>
                        <Flag className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={blockUser}>
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-4 py-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === user?.id ? 'justify-end' : 'justify-start'
                      } ${message.isSystem ? 'justify-center' : ''}`}
                    >
                      {message.isSystem ? (
                        <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                          {message.text}
                        </div>
                      ) : (
                        <div className="flex items-end gap-2 max-w-[70%]">
                          {message.senderId !== user?.id && (
                            <Avatar className="w-6 h-6">
                              <AvatarImage 
                                src={validateAvatarUrl(message.senderAvatar)} 
                                alt={message.senderName}
                              />
                              <AvatarFallback className="text-xs">
                                {message.senderName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`px-3 py-2 rounded-2xl ${
                              message.senderId === user?.id
                                ? 'bg-primary text-primary-foreground ml-auto'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {typingUsers[0].charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted px-3 py-2 rounded-2xl">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message input */}
              <div className="border-t p-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!messageInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { chatService } from '@/services/chatService';
import {
  ChatChannelWithDetails,
  ChatMessageWithDetails,
  MessageInputState,
  FileUpload,
  EmojiReaction,
  ChatEvent
} from '@/types/chat';
import {
  MessageCircle,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Reply,
  Edit3,
  Trash2,
  Hash,
  Plus,
  Search,
  Users,
  Settings,
  Pin,
  Heart,
  ThumbsUp,
  Laugh,
  X,
  File,
  Image,
  Download,
  Eye,
  MessageSquare,
  AtSign
} from 'lucide-react';

interface TeamsChatProps {
  communityId: string;
  className?: string;
  isInVideoCall?: boolean;
  onClose?: () => void;
}

interface MessageItemProps {
  message: ChatMessageWithDetails;
  isThread?: boolean;
  onReply?: (message: ChatMessageWithDetails) => void;
  onEdit?: (message: ChatMessageWithDetails) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onShowThread?: (message: ChatMessageWithDetails) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isThread = false,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  onShowThread
}) => {
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);
  const [hovering, setHovering] = useState(false);

  const formatContent = (content: string, metadata?: any) => {
    // Simple markdown-like formatting
    let formatted = content;
    
    // Bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Code blocks
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-2 rounded"><code>$1</code></pre>');
    
    // Inline code
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');
    
    // Links
    formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-blue-500 hover:underline">$1</a>');
    
    return formatted;
  };

  const getReactionSummary = (reactions: any[] = []) => {
    const reactionMap = new Map();
    reactions.forEach(reaction => {
      const key = reaction.emoji;
      if (!reactionMap.has(key)) {
        reactionMap.set(key, { count: 0, users: [], userReacted: false });
      }
      const summary = reactionMap.get(key);
      summary.count++;
      summary.users.push(reaction.user);
      if (reaction.user_id === user?.id) {
        summary.userReacted = true;
      }
    });
    return Array.from(reactionMap.entries()).map(([emoji, data]) => ({ emoji, ...data }));
  };

  const reactionSummary = getReactionSummary(message.reactions);

  return (
    <div
      className={`group relative p-3 hover:bg-gray-50 transition-colors ${isThread ? 'ml-4 border-l-2 border-gray-200' : ''}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={message.user?.avatar_url} />
          <AvatarFallback>
            {message.user?.display_name?.[0] || message.user?.username?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {message.user?.display_name || message.user?.username || 'Unknown User'}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(message.created_at).toLocaleTimeString()}
            </span>
            {message.is_edited && (
              <Badge variant="outline" className="text-xs">edited</Badge>
            )}
          </div>
          
          <div 
            className="text-sm text-gray-900 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatContent(message.content, message.metadata) }}
          />
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                  {attachment.file_type.startsWith('image/') ? (
                    <Image className="w-4 h-4" />
                  ) : (
                    <File className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">{attachment.file_name}</span>
                  <span className="text-xs text-gray-500">
                    ({Math.round(attachment.file_size / 1024)} KB)
                  </span>
                  <Button size="sm" variant="ghost" className="ml-auto">
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {/* Reactions */}
          {reactionSummary.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {reactionSummary.map((reaction) => (
                <Button
                  key={reaction.emoji}
                  size="sm"
                  variant={reaction.userReacted ? "default" : "outline"}
                  className="h-6 px-2 text-xs"
                  onClick={() => onReaction?.(message.id, reaction.emoji)}
                >
                  {reaction.emoji} {reaction.count}
                </Button>
              ))}
            </div>
          )}
          
          {/* Thread indicator */}
          {!isThread && message.reply_count > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="mt-2 text-blue-600 hover:text-blue-800"
              onClick={() => onShowThread?.(message)}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              {message.reply_count} replies
            </Button>
          )}
        </div>
      </div>
      
      {/* Action buttons on hover */}
      {hovering && (
        <div className="absolute top-2 right-2 flex gap-1 bg-white border rounded-lg shadow-sm p-1">
          <Button size="sm" variant="ghost" onClick={() => setShowReactions(true)}>
            <Smile className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onReply?.(message)}>
            <Reply className="w-3 h-3" />
          </Button>
          {message.user_id === user?.id && (
            <>
              <Button size="sm" variant="ghost" onClick={() => onEdit?.(message)}>
                <Edit3 className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete?.(message.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Pin className="w-4 h-4 mr-2" />
                Pin message
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageCircle className="w-4 h-4 mr-2" />
                Start thread
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      {/* Quick reactions overlay */}
      {showReactions && (
        <div className="absolute top-8 right-2 bg-white border rounded-lg shadow-lg p-2 flex gap-1 z-10">
          {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
            <Button
              key={emoji}
              size="sm"
              variant="ghost"
              className="text-lg"
              onClick={() => {
                onReaction?.(message.id, emoji);
                setShowReactions(false);
              }}
            >
              {emoji}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowReactions(false)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

const TeamsChat: React.FC<TeamsChatProps> = ({
  communityId,
  className = '',
  isInVideoCall = false,
  onClose
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState<ChatChannelWithDetails[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChatChannelWithDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessageWithDetails[]>([]);
  const [inputState, setInputState] = useState<MessageInputState>({
    content: '',
    mentions: [],
    attachments: [],
  });
  const [loading, setLoading] = useState(true);
  const [showChannelDialog, setShowChannelDialog] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [threadMessage, setThreadMessage] = useState<ChatMessageWithDetails | null>(null);
  const [threadMessages, setThreadMessages] = useState<ChatMessageWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Load channels and messages
  useEffect(() => {
    loadChannels();
  }, [communityId]);

  useEffect(() => {
    if (activeChannel) {
      loadMessages();
      subscribeToChannel();
    }
    return () => {
      if (activeChannel) {
        chatService.unsubscribeFromChannel(activeChannel.id);
      }
    };
  }, [activeChannel]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChannels = async () => {
    try {
      const channelList = await chatService.getChannelsForCommunity(communityId);
      setChannels(channelList);
      if (channelList.length > 0 && !activeChannel) {
        setActiveChannel(channelList[0]);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
      toast({
        title: "Error",
        description: "Failed to load chat channels",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!activeChannel) return;
    
    try {
      const messageList = await chatService.getMessages(activeChannel.id);
      setMessages(messageList);
      await chatService.markChannelAsRead(activeChannel.id);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToChannel = () => {
    if (!activeChannel) return;
    
    return chatService.subscribeToChannel(activeChannel.id, (event: ChatEvent) => {
      switch (event.type) {
        case 'message':
          setMessages(prev => [...prev, event.data as ChatMessageWithDetails]);
          break;
        case 'reaction':
          // Update message reactions
          setMessages(prev => prev.map(msg => 
            msg.id === event.data.message_id 
              ? { ...msg, reactions: [...(msg.reactions || []), event.data] }
              : msg
          ));
          break;
        case 'typing':
          // Handle typing indicators
          break;
      }
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!activeChannel || !inputState.content.trim()) return;

    try {
      const result = await chatService.sendMessage(
        activeChannel.id,
        inputState.content,
        undefined,
        inputState.replyTo?.id,
        threadMessage?.id || inputState.replyTo?.thread_root_id || inputState.replyTo?.id,
        inputState.attachments.map(a => a.file)
      );

      if (result.success) {
        setInputState({
          content: '',
          mentions: [],
          attachments: [],
        });
        
        if (threadMessage) {
          setThreadMessages(prev => [...prev, result.message]);
        } else {
          setMessages(prev => [...prev, result.message]);
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send message",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newAttachments: FileUpload[] = files.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));
    
    setInputState(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
  };

  const removeAttachment = (index: number) => {
    setInputState(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await chatService.addReaction(messageId, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleReply = (message: ChatMessageWithDetails) => {
    setInputState(prev => ({
      ...prev,
      replyTo: message
    }));
  };

  const handleEdit = (message: ChatMessageWithDetails) => {
    setInputState(prev => ({
      ...prev,
      content: message.content,
      isEditing: message.id
    }));
  };

  const handleDelete = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleShowThread = async (message: ChatMessageWithDetails) => {
    try {
      setThreadMessage(message);
      const replies = await chatService.getMessages(
        activeChannel!.id,
        50,
        0,
        message.thread_root_id || message.id
      );
      setThreadMessages(replies);
    } catch (error) {
      console.error('Error loading thread:', error);
    }
  };

  const createChannel = async () => {
    if (!newChannelName.trim()) return;

    try {
      const result = await chatService.createChannel(
        communityId,
        newChannelName,
        newChannelDescription
      );

      if (result.success) {
        setChannels(prev => [...prev, result.channel]);
        setShowChannelDialog(false);
        setNewChannelName('');
        setNewChannelDescription('');
        toast({
          title: "Success",
          description: "Channel created successfully"
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create channel",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  };

  const handleTyping = useCallback(() => {
    if (!activeChannel) return;
    
    chatService.startTyping(activeChannel.id);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      chatService.stopTyping(activeChannel.id);
    }, 3000);
  }, [activeChannel]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full bg-white ${className}`}>
      {/* Channel Sidebar */}
      <div className="w-64 bg-gray-50 border-r flex flex-col">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">Channels</h3>
            <Dialog open={showChannelDialog} onOpenChange={setShowChannelDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Channel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Channel Name</label>
                    <Input
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="e.g., general, random"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description (optional)</label>
                    <Textarea
                      value={newChannelDescription}
                      onChange={(e) => setNewChannelDescription(e.target.value)}
                      placeholder="What's this channel about?"
                    />
                  </div>
                  <Button onClick={createChannel} className="w-full">
                    Create Channel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            {channels.map((channel) => (
              <Button
                key={channel.id}
                variant={activeChannel?.id === channel.id ? "secondary" : "ghost"}
                className="w-full justify-start mb-1 h-auto p-3"
                onClick={() => setActiveChannel(channel)}
              >
                <Hash className="w-4 h-4 mr-2" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{channel.name}</div>
                  {channel.description && (
                    <div className="text-xs text-gray-500 truncate">
                      {channel.description}
                    </div>
                  )}
                </div>
                {channel.unread_count > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {channel.unread_count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChannel ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-gray-500" />
                <h2 className="font-semibold text-lg">{activeChannel.name}</h2>
                {activeChannel.description && (
                  <span className="text-sm text-gray-500">- {activeChannel.description}</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost">
                  <Users className="w-4 h-4" />
                  {activeChannel.member_count}
                </Button>
                <Button size="sm" variant="ghost">
                  <Settings className="w-4 h-4" />
                </Button>
                {onClose && (
                  <Button size="sm" variant="ghost" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-1">
                {messages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReaction={handleReaction}
                    onShowThread={handleShowThread}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              {inputState.replyTo && (
                <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-500">Replying to</span>
                    <span className="font-medium ml-1">
                      {inputState.replyTo.user?.display_name || 'Unknown User'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setInputState(prev => ({ ...prev, replyTo: undefined }))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
              
              {inputState.attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {inputState.attachments.map((attachment, index) => (
                    <div key={index} className="relative bg-gray-100 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4" />
                        <span className="text-sm">{attachment.file.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    value={inputState.content}
                    onChange={(e) => {
                      setInputState(prev => ({ ...prev, content: e.target.value }));
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Message #${activeChannel.name}...`}
                    className="min-h-[40px] max-h-32 resize-none"
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!inputState.content.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Select a channel to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Thread Sidebar */}
      {threadMessage && (
        <div className="w-80 bg-gray-50 border-l flex flex-col">
          <div className="p-4 border-b bg-white flex items-center justify-between">
            <h3 className="font-semibold">Thread</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setThreadMessage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <MessageItem
              message={threadMessage}
              isThread={false}
              onReaction={handleReaction}
            />
            <div className="space-y-1 mt-4">
              {threadMessages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isThread={true}
                  onReaction={handleReaction}
                />
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Input
                value={inputState.content}
                onChange={(e) => setInputState(prev => ({ ...prev, content: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Reply to thread..."
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!inputState.content.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsChat;
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft } from 'lucide-react';
import { UserIdHelper } from '@/components/UserIdHelper';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SimpleMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_name: string;
}

interface SimpleConversation {
  id: string;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  updated_at: string;
}

export default function SimpleMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<SimpleConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`messages-${selectedConversation}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'simple_messages',
            filter: `conversation_id=eq.${selectedConversation}`
          }, 
          (payload) => {
            const newMsg = payload.new as any;
            setMessages(prev => [...prev, {
              id: newMsg.id,
              content: newMsg.content,
              sender_id: newMsg.sender_id,
              created_at: newMsg.created_at,
              sender_name: newMsg.sender_id === user?.id ? 'You' : 'Other User'
            }]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation, user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      // First get conversations
      const { data: conversations, error } = await supabase
        .from('simple_conversations')
        .select('id, user1_id, user2_id, last_message, updated_at')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (!conversations || conversations.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get all other user IDs
      const otherUserIds = conversations.map(conv => 
        conv.user1_id === user.id ? conv.user2_id : conv.user1_id
      );

      // Get profiles for other users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', otherUserIds);

      if (profileError) {
        console.warn('Error loading profiles:', profileError);
      }

      // Create a map of user_id to display_name
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.user_id, profile.display_name);
      });

      const formattedConversations = conversations.map(conv => {
        const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
        return {
          id: conv.id,
          other_user_id: otherUserId,
          other_user_name: profileMap.get(otherUserId) || `User ${otherUserId.slice(0, 8)}`,
          last_message: conv.last_message || 'No messages yet',
          updated_at: conv.updated_at
        };
      });

      setConversations(formattedConversations);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations. Make sure database schema is applied.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      // First get messages
      const { data: messages, error } = await supabase
        .from('simple_messages')
        .select('id, content, sender_id, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!messages || messages.length === 0) {
        setMessages([]);
        return;
      }

      // Get unique sender IDs
      const senderIds = [...new Set(messages.map(msg => msg.sender_id))];

      // Get profiles for senders
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', senderIds);

      if (profileError) {
        console.warn('Error loading sender profiles:', profileError);
      }

      // Create a map of user_id to display_name
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.user_id, profile.display_name);
      });

      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        created_at: msg.created_at,
        sender_name: msg.sender_id === user?.id ? 'You' : 
          (profileMap.get(msg.sender_id) || `User ${msg.sender_id.slice(0, 8)}`)
      }));

      setMessages(formattedMessages);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      const { error } = await supabase
        .from('simple_messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      // Update conversation's last_message
      await supabase
        .from('simple_conversations')
        .update({ 
          last_message: newMessage.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedConversation);

      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const startNewConversation = async () => {
    if (!newUserEmail.trim() || !user) return;

    try {
      let targetUserId = newUserEmail.trim();
      
      // If it looks like an email, try to find by email, otherwise treat as user ID
      if (newUserEmail.includes('@')) {
        // Try to find user by email in auth.users (this requires admin access, so we'll skip this)
        toast({
          title: "Note",
          description: "Please use User ID instead of email for now",
          variant: "default",
        });
        return;
      }

      // Check if user exists and get/create their profile
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (profileError) {
        console.warn('Profile check error:', profileError);
      }

      // If no profile exists, create one (this might fail if user doesn't exist)
      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ 
            user_id: targetUserId, 
            display_name: `User ${targetUserId.slice(0, 8)}` 
          });
        
        if (insertError) {
          console.warn('Could not create profile:', insertError);
        }
      }

      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('simple_conversations')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${user.id})`)
        .maybeSingle();

      if (existingConv) {
        setSelectedConversation(existingConv.id);
        setNewUserEmail('');
        toast({
          title: "Info",
          description: "Conversation already exists",
        });
        return;
      }

      // Create new conversation
      const { data: convData, error: convError } = await supabase
        .from('simple_conversations')
        .insert({
          user1_id: user.id,
          user2_id: targetUserId
        })
        .select()
        .single();

      if (convError) {
        console.error('Conversation creation error:', convError);
        toast({
          title: "Error",
          description: "Failed to create conversation. Make sure the User ID is valid.",
          variant: "destructive",
        });
        return;
      }

      setNewUserEmail('');
      loadConversations();
      setSelectedConversation(convData.id);
      toast({
        title: "Success",
        description: "New conversation started!",
      });
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation. Check console for details.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to access messages</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white">
      {/* Conversations List */}
      <div className="w-80 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50">
          <h1 className="text-lg font-semibold mb-4">Messages</h1>
          
          {/* New conversation */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Enter user ID to start chat"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="text-sm flex-1"
              />
              <UserIdHelper />
            </div>
            <Button 
              onClick={startNewConversation} 
              size="sm" 
              className="w-full"
              disabled={!newUserEmail.trim()}
            >
              Start New Chat
            </Button>
          </div>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Start a new chat above</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedConversation === conv.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedConversation(conv.id)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>{conv.other_user_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{conv.other_user_name}</p>
                    <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="md:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar>
                  <AvatarFallback>
                    {conversations.find(c => c.id === selectedConversation)?.other_user_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {conversations.find(c => c.id === selectedConversation)?.other_user_name}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>No messages yet</p>
                  <p className="text-sm">Send a message to start the conversation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === user.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.sender_id === user.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {format(new Date(message.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { ConversationList } from '@/components/ConversationList';
import { MessageThread } from '@/components/MessageThread';
import { MessageInput } from '@/components/MessageInput';
import { useSendMessage, useConversations } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const { sendMessage, isLoading: isSending } = useSendMessage();
  const { conversations } = useConversations();

  // Find the selected conversation to show participant info in header
  const selectedConversation = selectedConversationId 
    ? conversations.find(c => c.id === selectedConversationId)
    : null;

  const handleSendMessage = (content: string) => {
    if (!selectedConversationId) return;
    
    sendMessage({
      conversationId: selectedConversationId,
      content,
    });
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

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in to access messages</h2>
          <p className="text-muted-foreground">You need to be authenticated to view and send messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Conversation List */}
      <ConversationList
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedConversationId(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.participant.avatar_url || undefined} />
                  <AvatarFallback>
                    {getInitials(selectedConversation.participant.display_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="font-semibold">
                    {selectedConversation.participant.display_name || 'Unknown User'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {/* You could add online status here if implemented */}
                    Last seen recently
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" disabled>
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled>
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Message Thread */}
            <MessageThread conversationId={selectedConversationId} />

            {/* Message Input */}
            <MessageInput
              onSend={handleSendMessage}
              disabled={isSending}
              placeholder="Type a message..."
            />
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Welcome to Messages</h3>
              <p className="text-sm leading-relaxed">
                Select a conversation from the sidebar to start chatting, or create a new conversation 
                to connect with other members.
              </p>
              <p className="text-xs mt-4 text-muted-foreground/70">
                Your messages are private and secure
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
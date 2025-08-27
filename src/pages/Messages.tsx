import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Video, MoreVertical, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConversationList } from '@/components/ConversationList';
import { MessageThread } from '@/components/MessageThread';
import { MessageInput } from '@/components/MessageInput';
import { useSendMessage, useConversations } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);
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

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsMobileConversationOpen(true);
  };

  const handleBackToList = () => {
    setIsMobileConversationOpen(false);
    setSelectedConversationId(null);
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

  // Mock online status
  const isParticipantOnline = Math.random() > 0.5;

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center max-w-md p-8 rounded-2xl bg-card/50 backdrop-blur-sm border shadow-lg">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-muted-foreground/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Please log in to access messages</h2>
          <p className="text-muted-foreground">You need to be authenticated to view and send messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white dark:bg-[#111b21]">
      {/* Conversation List - Hidden on mobile when conversation is open */}
      <div className={cn(
        "w-full md:w-80 flex-shrink-0 transition-all duration-300 ease-in-out",
        "md:block",
        isMobileConversationOpen ? "hidden" : "block"
      )}>
        <ConversationList
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        "md:flex",
        !isMobileConversationOpen && selectedConversationId ? "hidden md:flex" : "flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-[#f0f2f5] dark:bg-[#202c33] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full"
                    onClick={handleBackToList}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.participant.avatar_url || undefined} />
                      <AvatarFallback className="bg-[#ddd] dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                        {getInitials(selectedConversation.participant.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    {isParticipantOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#25d366] rounded-full border-2 border-[#f0f2f5] dark:border-[#202c33]" />
                    )}
                  </div>
                  
                  <div className="cursor-pointer">
                    <h3 className="font-medium text-[17px] text-gray-900 dark:text-gray-100">
                      {selectedConversation.participant.display_name || 'Unknown User'}
                    </h3>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400">
                      {isParticipantOnline ? 'online' : 'last seen recently'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full h-10 w-10"
                    disabled
                  >
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full h-10 w-10"
                    disabled
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full h-10 w-10"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="flex items-center gap-3 py-3">
                        <Info className="h-4 w-4" />
                        Contact info
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-3 py-3">
                        Select messages
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-3 py-3">
                        Mute notifications
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-3 py-3">
                        Clear messages
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-3 py-3 text-red-600 dark:text-red-400">
                        Delete chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
          <div className="flex-1 flex items-center justify-center bg-[#f0f2f5] dark:bg-[#0b141a] border-l border-gray-200 dark:border-gray-700">
            <div className="text-center max-w-md p-8">
              <div className="relative mb-8">
                {/* WhatsApp-style logo placeholder */}
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-[#25d366]/10 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-[#25d366]/60"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </div>
              </div>
              
              <h3 className="text-[32px] font-light mb-4 text-gray-400 dark:text-gray-500">
                WhatsApp Web
              </h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6 text-[14px]">
                Send and receive messages without keeping your phone online.<br />
                Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Your personal messages are end-to-end encrypted</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRandomTextChat } from '@/hooks/useRandomTextChat';
import { RandomTextChat as RandomTextChatComponent } from '@/components/RandomTextChat';
import { ModernHeader } from '@/components/ModernHeader';

const RandomTextChat = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { chatState, openRandomChat, closeRandomChat } = useRandomTextChat();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    // Auto-open the chat when the page loads
    if (user && !chatState.isOpen) {
      openRandomChat();
    }
  }, [user, authLoading, navigate, chatState.isOpen, openRandomChat]);

  const handleClose = () => {
    closeRandomChat();
    navigate('/'); // Redirect to home when chat is closed
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <ModernHeader />
      
      {/* Background content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-20">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Random Text Chat
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Connect with people from around the world through text conversations
          </p>
          <div className="text-muted-foreground">
            Chat window will open automatically...
          </div>
        </div>
      </div>

      {/* Random Text Chat Component */}
      <RandomTextChatComponent
        isOpen={chatState.isOpen}
        onClose={handleClose}
      />
    </div>
  );
};

export default RandomTextChat;
import React, { useState } from 'react';
import { MessageCircle, Send, X, Users } from 'lucide-react';

const RandomMessaging: React.FC = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const startRandomChat = () => {
    setIsSearching(true);
    // Simulate matching after 2 seconds
    setTimeout(() => {
      setIsSearching(false);
      setIsConnected(true);
    }, 2000);
  };

  const endChat = () => {
    setIsConnected(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-6 h-6" />
          <h2 className="text-lg font-semibold">Random Chat</h2>
        </div>
        
        {isConnected && (
          <button
            onClick={endChat}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="End chat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {!isSearching && !isConnected && (
          // Start screen
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Random Messaging
              </h3>
              
              <p className="text-gray-600 mb-6">
                Connect with random people and have interesting conversations! 
                Chat anonymously with strangers from around the world.
              </p>
              
              <button
                onClick={startRandomChat}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
              >
                Start Random Chat
              </button>
              
              <div className="mt-4 text-sm text-gray-500">
                <p>• Be respectful and kind</p>
                <p>• No inappropriate content</p>
                <p>• Have fun and make friends!</p>
              </div>
            </div>
          </div>
        )}

        {isSearching && (
          // Searching screen
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Looking for a chat partner...</h3>
              <p className="text-gray-600 mb-4">This may take a few moments</p>
            </div>
          </div>
        )}

        {isConnected && (
          // Chat screen
          <>
            <div className="flex-1 p-4">
              <div className="text-center mb-4">
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  You have been matched! Say hello!
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-start">
                  <div className="max-w-xs bg-gray-100 px-4 py-2 rounded-2xl">
                    <p>Hello! How are you?</p>
                    <p className="text-xs text-gray-500 mt-1">2:30 PM</p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <div className="max-w-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-2xl">
                    <p>Hi there! I'm doing great, thanks!</p>
                    <p className="text-xs text-white/70 mt-1">2:31 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Message input */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded-full hover:from-purple-600 hover:to-pink-600 transition-all">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RandomMessaging;
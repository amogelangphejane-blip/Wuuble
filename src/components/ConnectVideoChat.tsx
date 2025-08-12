import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useVideoChat } from '@/hooks/useVideoChat';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  SkipForward, 
  Flag,
  MessageCircle,
  Send,
  Settings,
  Shield,
  Heart,
  UserX,
  MapPin,
  Calendar,
  Sparkles,
  Search,
  X
} from 'lucide-react';

interface UserInfo {
  name: string;
  age: number;
  location: string;
  interests: string[];
  isOnline: boolean;
}

export const ConnectVideoChat = () => {
  const {
    connectionStatus,
    isSearching,
    partnerConnected,
    isVideoEnabled,
    isAudioEnabled,
    localVideoRef,
    remoteVideoRef,
    messages,
    startChat,
    endChat,
    nextPartner,
    sendMessage,
    toggleVideo,
    toggleAudio
  } = useVideoChat({ useMockSignaling: true });

  // UI States
  const [messageInput, setMessageInput] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Mock user data
  const [currentUser] = useState<UserInfo>({
    name: "Alex",
    age: 24,
    location: "New York, USA",
    interests: ["Music", "Travel", "Photography"],
    isOnline: true
  });

  const [partnerUser] = useState<UserInfo>({
    name: "Sarah",
    age: 22,
    location: "London, UK", 
    interests: ["Art", "Coffee", "Books"],
    isOnline: true
  });

  const { toast } = useToast();

  // Touch/Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handleLike();
    }
  };

  const handleNext = () => {
    if (partnerConnected) {
      nextPartner();
      setIsLiked(false);
      setShowUserInfo(true);
      toast({
        title: "Searching for next partner...",
        description: "Swipe right to like, left to skip",
      });
    }
  };

  const handleLike = () => {
    setIsLiked(true);
    toast({
      title: "❤️ Liked!",
      description: "Your interest has been sent",
    });
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && partnerConnected) {
      sendMessage(messageInput);
      setMessageInput('');
    }
  };

  // Auto-hide user info after 5 seconds
  useEffect(() => {
    if (partnerConnected && showUserInfo) {
      const timer = setTimeout(() => {
        setShowUserInfo(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [partnerConnected, showUserInfo]);

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* Background Video Streams */}
      <div className="absolute inset-0">
        {/* Remote Video (Partner) - Full Screen Background */}
        <div className="relative w-full h-full">
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted={false}
          />
          
          {/* Overlay for better contrast */}
          <div className="absolute inset-0 bg-black/10" />
          
          {/* Connection Status Overlay */}
          {isSearching && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 to-pink-600/80 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                <h2 className="text-2xl font-bold mb-2">Finding your next match...</h2>
                <p className="text-lg opacity-90">Connecting you with someone amazing</p>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span className="text-sm">1,247 people online</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Self) - Picture in Picture */}
        <div className="absolute top-4 right-4 w-24 h-32 md:w-32 md:h-40 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl">
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Touch Area for Swipe Gestures */}
      <div
        className="absolute inset-0 z-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Top Bar - User Info Card */}
      {partnerConnected && showUserInfo && (
        <div className="absolute top-4 left-4 right-20 z-20">
          <Card className="bg-black/60 backdrop-blur-md border-white/20 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {partnerUser.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{partnerUser.name}, {partnerUser.age}</h3>
                    <div className="flex items-center space-x-1 text-sm text-white/80">
                      <MapPin className="w-3 h-3" />
                      <span>{partnerUser.location}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUserInfo(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Interests */}
              <div className="flex flex-wrap gap-2 mt-3">
                {partnerUser.interests.map((interest, index) => (
                  <Badge key={index} variant="secondary" className="bg-white/20 text-white border-white/30">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-gradient-to-t from-black/80 to-transparent pt-12 pb-8">
          <div className="flex items-center justify-center space-x-6 px-6">
            
            {/* Report Button */}
            <Button
              variant="ghost"
              size="lg"
              className="w-14 h-14 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
              onClick={() => toast({ title: "User reported", description: "Thank you for keeping our community safe" })}
            >
              <Flag className="w-6 h-6" />
            </Button>

            {/* Audio Toggle */}
            <Button
              variant="ghost"
              size="lg"
              className={`w-14 h-14 rounded-full ${isAudioEnabled ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'} border border-white/30`}
              onClick={toggleAudio}
            >
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>

            {/* End Call */}
            <Button
              variant="ghost"
              size="lg"
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white"
              onClick={endChat}
            >
              <PhoneOff className="w-7 h-7" />
            </Button>

            {/* Video Toggle */}
            <Button
              variant="ghost"
              size="lg"
              className={`w-14 h-14 rounded-full ${isVideoEnabled ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'} border border-white/30`}
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>

            {/* Next Partner */}
            <Button
              variant="ghost"
              size="lg"
              className="w-14 h-14 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
              onClick={handleNext}
            >
              <SkipForward className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Side Action Buttons */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 flex flex-col space-y-4">
        
        {/* Like Button */}
        <Button
          variant="ghost"
          size="lg"
          className={`w-14 h-14 rounded-full ${isLiked ? 'bg-pink-500 text-white' : 'bg-white/20 hover:bg-pink-500/30 text-white'} border border-white/30 transition-all duration-300`}
          onClick={handleLike}
        >
          <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
        </Button>

        {/* Chat Button */}
        <Button
          variant="ghost"
          size="lg"
          className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
          onClick={() => setIsChatVisible(true)}
        >
          <MessageCircle className="w-6 h-6" />
          {messages.length > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
              {messages.length}
            </Badge>
          )}
        </Button>

        {/* Filters Button */}
        <Button
          variant="ghost"
          size="lg"
          className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
          onClick={() => setShowFilters(true)}
        >
          <Settings className="w-6 h-6" />
        </Button>
      </div>

      {/* Swipe Indicators */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center space-x-4 text-white/60 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-pink-500/30 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
            <span>Swipe right to like</span>
          </div>
          <div className="w-px h-4 bg-white/30"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center">
              <SkipForward className="w-4 h-4" />
            </div>
            <span>Swipe left to skip</span>
          </div>
        </div>
      </div>

      {/* Chat Overlay */}
      {isChatVisible && (
        <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-96">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Chat with {partnerUser.name}</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsChatVisible(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 max-h-64 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Start a conversation!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'local' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-2xl ${
                        msg.sender === 'local' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Modal */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Matching Preferences</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Age Range</label>
              <div className="flex items-center space-x-2 mt-1">
                <Input placeholder="18" className="w-20" />
                <span>-</span>
                <Input placeholder="35" className="w-20" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input placeholder="Worldwide" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Interests</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Music", "Travel", "Sports", "Art", "Food", "Movies"].map((interest) => (
                  <Badge key={interest} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
            <Button className="w-full">Apply Filters</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
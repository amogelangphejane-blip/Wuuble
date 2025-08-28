import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useVideoChat } from '@/hooks/useVideoChat';
import { VideoFilterService, FilterCategory } from '@/services/videoFilterService';
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
  X,
  Volume2,
  VolumeX,
  Sun,
  Contrast,
  Smile
} from 'lucide-react';

interface UserPreferences {
  ageRange: string;
  interests: string[];
  location: string;
  language: string;
  videoFilters: {
    enabled: boolean;
    preset: string;
    customSettings: {
      skinSmoothing: number;
      brightness: number;
    };
  };
}

interface UserInfo {
  name: string;
  age: number;
  location: string;
  interests: string[];
  isOnline: boolean;
}

export const VideoChat = () => {
  const {
    connectionStatus,
    connectionQuality,
    isSearching,
    partnerConnected,
    cameraPermission,
    isVideoEnabled,
    isAudioEnabled,
    isRemoteAudioEnabled,
    localVideoRef,
    remoteVideoRef,
    messages,
    unreadMessages,
    isVideoFiltersEnabled,
    filterConfig,
    startChat,
    endChat,
    nextPartner,
    sendMessage,
    toggleVideo,
    toggleAudio,
    toggleRemoteAudio,
    markMessagesAsRead,
    toggleVideoFilters,
    updateFilterConfig,
    setFilterPreset,
    toggleIndividualFilter,
    updateFilterIntensity
  } = useVideoChat({ 
    useSocketIOSignaling: true,
    useMockSignaling: false,
    autoConnect: true
  });

  // UI States
  const [messageInput, setMessageInput] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showVideoFilters, setShowVideoFilters] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [onlineUsers] = useState(1247);

  // User preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    ageRange: '18-25',
    interests: [],
    location: 'global',
    language: 'en',
    videoFilters: {
      enabled: false,
      preset: 'light',
      customSettings: {
        skinSmoothing: 30,
        brightness: 5
      }
    }
  });

  // Report states
  const [reportReason, setReportReason] = useState<'inappropriate_behavior' | 'harassment' | 'spam' | 'underage' | 'fake_profile' | 'other'>('inappropriate_behavior');
  const [reportDescription, setReportDescription] = useState('');

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

  // Load filter preferences on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('videoChat_preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        if (parsed.videoFilters) {
          setPreferences(prev => ({
            ...prev,
            videoFilters: parsed.videoFilters
          }));
          
          // Apply saved filter settings
          if (parsed.videoFilters.enabled) {
            setFilterPreset(parsed.videoFilters.preset);
          }
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    }
  }, [setFilterPreset]);

  // Save filter preferences when they change
  useEffect(() => {
    const savePreferences = () => {
      localStorage.setItem('videoChat_preferences', JSON.stringify(preferences));
    };
    
    const timeoutId = setTimeout(savePreferences, 500); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [preferences]);

  // Update preferences when filter settings change
  useEffect(() => {
    if (filterConfig) {
      setPreferences(prev => ({
        ...prev,
        videoFilters: {
          ...prev.videoFilters,
          enabled: isVideoFiltersEnabled,
          customSettings: {
            skinSmoothing: filterConfig.skinSmoothing?.intensity || 0,
            brightness: filterConfig.brightness?.value || 0
          }
        }
      }));
    }
  }, [isVideoFiltersEnabled, filterConfig]);

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

    if (isLeftSwipe && partnerConnected) {
      handleNext();
    } else if (isRightSwipe && partnerConnected) {
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

  const handleReport = () => {
    setShowReportDialog(true);
  };

  const submitReport = () => {
    toast({
      title: "User Reported",
      description: "Thank you for helping keep our community safe. This user has been reported.",
    });
    
    setShowReportDialog(false);
    setReportDescription('');
    endChat();
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

  // Handle chat visibility and mark messages as read
  useEffect(() => {
    if (isChatVisible) {
      markMessagesAsRead();
    }
  }, [isChatVisible, markMessagesAsRead]);

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* Background Video Streams */}
      <div className="absolute inset-0">
        {/* Remote Video (Partner) - Full Screen Background */}
        <div className="relative w-full h-full">
          {partnerConnected ? (
            <>
              <video
                ref={remoteVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted={!isRemoteAudioEnabled}
              />
              
              {/* Overlay for better contrast */}
              <div className="absolute inset-0 bg-black/10" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 to-pink-600/80 flex items-center justify-center">
              <div className="text-center text-white">
                {cameraPermission === 'denied' ? (
                  <>
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Camera Access Required</h2>
                    <p className="text-lg opacity-90 mb-6">To start video chatting, please allow camera access</p>
                    <Button
                      onClick={startChat}
                      size="lg"
                      className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-full border border-white/30"
                    >
                      <Video className="w-5 h-5 mr-2" />
                      Try Again
                    </Button>
                  </>
                ) : cameraPermission === 'pending' ? (
                  <>
                    <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold mb-2">Setting up camera...</h2>
                    <p className="text-lg opacity-90">Please allow access when prompted</p>
                  </>
                ) : isSearching ? (
                  <>
                    <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold mb-2">Finding your next match...</h2>
                    <p className="text-lg opacity-90">Connecting you with someone amazing</p>
                    <div className="mt-4 flex items-center justify-center space-x-2">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      <span className="text-sm">{onlineUsers.toLocaleString()} people online</span>
                    </div>
                    
                    {/* Settings Button - Available while searching */}
                    <div className="mt-6">
                      <Button
                        onClick={() => setShowFilters(true)}
                        variant="outline"
                        size="sm"
                        className="bg-white/10 hover:bg-white/20 text-white border-white/30 px-6 py-2 rounded-full transition-all duration-300"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Adjust Preferences
                      </Button>
                    </div>
                  </>
                ) : connectionStatus === 'reconnecting' ? (
                  <>
                    <div className="animate-spin w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold mb-2">Reconnecting...</h2>
                    <p className="text-lg opacity-90">Attempting to reconnect...</p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Video className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Ready to meet someone new?</h2>
                    <p className="text-lg opacity-90 mb-6">Tap the button below to start chatting</p>
                    <div className="flex flex-col items-center space-y-4">
                      <Button
                        onClick={startChat}
                        disabled={isSearching}
                        size="lg"
                        className="bg-white/20 hover:bg-white/30 text-white font-semibold px-12 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 border border-white/30"
                      >
                        {isSearching ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Video className="w-5 h-5 mr-3" />
                            Start Chatting
                          </>
                        )}
                      </Button>
                      
                      {/* Settings Button - Always visible */}
                      <Button
                        onClick={() => setShowFilters(true)}
                        variant="outline"
                        size="lg"
                        className="bg-white/10 hover:bg-white/20 text-white border-white/30 px-8 py-3 rounded-full transition-all duration-300"
                      >
                        <Settings className="w-5 h-5 mr-2" />
                        Preferences & Filters
                      </Button>
                    </div>
                  </>
                )}
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
          {cameraPermission === 'denied' && (
            <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Touch Area for Swipe Gestures */}
      {partnerConnected && (
        <div
          className="absolute inset-0 z-10"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      )}

      {/* Settings Button - Always accessible when not connected */}
      {!partnerConnected && (
        <div className="absolute top-4 left-4 z-20 flex space-x-2">
          <Button
            onClick={() => setShowFilters(true)}
            variant="ghost"
            size="lg"
            className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all duration-300"
          >
            <Settings className="w-6 h-6" />
          </Button>
          
          <Button
            onClick={() => setShowVideoFilters(true)}
            variant="ghost"
            size="lg"
            className={`w-14 h-14 rounded-full ${isVideoFiltersEnabled ? 'bg-purple-500/30 text-purple-300' : 'bg-white/20 hover:bg-white/30 text-white'} border border-white/30 transition-all duration-300`}
          >
            <Sparkles className="w-6 h-6" />
          </Button>
        </div>
      )}

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
            {partnerConnected && (
              <Button
                variant="ghost"
                size="lg"
                className="w-14 h-14 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                onClick={handleReport}
              >
                <Flag className="w-6 h-6" />
              </Button>
            )}

            {/* Audio Toggle */}
            <Button
              variant="ghost"
              size="lg"
              className={`w-14 h-14 rounded-full ${isAudioEnabled ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'} border border-white/30`}
              onClick={toggleAudio}
            >
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>

            {/* End Call / Start Call */}
            {partnerConnected ? (
              <Button
                variant="ghost"
                size="lg"
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white"
                onClick={endChat}
              >
                <PhoneOff className="w-7 h-7" />
              </Button>
            ) : (
              <Button
                onClick={startChat}
                disabled={isSearching || cameraPermission === 'pending'}
                size="lg"
                className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 border-0"
              >
                {isSearching ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Video className="w-7 h-7" />
                )}
              </Button>
            )}

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
            {partnerConnected && (
              <Button
                variant="ghost"
                size="lg"
                className="w-14 h-14 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                onClick={handleNext}
              >
                <SkipForward className="w-6 h-6" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Side Action Buttons */}
      {partnerConnected && (
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
            {unreadMessages > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                {unreadMessages}
              </Badge>
            )}
          </Button>

          {/* Remote Audio Toggle */}
          <Button
            variant="ghost"
            size="lg"
            className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
            onClick={toggleRemoteAudio}
          >
            {isRemoteAudioEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </Button>

          {/* Video Filters Toggle */}
          <Button
            variant="ghost"
            size="lg"
            className={`w-14 h-14 rounded-full ${isVideoFiltersEnabled ? 'bg-purple-500/30 text-purple-300' : 'bg-white/20 hover:bg-white/30 text-white'} border border-white/30`}
            onClick={() => setShowVideoFilters(true)}
          >
            <Sparkles className="w-6 h-6" />
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
      )}

      {/* Swipe Indicators */}
      {partnerConnected && (
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
      )}

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
            
            <ScrollArea className="p-4 max-h-64">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Start a conversation!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-2xl ${
                        message.isOwn 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {message.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
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

      {/* Settings Modal */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Video Chat Settings</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Matching Preferences Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Matching Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Age Range</label>
                  <Select
                    value={preferences.ageRange}
                    onValueChange={(value) => 
                      setPreferences(prev => ({ ...prev, ageRange: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18-25">18-25</SelectItem>
                      <SelectItem value="26-35">26-35</SelectItem>
                      <SelectItem value="36-45">36-45</SelectItem>
                      <SelectItem value="46+">46+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Select
                    value={preferences.location}
                    onValueChange={(value) => 
                      setPreferences(prev => ({ ...prev, location: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="country">Same Country</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Language</label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) => 
                      setPreferences(prev => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                    </SelectContent>
                  </Select>
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
              </CardContent>
            </Card>

            {/* Video Filters Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Video Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Master Filter Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="settings-filters-toggle" className="text-sm font-medium">
                      Enable Video Filters
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Apply beauty and enhancement filters to your video
                    </p>
                  </div>
                  <Switch
                    id="settings-filters-toggle"
                    checked={isVideoFiltersEnabled}
                    onCheckedChange={toggleVideoFilters}
                  />
                </div>

                {/* Quick Filter Controls */}
                {isVideoFiltersEnabled && filterConfig && (
                  <div className="space-y-4 pt-2 border-t">
                    {/* Smooth Skin Filter */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Smile className="w-4 h-4" />
                        <Label className="text-sm">Smooth Skin</Label>
                      </div>
                      <Switch
                        checked={filterConfig.skinSmoothing?.enabled || false}
                        onCheckedChange={() => toggleIndividualFilter('skinSmoothing')}
                      />
                    </div>

                    {/* Brightness Filter */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sun className="w-4 h-4" />
                        <Label className="text-sm">Brightness</Label>
                      </div>
                      <Switch
                        checked={filterConfig.brightness?.enabled || false}
                        onCheckedChange={() => toggleIndividualFilter('brightness')}
                      />
                    </div>

                    {/* Contrast Filter */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Contrast className="w-4 h-4" />
                        <Label className="text-sm">Contrast</Label>
                      </div>
                      <Switch
                        checked={filterConfig.contrast?.enabled || false}
                        onCheckedChange={() => toggleIndividualFilter('contrast')}
                      />
                    </div>

                    {/* Advanced Settings Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowFilters(false);
                        setShowVideoFilters(true);
                      }}
                      className="w-full"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Advanced Filter Settings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(false)}
              >
                Close
              </Button>
              <Button onClick={() => setShowFilters(false)}>
                Apply Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report User Modal */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <Flag className="w-5 h-5" />
              <span>Report User</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for reporting</Label>
              <Select
                value={reportReason}
                onValueChange={(value: any) => setReportReason(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inappropriate_behavior">Inappropriate Behavior</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="underage">Underage User</SelectItem>
                  <SelectItem value="fake_profile">Fake Profile</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Additional details (optional)</Label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Please provide any additional details that might help us investigate..."
                className="w-full min-h-[100px] p-3 border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Your safety is our priority</p>
                  <p className="text-yellow-700 mt-1">
                    All reports are reviewed by our moderation team. False reports may result in account restrictions.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReportDialog(false);
                  setReportDescription('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={submitReport}
                className="flex items-center space-x-2"
              >
                <Flag className="w-4 h-4" />
                <span>Submit Report</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Filters Dialog */}
      <Dialog open={showVideoFilters} onOpenChange={setShowVideoFilters}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>Video Filters</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Master Filter Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="filters-toggle" className="text-sm font-medium">
                  Enable Video Filters
                </Label>
                <p className="text-xs text-muted-foreground">
                  Apply beauty and enhancement filters to your video
                </p>
              </div>
              <Switch
                id="filters-toggle"
                checked={isVideoFiltersEnabled}
                onCheckedChange={toggleVideoFilters}
              />
            </div>

            {/* Quick Presets */}
            {isVideoFiltersEnabled && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Quick Presets</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(VideoFilterService.getPresets()).map(([key, preset]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterPreset(key)}
                      className={
                        (key === 'none' && !isVideoFiltersEnabled) ||
                        (key !== 'none' && filterConfig?.skinSmoothing?.intensity === preset.config.skinSmoothing.intensity)
                          ? 'border-primary bg-primary/5' 
                          : ''
                      }
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Categories */}
            {isVideoFiltersEnabled && filterConfig && (
              <div className="space-y-6">
                {VideoFilterService.getFilterCategories().map((category) => (
                  <Card key={category.name} className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center space-x-2">
                        {category.name === 'Beauty Filters' && <Smile className="w-4 h-4" />}
                        {category.name === 'Lighting & Color' && <Sun className="w-4 h-4" />}
                        <span>{category.name}</span>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{category.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {category.filters.map((filterType) => {
                        const isEnabled = filterConfig[filterType as keyof typeof filterConfig]?.enabled || false;
                        const intensity = filterType === 'skinSmoothing' 
                          ? filterConfig.skinSmoothing?.intensity || 0
                          : filterType === 'brightness'
                          ? filterConfig.brightness?.value || 0
                          : filterConfig.contrast?.value || 0;
                        
                        return (
                          <div key={filterType} className="space-y-3">
                            {/* Individual Filter Toggle */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {filterType === 'skinSmoothing' && <Smile className="w-4 h-4" />}
                                {filterType === 'brightness' && <Sun className="w-4 h-4" />}
                                {filterType === 'contrast' && <Contrast className="w-4 h-4" />}
                                <Label className="text-sm">
                                  {filterType === 'skinSmoothing' ? 'Smooth Skin' : 
                                   filterType === 'brightness' ? 'Brightness' : 
                                   'Contrast'}
                                </Label>
                              </div>
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={() => toggleIndividualFilter(filterType as keyof typeof filterConfig)}
                              />
                            </div>

                            {/* Intensity Slider */}
                            {isEnabled && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs text-muted-foreground">
                                    {filterType === 'skinSmoothing' ? 'Smoothing Intensity' : 
                                     filterType === 'brightness' ? 'Brightness Level' : 
                                     'Contrast Level'}
                                  </Label>
                                  <span className="text-xs text-muted-foreground">
                                    {intensity}{filterType === 'skinSmoothing' ? '%' : ''}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min={filterType === 'skinSmoothing' ? "0" : "-50"}
                                  max={filterType === 'skinSmoothing' ? "100" : "50"}
                                  value={intensity}
                                  onChange={(e) => updateFilterIntensity(
                                    filterType as keyof typeof filterConfig, 
                                    parseInt(e.target.value)
                                  )}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowVideoFilters(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Safety Notice */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 text-center text-xs text-white/60 max-w-md mx-auto leading-relaxed">
        <span className="font-medium">18+ only.</span> Keep it friendly and report any inappropriate behavior.
      </div>
    </div>
  );
};

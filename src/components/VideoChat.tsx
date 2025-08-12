import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useVideoChat } from '@/hooks/useVideoChat';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  SkipForward, 
  Flag,
  Users,
  MessageCircle,
  Send,
  Settings,
  Shield,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  UserX,
  Heart,
  MoreVertical
} from 'lucide-react';

interface UserPreferences {
  ageRange: string;
  interests: string[];
  location: string;
  language: string;
}

export const VideoChat = () => {
  // Use the video chat hook
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
    startChat,
    endChat,
    nextPartner,
    sendMessage,
    toggleVideo,
    toggleAudio,
    toggleRemoteAudio,
    markMessagesAsRead,
    getConnectionQualityIcon,
    getConnectionQualityText
  } = useVideoChat({ useMockSignaling: true });

  // UI states
  const [messageInput, setMessageInput] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [onlineUsers] = useState(1247);
  
  // User preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    ageRange: '18-25',
    interests: [],
    location: 'global',
    language: 'en'
  });
  
  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  // Auto-scroll chat messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle chat visibility and mark messages as read
  useEffect(() => {
    if (isChatVisible) {
      markMessagesAsRead();
    }
  }, [isChatVisible, markMessagesAsRead]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    sendMessage(messageInput);
    setMessageInput('');
  };

  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState<'inappropriate_behavior' | 'harassment' | 'spam' | 'underage' | 'fake_profile' | 'other'>('inappropriate_behavior');
  const [reportDescription, setReportDescription] = useState('');

  const handleReport = () => {
    setShowReportDialog(true);
  };

  const submitReport = () => {
    // In a real app, you would use the safetyService here
    // safetyService.reportUser(currentUserId, partnerId, reportReason, reportDescription);
    
    toast({
      title: "User Reported",
      description: "Thank you for helping keep our community safe. This user has been reported.",
    });
    
    setShowReportDialog(false);
    setReportDescription('');
    endChat();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const renderConnectionQualityIcon = () => {
    switch (connectionQuality) {
      case 'excellent':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'good':
        return <Wifi className="w-4 h-4 text-yellow-500" />;
      case 'poor':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex flex-col">
      {/* Enhanced Header with connection status and controls */}
      <header className="bg-card/30 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Video className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Inner Circle
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Connection Quality Indicator */}
            {partnerConnected && (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-card/50 border border-border/50">
                {renderConnectionQualityIcon()}
                <span className="text-sm font-medium hidden sm:inline">
                  {getConnectionQualityText()}
                </span>
              </div>
            )}
            
            {/* Online Users */}
            <Badge variant="secondary" className="flex items-center space-x-2 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="font-medium">{onlineUsers.toLocaleString()} online</span>
            </Badge>

            {/* Settings Button */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-10 h-10 rounded-full p-0">
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Chat Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fullscreen">Fullscreen Mode</Label>
                    <Switch
                      id="fullscreen"
                      checked={isFullscreen}
                      onCheckedChange={toggleFullscreen}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="preferences">Chat Preferences</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreferences(true)}
                    >
                      Configure
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content - Enhanced layout with chat */}
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Video Section */}
        <div className="flex-1 flex flex-col p-4 space-y-4">
          {/* Video Container */}
          <div className="flex-1 flex flex-col lg:flex-row gap-4">
            {/* Partner Video */}
            <div className="flex-1 lg:flex-[2]">
              <Card className="relative overflow-hidden bg-gradient-card border-video-border shadow-video rounded-2xl h-full min-h-[300px] lg:min-h-[500px]">
                <div className="absolute inset-0 bg-video-bg">
                  {partnerConnected ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      muted={!isRemoteAudioEnabled}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="text-center">
                      {connectionStatus === 'reconnecting' ? (
                        <>
                          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                          <p className="text-lg text-muted-foreground font-medium">Reconnecting...</p>
                          <p className="text-sm text-muted-foreground/70 mt-2">Attempting to reconnect...</p>
                        </>
                      ) : isSearching ? (
                          <>
                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                            <p className="text-lg text-muted-foreground font-medium">Finding someone awesome...</p>
                            <p className="text-sm text-muted-foreground/70 mt-2">This will only take a moment</p>
                          </>
                        ) : (
                          <>
                            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                              <Users className="w-10 h-10 text-white" />
                            </div>
                            <p className="text-lg text-foreground font-medium mb-2">Ready to meet someone new?</p>
                            <p className="text-sm text-muted-foreground">Tap the button below to start chatting</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Partner Video Controls */}
                  {partnerConnected && (
                    <>
                      <div className="absolute top-4 left-4 flex items-center space-x-2">
                        <Badge className="bg-gradient-primary text-white border-0 shadow-lg">
                          Chat Partner
                        </Badge>
                        {connectionStatus === 'reconnecting' && (
                          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                            Reconnecting...
                          </Badge>
                        )}
                      </div>
                      <div className="absolute top-4 right-4 flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={toggleRemoteAudio}
                          className="w-8 h-8 rounded-full p-0 bg-black/30 hover:bg-black/50"
                        >
                          {isRemoteAudioEnabled ? 
                            <Volume2 className="w-4 h-4 text-white" /> : 
                            <VolumeX className="w-4 h-4 text-white" />
                          }
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={toggleFullscreen}
                          className="w-8 h-8 rounded-full p-0 bg-black/30 hover:bg-black/50"
                        >
                          {isFullscreen ? 
                            <Minimize className="w-4 h-4 text-white" /> : 
                            <Maximize className="w-4 h-4 text-white" />
                          }
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>

            {/* Local Video */}
            <div className="lg:flex-1 lg:max-w-sm">
              <Card className="relative overflow-hidden bg-gradient-card border-video-border shadow-video rounded-2xl h-64 lg:h-full">
                <div className="absolute inset-0 bg-video-bg">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!isVideoEnabled && (
                    <div className="absolute inset-0 bg-muted flex items-center justify-center">
                      <VideoOff className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="text-xs font-medium">
                      You
                    </Badge>
                  </div>
                  {cameraPermission === 'denied' && (
                    <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                      <div className="text-center">
                                                 <Shield className="w-8 h-8 text-destructive mx-auto mb-2" />
                         <p className="text-sm text-destructive font-medium">Camera Blocked</p>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={startChat}
                           className="mt-2"
                         >
                           Enable
                         </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Control Panel */}
          <div className="flex flex-col items-center space-y-4">
            {/* Primary Actions */}
            <div className="flex items-center justify-center">
              {connectionStatus === 'disconnected' && cameraPermission !== 'denied' ? (
                <Button
                  onClick={startChat}
                  disabled={isSearching || cameraPermission !== 'granted'}
                  size="lg"
                  className="bg-gradient-primary hover:shadow-glow text-white font-semibold px-12 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 border-0"
                >
                  {isSearching ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Connecting...
                    </>
                  ) : cameraPermission === 'pending' ? (
                    'Getting Ready...'
                  ) : (
                    <>
                      <Video className="w-5 h-5 mr-3" />
                      Start Chatting
                    </>
                  )}
                </Button>
              ) : cameraPermission === 'denied' ? (
                <Button
                  onClick={startChat}
                  size="lg"
                  className="bg-gradient-primary hover:shadow-glow text-white font-semibold px-12 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 border-0"
                >
                  <Video className="w-5 h-5 mr-3" />
                  Enable Camera
                </Button>
              ) : connectionStatus === 'connected' || connectionStatus === 'reconnecting' ? (
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={nextPartner}
                    size="lg"
                    disabled={connectionStatus === 'reconnecting'}
                    className="bg-gradient-primary hover:shadow-glow text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 border-0"
                  >
                    <SkipForward className="w-5 h-5 mr-2" />
                    Next
                  </Button>
                  <Button
                    onClick={endChat}
                    variant="destructive"
                    size="lg"
                    className="font-semibold px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105"
                  >
                    <PhoneOff className="w-5 h-5 mr-2" />
                    End
                  </Button>
                </div>
              ) : null}
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center justify-center space-x-3 flex-wrap">
              <Button
                variant={isVideoEnabled ? "secondary" : "destructive"}
                size="lg"
                onClick={toggleVideo}
                className="w-12 h-12 rounded-full p-0 transition-all duration-200 hover:scale-110"
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>

              <Button
                variant={isAudioEnabled ? "secondary" : "destructive"}
                size="lg"
                onClick={toggleAudio}
                className="w-12 h-12 rounded-full p-0 transition-all duration-200 hover:scale-110"
              >
                {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>

              {connectionStatus === 'connected' && (
                <>
                  <Button
                    onClick={() => setIsChatVisible(!isChatVisible)}
                    variant="outline"
                    size="lg"
                    className="w-12 h-12 rounded-full p-0 transition-all duration-200 hover:scale-110 relative"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {unreadMessages > 0 && (
                      <Badge className="absolute -top-2 -right-2 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                        {unreadMessages}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    onClick={handleReport}
                    variant="outline"
                    size="lg"
                    className="w-12 h-12 rounded-full p-0 transition-all duration-200 hover:scale-110 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Flag className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>

            {/* Safety Notice */}
            <div className="text-center text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              <span className="font-medium">18+ only.</span> Keep it friendly and report any inappropriate behavior.
              <br />
              <span className="text-muted-foreground/70">Your safety is our priority.</span>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {isChatVisible && connectionStatus === 'connected' && (
          <div className="w-full lg:w-80 bg-card/50 border-l border-border/50 flex flex-col">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-semibold flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsChatVisible(false);
                }}
                className="w-8 h-8 rounded-full p-0"
              >
                ×
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-4" ref={chatContainerRef}>
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Start typing to send a message!
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                          message.isOwn
                            ? 'bg-gradient-primary text-white rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                        }`}
                      >
                        <p>{message.text}</p>
                        <p className={`text-xs mt-1 opacity-70 ${
                          message.isOwn ? 'text-white/70' : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border/50">
              <div className="flex space-x-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  size="sm"
                  className="px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* User Preferences Modal */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chat Preferences</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Age Range</Label>
              <Select
                value={preferences.ageRange}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, ageRange: value }))
                }
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={preferences.location}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, location: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="country">Same Country</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={preferences.language}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, language: value }))
                }
              >
                <SelectTrigger>
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

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowPreferences(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowPreferences(false);
                  toast({
                    title: "Preferences Updated",
                    description: "Your chat preferences have been saved.",
                  });
                }}
              >
                Save Changes
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
    </div>
  );
};
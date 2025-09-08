import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { MessageInput } from '@/components/MessageInput';
import { useRandomChat } from '@/hooks/useRandomChat';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  SkipForward, 
  MessageCircle,
  Settings,
  Users,
  Heart,
  Flag,
  Shield,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface UserPreferences {
  ageRange: [number, number];
  interests: string[];
  language: string;
}

const RandomChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Initialize random chat hook
  const {
    connectionStatus,
    connectionQuality,
    isSearching,
    partnerConnected,
    queueStatus,
    currentRoomId,
    partnerId,
    localVideoRef,
    remoteVideoRef,
    isVideoEnabled,
    isAudioEnabled,
    isRemoteAudioEnabled,
    messages,
    unreadMessages,
    startSearch,
    endChat,
    nextPartner,
    sendMessage,
    toggleVideo,
    toggleAudio,
    toggleRemoteAudio,
    reportUser
  } = useRandomChat();

  // UI states
  const [messageInput, setMessageInput] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [onlineUsers] = useState(1247); // Mock for now
  
  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    ageRange: [18, 99],
    interests: [],
    language: 'any'
  });
  
  // Report state
  const [reportReason, setReportReason] = useState('inappropriate_behavior');
  const [reportDescription, setReportDescription] = useState('');

  // Auto-start search when component mounts and user is authenticated
  useEffect(() => {
    if (user && connectionStatus === 'disconnected') {
      console.log('Auto-starting random chat search...');
      handleStartSearch();
    }
  }, [user, connectionStatus]);

  const handleStartSearch = async () => {
    try {
      await startSearch(preferences);
    } catch (error) {
      console.error('Failed to start search:', error);
      toast({
        title: "Connection failed",
        description: "Unable to connect to the chat service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = (content: string) => {
    if (!currentRoomId) return;
    
    try {
      sendMessage(content);
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Message failed",
        description: "Unable to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNextPartner = () => {
    try {
      nextPartner();
      toast({
        title: "Finding new partner",
        description: "Looking for your next chat partner...",
      });
    } catch (error) {
      console.error('Failed to find next partner:', error);
      toast({
        title: "Error",
        description: "Unable to find next partner. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEndChat = () => {
    try {
      endChat();
    } catch (error) {
      console.error('Failed to end chat:', error);
    }
  };

  const handleReport = async () => {
    if (!partnerId) return;
    
    try {
      await reportUser(partnerId, reportReason, reportDescription);
      setShowReport(false);
      setReportDescription('');
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe.",
      });
    } catch (error) {
      console.error('Failed to submit report:', error);
      toast({
        title: "Report failed",
        description: "Unable to submit report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
      case 'reconnecting':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'disconnected':
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return partnerConnected ? 'Connected to partner' : 'Connected to server';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };

  // Render authentication required state
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <Card className="w-full max-w-md mx-4 text-center">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <Shield className="h-6 w-6" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please sign in to start chatting with random people.
            </p>
            <Button onClick={() => window.location.href = '/auth'} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getConnectionStatusIcon()}
              <span className="text-white text-sm font-medium">
                {getConnectionStatusText()}
              </span>
            </div>
            {connectionQuality && (
              <Badge variant={connectionQuality === 'excellent' ? 'default' : 
                              connectionQuality === 'good' ? 'secondary' : 'destructive'}>
                {connectionQuality}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-white border-white/20">
              <Users className="h-3 w-3 mr-1" />
              {onlineUsers} online
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreferences(true)}
              className="text-white hover:bg-white/20"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="relative w-full h-full">
        {/* Remote Video (Partner) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          muted={!isRemoteAudioEnabled}
        />
        
        {/* Local Video (Self) - Picture in Picture */}
        <div className="absolute top-20 right-4 w-32 h-48 bg-black rounded-lg overflow-hidden border-2 border-white/20">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Chat Messages Overlay */}
        {isChatVisible && messages.length > 0 && (
          <div className="absolute left-4 bottom-24 w-80 max-w-[calc(100vw-2rem)] bg-black/70 backdrop-blur-sm rounded-lg p-3">
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {messages.slice(-10).map((message, index) => (
                  <div
                    key={index}
                    className={`text-sm ${
                      message.isOwn ? 'text-blue-300' : 'text-white'
                    }`}
                  >
                    <span className="font-medium">
                      {message.isOwn ? 'You' : 'Partner'}:
                    </span>{' '}
                    {message.text}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Connection Status Overlay */}
        {isSearching && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <Card className="w-full max-w-md mx-4 text-center">
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {queueStatus ? 'In Queue' : 'Searching...'}
                    </h3>
                    {queueStatus ? (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Position: {queueStatus.position}</p>
                        <p>Estimated wait: {queueStatus.estimatedWaitTime}s</p>
                        <p>{queueStatus.message}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Looking for a chat partner...
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-4">
        {/* Message Input */}
        {partnerConnected && (
          <div className="mb-4">
            <MessageInput
              onSend={handleSendMessage}
              placeholder="Type a message..."
              disabled={!partnerConnected}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
        )}
        
        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          {/* Video Toggle */}
          <Button
            variant={isVideoEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full h-14 w-14"
          >
            {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </Button>

          {/* Audio Toggle */}
          <Button
            variant={isAudioEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleAudio}
            className="rounded-full h-14 w-14"
          >
            {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>

          {/* End/Skip Buttons */}
          {partnerConnected ? (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={handleNextPartner}
                className="rounded-full h-14 w-14 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <SkipForward className="h-6 w-6" />
              </Button>
              
              <Button
                variant="destructive"
                size="lg"
                onClick={handleEndChat}
                className="rounded-full h-14 w-14"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="lg"
              onClick={handleStartSearch}
              disabled={isSearching}
              className="rounded-full h-14 w-14"
            >
              {isSearching ? <Loader2 className="h-6 w-6 animate-spin" /> : <Video className="h-6 w-6" />}
            </Button>
          )}

          {/* Chat Toggle */}
          <Button
            variant={isChatVisible ? "default" : "outline"}
            size="lg"
            onClick={() => setIsChatVisible(!isChatVisible)}
            className="rounded-full h-14 w-14 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <MessageCircle className="h-6 w-6" />
            {unreadMessages > 0 && (
              <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 text-xs">
                {unreadMessages}
              </Badge>
            )}
          </Button>

          {/* Remote Audio Toggle */}
          <Button
            variant={isRemoteAudioEnabled ? "default" : "outline"}
            size="lg"
            onClick={toggleRemoteAudio}
            className="rounded-full h-14 w-14 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {isRemoteAudioEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>

          {/* Report Button */}
          {partnerConnected && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowReport(true)}
              className="rounded-full h-14 w-14 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Flag className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>

      {/* Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chat Preferences</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>Age Range</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={preferences.ageRange[0]}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    ageRange: [parseInt(e.target.value) || 18, prev.ageRange[1]]
                  }))}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={preferences.ageRange[1]}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    ageRange: [prev.ageRange[0], parseInt(e.target.value) || 99]
                  }))}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <Label>Language</Label>
              <Select
                value={preferences.language}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Language</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPreferences(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowPreferences(false)}>
                Save Preferences
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="mt-2">
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
            
            <div>
              <Label>Description (Optional)</Label>
              <Input
                placeholder="Additional details..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReport(false)}>
                Cancel
              </Button>
              <Button onClick={handleReport} variant="destructive">
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RandomChat;
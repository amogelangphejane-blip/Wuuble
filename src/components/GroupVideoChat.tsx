import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useGroupVideoChat, UseGroupVideoChatOptions } from '@/hooks/useGroupVideoChat';
import { GroupParticipant } from '@/services/groupWebRTCService';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  MessageCircle,
  Send,
  Settings,
  Shield,
  Users,
  Monitor,
  MonitorOff,
  MoreVertical,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  UserMinus,
  Crown,
  X,
  Copy,
  Share
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface GroupVideoChatProps extends UseGroupVideoChatOptions {
  onExit?: () => void;
  className?: string;
}

interface ParticipantVideoProps {
  participant: GroupParticipant;
  stream: MediaStream | null;
  isLocal?: boolean;
  isScreenShare?: boolean;
  isFocused?: boolean;
  onFocus?: () => void;
  onParticipantAction?: (action: string, participantId: string) => void;
  canManageParticipants?: boolean;
}

const ParticipantVideo: React.FC<ParticipantVideoProps> = ({
  participant,
  stream,
  isLocal = false,
  isScreenShare = false,
  isFocused = false,
  onFocus,
  onParticipantAction,
  canManageParticipants = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const getGridItemClass = (totalParticipants: number) => {
    if (totalParticipants === 1) return "col-span-2 row-span-2";
    if (totalParticipants === 2) return "col-span-1 row-span-2";
    if (totalParticipants <= 4) return "col-span-1 row-span-1";
    return "col-span-1 row-span-1";
  };

  const handleParticipantAction = (action: string) => {
    onParticipantAction?.(action, participant.id);
  };

  return (
    <div 
      className={`
        relative bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition-all duration-200
        ${isFocused ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-gray-400'}
        ${isScreenShare ? 'col-span-2' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onFocus}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted={isLocal}
      />

      {/* Video Disabled Overlay */}
      {!participant.isVideoEnabled && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="text-center">
            <Avatar className="w-16 h-16 mx-auto mb-2">
              <AvatarImage src={participant.avatarUrl} alt={participant.displayName} />
              <AvatarFallback className="text-2xl">
                {participant.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <VideoOff className="w-6 h-6 text-gray-400 mx-auto" />
          </div>
        </div>
      )}

      {/* Screen Share Indicator */}
      {isScreenShare && (
        <div className="absolute top-2 left-2 bg-blue-500/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          <Monitor className="w-3 h-3" />
          Screen Share
        </div>
      )}

      {/* Participant Info Overlay */}
      <div className={`
        absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 transition-opacity duration-200
        ${isHovered || !participant.isVideoEnabled ? 'opacity-100' : 'opacity-0'}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-white font-medium text-sm truncate">
              {participant.displayName} {isLocal && '(You)'}
            </span>
            
            {/* Role Badge */}
            {participant.role !== 'participant' && (
              <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-200 border-yellow-400/30">
                {participant.role === 'host' && <Crown className="w-3 h-3 mr-1" />}
                {participant.role}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Audio Status */}
            {!participant.isAudioEnabled && (
              <div className="w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Connection Quality */}
            <div className={`w-2 h-2 rounded-full ${
              participant.connectionQuality === 'excellent' ? 'bg-green-500' :
              participant.connectionQuality === 'good' ? 'bg-yellow-500' :
              participant.connectionQuality === 'poor' ? 'bg-orange-500' :
              'bg-red-500'
            }`} />

            {/* Participant Actions Menu */}
            {!isLocal && canManageParticipants && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-6 h-6 p-0 text-white hover:bg-white/20">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleParticipantAction('mute')}>
                    <MicOff className="w-4 h-4 mr-2" />
                    Mute
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleParticipantAction('promote')}>
                    <Crown className="w-4 h-4 mr-2" />
                    Make Moderator
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleParticipantAction('kick')}
                    className="text-red-600"
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Focus/Maximize Button */}
      {isHovered && !isLocal && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 w-8 h-8 p-0 bg-black/50 text-white hover:bg-black/70"
          onClick={(e) => {
            e.stopPropagation();
            onFocus?.();
          }}
        >
          {isFocused ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      )}
    </div>
  );
};

export const GroupVideoChat: React.FC<GroupVideoChatProps> = ({
  communityId,
  callId,
  onExit,
  className,
  ...options
}) => {
  const {
    callStatus,
    isConnecting,
    isConnected,
    cameraPermission,
    participants,
    localParticipant,
    participantStreams,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    localVideoRef,
    messages,
    unreadMessages,
    startCall,
    joinCall,
    endCall,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    sendMessage,
    markMessagesAsRead,
    muteParticipant,
    kickParticipant,
    promoteToModerator,
    getParticipantStream,
    getCurrentCall
  } = useGroupVideoChat({ communityId, callId, ...options });

  const { toast } = useToast();

  // UI State
  const [messageInput, setMessageInput] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [focusedParticipantId, setFocusedParticipantId] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // Calculate grid layout
  const totalParticipants = participants.length + (localParticipant ? 1 : 0);
  const getGridCols = () => {
    if (totalParticipants <= 1) return 1;
    if (totalParticipants <= 4) return 2;
    if (totalParticipants <= 9) return 3;
    return 4;
  };

  const getGridRows = () => {
    if (totalParticipants <= 2) return 2;
    if (totalParticipants <= 4) return 2;
    return Math.ceil(totalParticipants / getGridCols());
  };

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput);
      setMessageInput('');
    }
  };

  const handleParticipantAction = (action: string, participantId: string) => {
    switch (action) {
      case 'mute':
        muteParticipant(participantId);
        break;
      case 'kick':
        kickParticipant(participantId);
        break;
      case 'promote':
        promoteToModerator(participantId);
        break;
    }
  };

  const handleStartCall = async () => {
    try {
      await startCall('Community Group Video Call');
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const handleJoinCall = async () => {
    if (callId) {
      try {
        await joinCall(callId);
      } catch (error) {
        console.error('Failed to join call:', error);
      }
    }
  };

  const handleEndCall = () => {
    endCall();
    onExit?.();
  };

  const copyInviteLink = () => {
    const currentCall = getCurrentCall();
    if (currentCall) {
      const inviteLink = `${window.location.origin}/communities/${communityId}/group-call/${currentCall.id}`;
      navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Invite Link Copied",
        description: "Share this link with community members to invite them to the call",
      });
    }
  };

  const shareCall = () => {
    const currentCall = getCurrentCall();
    if (currentCall && navigator.share) {
      navigator.share({
        title: 'Join our community video call',
        text: 'Join us for a group video call!',
        url: `${window.location.origin}/communities/${communityId}/group-call/${currentCall.id}`
      });
    } else {
      copyInviteLink();
    }
  };

  // Show pre-call screen if not connected
  if (!isConnected) {
    return (
      <div className={`h-screen w-full bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20 flex items-center justify-center ${className}`}>
        <Card className="w-full max-w-md bg-black/40 backdrop-blur-md border-white/20 text-white">
          <CardContent className="text-center py-12">
            {cameraPermission === 'denied' ? (
              <>
                <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Camera Access Required</h2>
                <p className="text-white/80 mb-6">Please allow camera and microphone access to join the video call</p>
                <Button onClick={callId ? handleJoinCall : handleStartCall} size="lg" className="bg-white/20 hover:bg-white/30">
                  <Video className="w-5 h-5 mr-2" />
                  Try Again
                </Button>
              </>
            ) : isConnecting ? (
              <>
                <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                <h2 className="text-2xl font-bold mb-2">{callId ? 'Joining Call...' : 'Starting Call...'}</h2>
                <p className="text-white/80">Setting up your video and audio</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {callId ? 'Join Group Video Call' : 'Start Group Video Call'}
                </h2>
                <p className="text-white/80 mb-6">
                  {callId 
                    ? 'Connect with community members in this group video call' 
                    : 'Start a new group video call for your community'
                  }
                </p>
                <Button 
                  onClick={callId ? handleJoinCall : handleStartCall}
                  disabled={isConnecting}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-8 py-3"
                >
                  <Video className="w-5 h-5 mr-2" />
                  {callId ? 'Join Call' : 'Start Call'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`h-screen w-full bg-black relative overflow-hidden ${className}`}>
      {/* Main Video Grid */}
      <div className="absolute inset-0 p-4">
        <div 
          className={`
            h-full w-full grid gap-2
            grid-cols-${getGridCols()} 
            grid-rows-${getGridRows()}
          `}
          style={{
            gridTemplateColumns: `repeat(${getGridCols()}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${getGridRows()}, minmax(0, 1fr))`
          }}
        >
          {/* Local Video */}
          {localParticipant && (
            <ParticipantVideo
              participant={localParticipant}
              stream={localVideoRef.current?.srcObject as MediaStream}
              isLocal={true}
              isFocused={focusedParticipantId === localParticipant.id}
              onFocus={() => setFocusedParticipantId(localParticipant.id)}
            />
          )}

          {/* Remote Participants */}
          {participants.map((participant) => (
            <ParticipantVideo
              key={participant.id}
              participant={participant}
              stream={getParticipantStream(participant.id)}
              isScreenShare={participant.isScreenSharing}
              isFocused={focusedParticipantId === participant.id}
              onFocus={() => setFocusedParticipantId(participant.id)}
              onParticipantAction={handleParticipantAction}
              canManageParticipants={localParticipant?.role === 'host' || localParticipant?.role === 'moderator'}
            />
          ))}
        </div>

        {/* Hidden local video element */}
        <video
          ref={localVideoRef}
          className="hidden"
          autoPlay
          playsInline
          muted
        />
      </div>

      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Card className="bg-black/60 backdrop-blur-md border-white/20 text-white">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span className="font-medium">Group Call</span>
                <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
                  {totalParticipants} participants
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInviteDialog(true)}
            className="bg-black/60 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
          >
            <Share className="w-4 h-4 mr-2" />
            Invite
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEndCall}
            className="bg-black/60 backdrop-blur-md border-white/20 text-white hover:bg-red-500/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50">
        <div className="bg-gradient-to-t from-black/90 to-transparent pt-12 pb-6">
          <div className="flex items-center justify-center gap-4 px-6">
            
            {/* Audio Toggle */}
            <Button
              variant="ghost"
              size="lg"
              className={`w-12 h-12 rounded-full ${
                isAudioEnabled 
                  ? 'bg-white/20 hover:bg-white/30 text-white' 
                  : 'bg-red-500/80 hover:bg-red-500 text-white'
              }`}
              onClick={toggleAudio}
            >
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>

            {/* Video Toggle */}
            <Button
              variant="ghost"
              size="lg"
              className={`w-12 h-12 rounded-full ${
                isVideoEnabled 
                  ? 'bg-white/20 hover:bg-white/30 text-white' 
                  : 'bg-red-500/80 hover:bg-red-500 text-white'
              }`}
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>

            {/* Screen Share Toggle */}
            <Button
              variant="ghost"
              size="lg"
              className={`w-12 h-12 rounded-full ${
                isScreenSharing 
                  ? 'bg-blue-500/80 hover:bg-blue-500 text-white' 
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            >
              {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
            </Button>

            {/* End Call */}
            <Button
              variant="ghost"
              size="lg"
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white"
              onClick={handleEndCall}
            >
              <PhoneOff className="w-7 h-7" />
            </Button>

            {/* Chat Toggle */}
            <Button
              variant="ghost"
              size="lg"
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white relative"
              onClick={() => {
                setIsChatVisible(true);
                markMessagesAsRead();
              }}
            >
              <MessageCircle className="w-6 h-6" />
              {unreadMessages > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                  {unreadMessages}
                </Badge>
              )}
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="lg"
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white"
              onClick={() => setShowSettingsDialog(true)}
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {isChatVisible && (
        <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-96">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Group Chat</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsChatVisible(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <ScrollArea className="p-4 max-h-64">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => (
                    <div key={message.id} className="flex flex-col">
                      <div className="text-xs text-gray-500 mb-1">
                        {message.participantName}
                      </div>
                      <div className="bg-gray-100 px-3 py-2 rounded-lg max-w-xs">
                        {message.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
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

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite People to Call</DialogTitle>
            <DialogDescription>
              Share the link below to invite community members to join this group video call.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/communities/${communityId}/group-call/${getCurrentCall()?.id || ''}`}
                readOnly
                className="flex-1"
              />
              <Button onClick={copyInviteLink} variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={shareCall} className="w-full">
              <Share className="w-4 h-4 mr-2" />
              Share Invite
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Call Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Call settings and preferences will be available here.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
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
  Share,
  ArrowLeft
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface SpeakingIndicatorProps {
  isSpeaking: boolean;
  className?: string;
}

const SpeakingIndicator: React.FC<SpeakingIndicatorProps> = ({ isSpeaking, className = "" }) => {
  const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-150 ${
            isSpeaking 
              ? 'animate-pulse bg-green-400' 
              : 'bg-gray-400'
          }`}
          style={{
            height: isSpeaking ? `${8 + Math.random() * 16}px` : '4px',
            backgroundColor: isSpeaking ? colors[i % colors.length] : undefined,
            animationDelay: `${i * 100}ms`
          }}
        />
      ))}
    </div>
  );
};

interface NotificationBannerProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
      <Card className="bg-black/80 backdrop-blur-md border-white/20 text-white">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-sm">{message}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface GroupVideoChatProps extends UseGroupVideoChatOptions {
  onExit?: () => void;
  className?: string;
  communityId?: string;
}

interface ParticipantVideoProps {
  participant: GroupParticipant;
  stream: MediaStream | null;
  isLocal?: boolean;
  isScreenShare?: boolean;
  isFocused?: boolean;
  isSpeaking?: boolean;
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
  isSpeaking = false,
  onFocus,
  onParticipantAction,
  canManageParticipants = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      console.log(`🎥 Assigning stream to video element for participant ${participant.id}:`, {
        streamId: stream.id,
        tracks: stream.getTracks().map(track => ({
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState
        })),
        isLocal
      });
      videoRef.current.srcObject = stream;
      
      // Ensure video plays
      if (!isLocal) {
        videoRef.current.play().catch(error => {
          console.warn(`Failed to play video for participant ${participant.id}:`, error);
        });
      }
    } else if (videoRef.current && !stream) {
      console.log(`🎥 Clearing stream for participant ${participant.id}`);
      videoRef.current.srcObject = null;
    }
  }, [stream, participant.id, isLocal]);

  const getGridItemClass = (totalParticipants: number) => {
    if (totalParticipants === 1) return "col-span-2 row-span-2";
    if (totalParticipants === 2) return "col-span-1 row-span-2";
    if (totalParticipants <= 4) return "col-span-1 row-span-1";
    return "col-span-1 row-span-1";
  };

  const handleParticipantAction = (action: string) => {
    onParticipantAction?.(action, participant.id);
    setShowQuickActions(false);
  };

  const handleMouseDown = () => {
    if (!canManageParticipants || isLocal) return;
    
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      setShowQuickActions(true);
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressing(false);
  };

  const handleTouchStart = () => {
    if (!canManageParticipants || isLocal) return;
    
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      setShowQuickActions(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressing(false);
  };

  return (
    <div 
      className={`
        relative bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition-all duration-200
        ${isFocused ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-gray-400'}
        ${isSpeaking ? 'ring-2 ring-green-400 ring-opacity-75' : ''}
        ${isLongPressing ? 'ring-2 ring-blue-400 scale-95' : ''}
        ${isScreenShare ? 'col-span-2' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onFocus}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted={isLocal}
        controls={false}
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
            
            {/* Speaking Indicator */}
            {participant.isAudioEnabled && (
              <SpeakingIndicator isSpeaking={isSpeaking} className="ml-1" />
            )}
            
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
      {isHovered && !isLocal && !showQuickActions && (
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

      {/* Quick Actions Overlay */}
      {showQuickActions && !isLocal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 rounded-full bg-red-500/80 hover:bg-red-500 text-white"
              onClick={(e) => {
                e.stopPropagation();
                handleParticipantAction('mute');
              }}
            >
              <MicOff className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 rounded-full bg-blue-500/80 hover:bg-blue-500 text-white"
              onClick={(e) => {
                e.stopPropagation();
                handleParticipantAction('promote');
              }}
            >
              <Crown className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 rounded-full bg-gray-500/80 hover:bg-gray-500 text-white"
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickActions(false);
              }}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
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
  console.log('🎥 GroupVideoChat rendered with:', { 
    communityId, 
    callId, 
    hasOnExit: !!onExit,
    options 
  });

  const {
    callStatus,
    isConnecting,
    isConnected,
    cameraPermission,
    participants,
    localParticipant,
    participantStreams,
    localStream,
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
    getLocalStream,
    getCurrentCall
  } = useGroupVideoChat({ communityId, callId, ...options });

  console.log('🔄 GroupVideoChat state:', {
    callStatus,
    isConnecting,
    isConnected,
    cameraPermission,
    participantsCount: participants.length,
    hasLocalParticipant: !!localParticipant,
    currentCallId: getCurrentCall()?.id
  });

  const { toast } = useToast();

  // UI State
  const [messageInput, setMessageInput] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [focusedParticipantId, setFocusedParticipantId] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [speakingParticipants, setSpeakingParticipants] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ message: string; isVisible: boolean }>({
    message: '',
    isVisible: false
  });
  const [previousParticipantIds, setPreviousParticipantIds] = useState<Set<string>>(new Set());

  // Calculate grid layout
  const totalParticipants = participants.length + (localParticipant ? 1 : 0);
  console.log('🎥 Participant count debug:', {
    participantsArray: participants.length,
    hasLocalParticipant: !!localParticipant,
    totalParticipants,
    participants: participants.map(p => ({ id: p.id, name: p.displayName })),
    localParticipant: localParticipant ? { id: localParticipant.id, name: localParticipant.displayName } : null
  });
  
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

  // Mock speaking detection for demonstration
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      const allParticipants = [...participants, ...(localParticipant ? [localParticipant] : [])];
      const speakingIds = new Set<string>();
      
      // Randomly make participants "speak"
      allParticipants.forEach(participant => {
        if (participant.isAudioEnabled && Math.random() < 0.3) {
          speakingIds.add(participant.id);
        }
      });
      
      setSpeakingParticipants(speakingIds);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, participants, localParticipant]);

  // Track participant changes for notifications
  useEffect(() => {
    if (!isConnected) return;

    const currentParticipantIds = new Set(participants.map(p => p.id));
    
    // Check for new participants (joined)
    currentParticipantIds.forEach(id => {
      if (!previousParticipantIds.has(id)) {
        const participant = participants.find(p => p.id === id);
        if (participant) {
          setNotification({
            message: `${participant.displayName} joined the call`,
            isVisible: true
          });
        }
      }
    });

    // Check for left participants
    previousParticipantIds.forEach(id => {
      if (!currentParticipantIds.has(id)) {
        // We can't get the participant name since they've left
        setNotification({
          message: `Someone left the call`,
          isVisible: true
        });
      }
    });

    setPreviousParticipantIds(currentParticipantIds);
  }, [participants, previousParticipantIds, isConnected]);

  // Show pre-call screen if not connected
  if (!isConnected) {
    return (
      <div className={`h-screen w-full bg-gradient-to-br from-green-900/30 via-gray-900 to-gray-800 flex flex-col ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-green-600/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onExit}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-medium">Group Call</h1>
                <p className="text-white/70 text-sm">Community Video Call</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {cameraPermission === 'denied' ? (
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-12 h-12 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Camera Access Required</h2>
              <p className="text-white/70 mb-8 leading-relaxed">
                To join the video call, please allow access to your camera and microphone. 
                This helps you connect with other community members.
              </p>
              <Button 
                onClick={callId ? handleJoinCall : handleStartCall} 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full"
              >
                <Video className="w-5 h-5 mr-2" />
                Allow Access
              </Button>
            </div>
          ) : isConnecting ? (
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {callId ? 'Joining call...' : 'Starting call...'}
              </h2>
              <p className="text-white/70">Setting up your video and audio</p>
            </div>
          ) : (
            <div className="text-center max-w-md">
              {/* Participant Avatars Preview */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  {callId && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                      <span className="text-xs text-white font-bold">3</span>
                    </div>
                  )}
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">
                {callId ? 'Join Group Call' : 'Start Group Call'}
              </h2>
              
              <p className="text-white/70 mb-8 leading-relaxed">
                {callId 
                  ? 'Connect with community members who are already in the call' 
                  : 'Start a new group video call and invite community members to join'
                }
              </p>

              {callId && (
                <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3 text-green-200">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">Call in progress • 3 participants</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button 
                  onClick={callId ? handleJoinCall : handleStartCall}
                  disabled={isConnecting}
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-4 rounded-full"
                >
                  <Video className="w-5 h-5 mr-2" />
                  {callId ? 'Join Call' : 'Start Call'}
                </Button>
                
                {!callId && (
                  <Button 
                    variant="outline"
                    size="lg"
                    className="w-full border-white/20 text-white hover:bg-white/10 py-4 rounded-full"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Audio Only
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
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
              stream={localStream}
              isLocal={true}
              isFocused={focusedParticipantId === localParticipant.id}
              isSpeaking={speakingParticipants.has(localParticipant.id)}
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
              isSpeaking={speakingParticipants.has(participant.id)}
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

      {/* Notification Banner */}
      <NotificationBanner
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ message: '', isVisible: false })}
      />

      {/* Enhanced Teams Chat Panel */}
      {isChatVisible && (
        <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl h-96 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Chat feature has been removed</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsChatVisible(false)}
              >
                Close
              </Button>
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
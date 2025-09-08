import React, { useState, useRef, useEffect } from 'react';
import '../styles/whatsapp-video-call.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useVideoChat } from '@/hooks/useVideoChat';
import { useToast } from '@/hooks/use-toast';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Phone,
  MessageCircle,
  MoreVertical,
  Minimize2,
  Maximize2,
  Users,
  VolumeX,
  Volume2,
  Monitor,
  MonitorOff,
  ArrowLeft,
  UserPlus
} from 'lucide-react';

type CallState = 'idle' | 'calling' | 'active' | 'minimized' | 'ended';

interface WhatsAppVideoCallProps extends UseGroupVideoChatOptions {
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  isMinimized?: boolean;
  className?: string;
  contactName?: string;
  contactAvatar?: string;
  communityId: string;
  callId?: string;
}

interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  stream?: MediaStream;
  isLocal?: boolean;
}

export const WhatsAppVideoCall: React.FC<WhatsAppVideoCallProps> = ({
  communityId,
  callId,
  onClose,
  onMinimize,
  onMaximize,
  isMinimized = false,
  className,
  contactName = "Community Call",
  contactAvatar,
  ...options
}) => {
  console.log('🎥 WhatsApp Video Call Component Rendered:', {
    communityId,
    callId,
    contactName,
    isMinimized
  });
  const [callState, setCallState] = useState<CallState>('idle');
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);

  const { toast } = useToast();

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
    startCall,
    joinCall,
    endCall,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    getParticipantStream,
  } = useGroupVideoChat({ communityId, callId, ...options });

  // Convert participants to call participants format
  const callParticipants: CallParticipant[] = [
    ...(localParticipant ? [{
      id: localParticipant.id,
      name: localParticipant.displayName,
      avatar: localParticipant.avatarUrl,
      isVideoEnabled: localParticipant.isVideoEnabled,
      isAudioEnabled: localParticipant.isAudioEnabled,
      stream: localStream,
      isLocal: true
    }] : []),
    ...participants.map(p => ({
      id: p.id,
      name: p.displayName,
      avatar: p.avatarUrl,
      isVideoEnabled: p.isVideoEnabled,
      isAudioEnabled: p.isAudioEnabled,
      stream: getParticipantStream(p.id) || undefined,
      isLocal: false
    }))
  ];

  // Update call state based on connection status
  useEffect(() => {
    if (isConnecting && callState === 'idle') {
      setCallState('calling');
    } else if (isConnected && callState !== 'active') {
      setCallState('active');
      setCallStartTime(new Date());
    } else if (!isConnected && !isConnecting && callState === 'active') {
      setCallState('ended');
    }
  }, [isConnecting, isConnected, callState]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === 'active' && callStartTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState, callStartTime]);

  // Auto-hide controls
  const resetControlsTimeout = () => {
    if (controlsTimeout) clearTimeout(controlsTimeout);
    setShowControls(true);
    
    if (callState === 'active') {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setControlsTimeout(timeout);
    }
  };

  // Handle mouse movement to show controls
  const handleMouseMove = () => {
    if (callState === 'active') {
      resetControlsTimeout();
    }
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, [callState]);

  const handleStartCall = async () => {
    try {
      if (callId) {
        await joinCall(callId);
      } else {
        await startCall(contactName);
      }
    } catch (error) {
      console.error('Failed to start/join call:', error);
      toast({
        title: "Call Failed",
        description: "Unable to start the call. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEndCall = () => {
    endCall();
    setCallState('ended');
    setTimeout(() => {
      onClose?.();
    }, 2000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get primary participant (first remote participant or local if alone)
  const primaryParticipant = callParticipants.find(p => !p.isLocal) || callParticipants[0];
  const localParticipantData = callParticipants.find(p => p.isLocal);

  // Minimized view
  if (isMinimized) {
    return (
      <div className={`whatsapp-minimized-call fixed bottom-4 right-4 w-80 h-48 bg-black rounded-lg overflow-hidden shadow-2xl z-50 whatsapp-fade-in ${className}`}>
        <div className="relative w-full h-full">
          {/* Remote video background */}
          {primaryParticipant?.stream && primaryParticipant.isVideoEnabled ? (
            <video
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              ref={(video) => {
                if (video && primaryParticipant.stream) {
                  video.srcObject = primaryParticipant.stream;
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <Avatar className="w-16 h-16">
                <AvatarImage src={primaryParticipant?.avatar} />
                <AvatarFallback>{primaryParticipant?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </div>
          )}

          {/* Local video PiP */}
          {localParticipantData?.stream && (
            <div className="absolute top-2 right-2 w-20 h-16 rounded-lg overflow-hidden border border-white/30">
              <video
                ref={localVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoOff className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className={`whatsapp-control-button w-8 h-8 rounded-full ${isAudioEnabled ? 'bg-white/20' : 'bg-red-500'}`}
              onClick={toggleAudio}
            >
              {isAudioEnabled ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-white" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="whatsapp-control-button w-8 h-8 rounded-full bg-red-500"
              onClick={handleEndCall}
            >
              <PhoneOff className="w-4 h-4 text-white" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="whatsapp-control-button w-8 h-8 rounded-full bg-white/20"
              onClick={onMaximize}
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </Button>
          </div>

          {/* Call duration */}
          {callState === 'active' && (
            <div className="absolute top-2 left-2 bg-black/60 rounded-full px-3 py-1">
              <span className="text-white text-xs font-medium">{formatDuration(callDuration)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Pre-call screen
  if (callState === 'idle') {
    return (
      <div className={`fixed inset-0 whatsapp-gradient-green z-50 flex flex-col whatsapp-fade-in ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-medium">Video Call</h1>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        {/* Contact Info */}
        <div className="flex-1 flex flex-col items-center justify-center text-white">
          <div className="whatsapp-bounce-in">
            <Avatar className="w-32 h-32 mb-6">
              <AvatarImage src={contactAvatar} />
              <AvatarFallback className="text-4xl bg-white/20">
                {contactName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          <h2 className="text-2xl font-medium mb-2">{contactName}</h2>
          <p className="text-white/80 mb-8">Community Video Call</p>
          
          {participants.length > 0 && (
            <div className="bg-white/20 rounded-full px-4 py-2 mb-8">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {participants.length} member{participants.length !== 1 ? 's' : ''} in call
              </span>
            </div>
          )}
        </div>

        {/* Call Actions */}
        <div className="flex items-center justify-center gap-8 pb-12 whatsapp-slide-up">
          <Button
            size="lg"
            variant="ghost"
            className="whatsapp-control-button w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 text-white animation-delay-100"
            onClick={handleStartCall}
            disabled={isConnecting}
          >
            <Phone className="w-8 h-8" />
          </Button>
          <Button
            size="lg"
            className="whatsapp-control-button w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg whatsapp-pulse animation-delay-200"
            onClick={handleStartCall}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <div className="whatsapp-spinner w-8 h-8" />
            ) : (
              <Video className="w-10 h-10" />
            )}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="whatsapp-control-button w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white animation-delay-300"
            onClick={onClose}
          >
            <PhoneOff className="w-8 h-8" />
          </Button>
        </div>
      </div>
    );
  }

  // Calling state
  if (callState === 'calling') {
    return (
      <div className={`fixed inset-0 whatsapp-gradient-calling z-50 flex flex-col whatsapp-fade-in ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <div></div>
          <h1 className="font-medium">Connecting...</h1>
          <Button variant="ghost" size="sm" onClick={onMinimize} className="text-white hover:bg-white/20">
            <Minimize2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Contact Info with Animation */}
        <div className="flex-1 flex flex-col items-center justify-center text-white">
          <div className="relative mb-8">
            <Avatar className="w-32 h-32">
              <AvatarImage src={contactAvatar} />
              <AvatarFallback className="text-4xl bg-white/20">
                {contactName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-full border-4 border-white/30 whatsapp-ring"></div>
            <div className="absolute inset-0 rounded-full border-4 border-white/20 whatsapp-ring animation-delay-200"></div>
          </div>
          
          <h2 className="text-2xl font-medium mb-2">{contactName}</h2>
          <p className="text-white/80 mb-4">Connecting...</p>
          
          <div className="flex items-center gap-2 text-sm text-white/70">
            <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse"></div>
            <span>Setting up video call</span>
          </div>
        </div>

        {/* End Call */}
        <div className="flex items-center justify-center pb-12">
          <Button
            size="lg"
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
            onClick={handleEndCall}
          >
            <PhoneOff className="w-8 h-8" />
          </Button>
        </div>
      </div>
    );
  }

  // Active call
  if (callState === 'active') {
    return (
      <div 
        className={`fixed inset-0 bg-black z-50 ${className}`}
        onMouseMove={handleMouseMove}
        onTouchStart={resetControlsTimeout}
      >
        {/* Remote video (main) */}
        <div className="absolute inset-0">
          {primaryParticipant?.stream && primaryParticipant.isVideoEnabled ? (
            <video
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              ref={(video) => {
                if (video && primaryParticipant.stream) {
                  video.srcObject = primaryParticipant.stream;
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-white">
              <Avatar className="w-32 h-32 mb-4">
                <AvatarImage src={primaryParticipant?.avatar} />
                <AvatarFallback className="text-4xl">
                  {primaryParticipant?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-medium">{primaryParticipant?.name || contactName}</h3>
              <p className="text-white/70 mt-2">Video is off</p>
            </div>
          )}
        </div>

        {/* Local video (Picture-in-Picture) */}
        {localParticipantData?.stream && (
          <div className="absolute top-4 right-4 w-32 h-40 rounded-lg overflow-hidden border-2 border-white/30 shadow-lg">
            <video
              ref={localVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
        )}

        {/* Top bar with controls */}
        <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-between p-4 text-white">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onMinimize} className="text-white hover:bg-white/20">
                <Minimize2 className="w-5 h-5" />
              </Button>
              <div>
                <h3 className="font-medium">{contactName}</h3>
                <p className="text-sm text-white/80">{formatDuration(callDuration)}</p>
              </div>
            </div>
            
            {participants.length > 1 && (
              <div className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">{participants.length + 1}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom controls */}
        <div className={`absolute bottom-0 left-0 right-0 whatsapp-video-overlay transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-center gap-6 pb-8 pt-12">
            {/* Audio toggle */}
            <Button
              size="lg"
              variant="ghost"
              className={`whatsapp-control-button w-14 h-14 rounded-full ${isAudioEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'} text-white`}
              onClick={toggleAudio}
            >
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>

            {/* Video toggle */}
            <Button
              size="lg"
              variant="ghost"
              className={`whatsapp-control-button w-14 h-14 rounded-full ${isVideoEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'} text-white`}
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>

            {/* Screen share */}
            <Button
              size="lg"
              variant="ghost"
              className={`whatsapp-control-button w-14 h-14 rounded-full ${isScreenSharing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-white/20 hover:bg-white/30'} text-white`}
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            >
              {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
            </Button>

            {/* End call */}
            <Button
              size="lg"
              className="whatsapp-control-button w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
              onClick={handleEndCall}
            >
              <PhoneOff className="w-8 h-8" />
            </Button>

            {/* Chat */}
            <Button
              size="lg"
              variant="ghost"
              className="whatsapp-control-button w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 text-white"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>

            {/* Add people */}
            <Button
              size="lg"
              variant="ghost"
              className="whatsapp-control-button w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 text-white"
            >
              <UserPlus className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Multiple participants grid (if more than 2 participants) */}
        {participants.length > 1 && (
          <div className="absolute top-20 left-4 right-4 bottom-32">
            <div className="grid grid-cols-2 gap-2 h-full">
              {callParticipants.slice(1, 5).map((participant) => (
                <div key={participant.id} className="relative bg-gray-800 rounded-lg overflow-hidden">
                  {participant.stream && participant.isVideoEnabled ? (
                    <video
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted={participant.isLocal}
                      ref={(video) => {
                        if (video && participant.stream) {
                          video.srcObject = participant.stream;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white">
                      <Avatar className="w-12 h-12 mb-2">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{participant.name}</span>
                    </div>
                  )}
                  
                  {/* Participant name */}
                  <div className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-1">
                    <span className="text-white text-xs">{participant.name}</span>
                  </div>
                  
                  {/* Audio indicator */}
                  {!participant.isAudioEnabled && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <MicOff className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Call ended
  if (callState === 'ended') {
    return (
      <div className={`fixed inset-0 bg-gradient-to-br from-gray-700 to-gray-900 z-50 flex flex-col items-center justify-center text-white ${className}`}>
        <Avatar className="w-24 h-24 mb-6">
          <AvatarImage src={contactAvatar} />
          <AvatarFallback className="text-2xl bg-white/20">
            {contactName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-medium mb-2">Call Ended</h2>
        <p className="text-white/70 mb-2">Duration: {formatDuration(callDuration)}</p>
        <p className="text-white/50 text-sm">The call has ended</p>
      </div>
    );
  }

  return null;
};

export default WhatsAppVideoCall;
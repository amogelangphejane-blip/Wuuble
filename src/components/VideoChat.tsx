import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
  Wifi
} from 'lucide-react';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export const VideoChat = () => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isSearching, setIsSearching] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(1247);
  const [partnerConnected, setPartnerConnected] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();

  // Initialize local video stream
  useEffect(() => {
    const initializeLocalVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoEnabled,
          audio: isAudioEnabled
        });
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        toast({
          title: "Camera Access Required",
          description: "Please allow camera and microphone access to start video chat.",
          variant: "destructive"
        });
      }
    };

    initializeLocalVideo();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Simulate partner video (in real app, this would be WebRTC peer connection)
  const simulatePartnerVideo = () => {
    if (remoteVideoRef.current) {
      // Create a dummy video element for demonstration
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      
      const animate = () => {
        if (ctx && partnerConnected) {
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#16213e';
          ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);
          ctx.fillStyle = '#e94560';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Partner Video Feed', canvas.width / 2, canvas.height / 2);
          ctx.fillText('(Demo)', canvas.width / 2, canvas.height / 2 + 40);
          requestAnimationFrame(animate);
        }
      };
      
      if (partnerConnected) {
        animate();
        const stream = canvas.captureStream(30);
        remoteVideoRef.current.srcObject = stream;
      }
    }
  };

  useEffect(() => {
    simulatePartnerVideo();
  }, [partnerConnected]);

  const handleStartChat = async () => {
    setIsSearching(true);
    setConnectionStatus('connecting');
    
    // Simulate connection process
    setTimeout(() => {
      setIsSearching(false);
      setConnectionStatus('connected');
      setPartnerConnected(true);
      toast({
        title: "Connected!",
        description: "You're now connected with a random user.",
      });
    }, 2000);
  };

  const handleEndChat = () => {
    setConnectionStatus('disconnected');
    setPartnerConnected(false);
    setIsSearching(false);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    toast({
      title: "Chat Ended",
      description: "You've disconnected from the chat.",
    });
  };

  const handleNextPartner = () => {
    handleEndChat();
    setTimeout(() => {
      handleStartChat();
    }, 500);
  };

  const handleReport = () => {
    toast({
      title: "Report Submitted",
      description: "Thank you for helping keep our community safe.",
    });
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
      }
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              KindredStreams
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>{onlineUsers.toLocaleString()} online</span>
            </Badge>
            <Badge 
              variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
              className="flex items-center space-x-1"
            >
              <Wifi className="w-3 h-3" />
              <span className="capitalize">{connectionStatus}</span>
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Video Area */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Local Video */}
          <Card className="relative overflow-hidden bg-gradient-card border-video-border shadow-video">
            <div className="aspect-video bg-video-bg relative">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-muted flex items-center justify-center">
                  <VideoOff className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-4 left-4">
                <Badge variant="secondary">You</Badge>
              </div>
            </div>
          </Card>

          {/* Remote Video */}
          <Card className="relative overflow-hidden bg-gradient-card border-video-border shadow-video">
            <div className="aspect-video bg-video-bg relative">
              {partnerConnected ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-muted flex items-center justify-center">
                  <div className="text-center">
                    {isSearching ? (
                      <>
                        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Connecting to a stranger...</p>
                      </>
                    ) : (
                      <>
                        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Click "Start Chat" to connect</p>
                      </>
                    )}
                  </div>
                </div>
              )}
              {partnerConnected && (
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary">Stranger</Badge>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="max-w-2xl mx-auto mt-8">
          <Card className="bg-controls-bg border-controls-border p-6 shadow-button">
            <div className="flex items-center justify-center space-x-4">
              {/* Video Toggle */}
              <Button
                variant={isVideoEnabled ? "secondary" : "destructive"}
                size="lg"
                onClick={toggleVideo}
                className="transition-smooth"
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>

              {/* Audio Toggle */}
              <Button
                variant={isAudioEnabled ? "secondary" : "destructive"}
                size="lg"
                onClick={toggleAudio}
                className="transition-smooth"
              >
                {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>

              {/* Main Call Control */}
              {connectionStatus === 'disconnected' ? (
                <Button
                  onClick={handleStartChat}
                  disabled={isSearching}
                  size="lg"
                  className="bg-gradient-primary hover:shadow-glow transition-smooth px-8"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  {isSearching ? 'Connecting...' : 'Start Chat'}
                </Button>
              ) : (
                <Button
                  onClick={handleEndChat}
                  variant="destructive"
                  size="lg"
                  className="transition-smooth px-8"
                >
                  <PhoneOff className="w-5 h-5 mr-2" />
                  End Chat
                </Button>
              )}

              {/* Next Partner */}
              {connectionStatus === 'connected' && (
                <Button
                  onClick={handleNextPartner}
                  variant="secondary"
                  size="lg"
                  className="transition-smooth"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              )}

              {/* Report */}
              {connectionStatus === 'connected' && (
                <Button
                  onClick={handleReport}
                  variant="outline"
                  size="lg"
                  className="transition-smooth"
                >
                  <Flag className="w-5 h-5" />
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Safety Notice */}
        <div className="max-w-2xl mx-auto mt-6">
          <Card className="bg-warning/10 border-warning/20 p-4">
            <div className="text-center text-sm text-warning-foreground">
              <strong>Stay Safe:</strong> Never share personal information. Report inappropriate behavior immediately.
              You must be 18+ to use this service.
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};
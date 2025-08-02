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
  Users
} from 'lucide-react';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export const VideoChat = () => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isSearching, setIsSearching] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(1247);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();

  // Request camera access function
  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setCameraPermission('granted');
      
      toast({
        title: "Camera Access Granted",
        description: "You can now start video chatting!",
      });
    } catch (error) {
      setCameraPermission('denied');
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera and microphone access to start video chat.",
        variant: "destructive"
      });
    }
  };

  // Initialize camera access check
  useEffect(() => {
    const checkCameraAccess = async () => {
      try {
        // Check if permissions are already granted
        const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (permissions.state === 'granted') {
          await requestCameraAccess();
        }
      } catch (error) {
        // Fallback: try to request access directly
        await requestCameraAccess();
      }
    };

    checkCameraAccess();

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
    
    // Faster connection process like Monkey app
    setTimeout(() => {
      setIsSearching(false);
      setConnectionStatus('connected');
      setPartnerConnected(true);
      toast({
        title: "Connected!",
        description: "Say hi! 👋",
      });
    }, 800);
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
    // Instant next like Monkey app
    setTimeout(() => {
      handleStartChat();
    }, 200);
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
      {/* Simplified Header - Monkey style */}
      <header className="bg-card/30 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Video className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Inner Circle
            </h1>
          </div>
          
          <Badge variant="secondary" className="flex items-center space-x-2 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="font-medium">{onlineUsers.toLocaleString()} online</span>
          </Badge>
        </div>
      </header>

      {/* Main Content - Mobile-first layout */}
      <main className="flex-1 flex flex-col px-4 py-6">
        {/* Video Container - Stack on mobile, side by side on desktop */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 max-w-7xl mx-auto w-full">
          {/* Partner Video (larger on mobile) */}
          <div className="flex-1 lg:flex-[2]">
            <Card className="relative overflow-hidden bg-gradient-card border-video-border shadow-video rounded-2xl h-full min-h-[400px] lg:min-h-[500px]">
              <div className="absolute inset-0 bg-video-bg">
                {partnerConnected ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      {isSearching ? (
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
                {partnerConnected && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-gradient-primary text-white border-0 shadow-lg">
                      New Friend
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Local Video (smaller, bottom-right style) */}
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
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Controls - Monkey app style */}
        <div className="mt-6 flex flex-col items-center space-y-4">
          {/* Primary Action */}
          <div className="flex items-center justify-center">
            {connectionStatus === 'disconnected' && cameraPermission !== 'denied' ? (
              <Button
                onClick={handleStartChat}
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
                onClick={requestCameraAccess}
                size="lg"
                className="bg-gradient-primary hover:shadow-glow text-white font-semibold px-12 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 border-0"
              >
                <Video className="w-5 h-5 mr-3" />
                Enable Camera
              </Button>
            ) : connectionStatus === 'connected' ? (
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleNextPartner}
                  size="lg"
                  className="bg-gradient-primary hover:shadow-glow text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 border-0"
                >
                  <SkipForward className="w-5 h-5 mr-2" />
                  Next
                </Button>
                <Button
                  onClick={handleEndChat}
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
          <div className="flex items-center space-x-3">
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
              <Button
                onClick={handleReport}
                variant="outline"
                size="lg"
                className="w-12 h-12 rounded-full p-0 transition-all duration-200 hover:scale-110"
              >
                <Flag className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Safety Notice - Simplified */}
          <div className="text-center text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            <span className="font-medium">18+ only.</span> Keep it friendly and report any inappropriate behavior.
          </div>
        </div>
      </main>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, 
  X, 
  MessageCircle,
  SkipForward,
  Flag,
  MoreVertical,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Shield,
  Star,
  Gift,
  Zap,
  Camera,
  Maximize,
  Minimize,
  Settings
} from 'lucide-react';

interface UserInfo {
  id: string;
  name: string;
  age: number;
  location: string;
  avatar?: string;
  interests: string[];
  isVerified: boolean;
  isPremium: boolean;
}

interface InteractionOverlayProps {
  connectedUser?: UserInfo;
  isConnected: boolean;
  callDuration: number;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isMuted: boolean;
  chatUnreadCount: number;
  onLike: () => void;
  onSkip: () => void;
  onReport: () => void;
  onToggleChat: () => void;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleMute: () => void;
  onEndCall: () => void;
  onSendGift?: () => void;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
}

export const UserInteractionOverlay: React.FC<InteractionOverlayProps> = ({
  connectedUser,
  isConnected,
  callDuration,
  isVideoEnabled,
  isAudioEnabled,
  isMuted,
  chatUnreadCount,
  onLike,
  onSkip,
  onReport,
  onToggleChat,
  onToggleVideo,
  onToggleAudio,
  onToggleMute,
  onEndCall,
  onSendGift,
  onFullscreen,
  isFullscreen = false
}) => {
  const [showControls, setShowControls] = useState(true);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const { toast } = useToast();

  // Auto-hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (showControls) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }

    return () => clearTimeout(timeout);
  }, [showControls]);

  // Simulate connection quality changes
  useEffect(() => {
    const interval = setInterval(() => {
      const qualities: ('excellent' | 'good' | 'poor')[] = ['excellent', 'good', 'poor'];
      const weights = [0.7, 0.25, 0.05]; // Mostly excellent, sometimes good, rarely poor
      const random = Math.random();
      let cumulative = 0;
      
      for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (random <= cumulative) {
          setConnectionQuality(qualities[i]);
          break;
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLike = () => {
    setLikeAnimation(true);
    onLike();
    toast({
      title: "❤️ Liked!",
      description: `You liked ${connectedUser?.name}`,
    });
    setTimeout(() => setLikeAnimation(false), 1000);
  };

  const handleSkip = () => {
    setSkipAnimation(true);
    onSkip();
    setTimeout(() => setSkipAnimation(false), 500);
  };

  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionQualityIcon = () => {
    switch (connectionQuality) {
      case 'excellent': return '●●●';
      case 'good': return '●●○';
      case 'poor': return '●○○';
      default: return '○○○';
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      onMouseMove={() => setShowControls(true)}
      onTouchStart={() => setShowControls(true)}
    >
      {/* Top Bar - User Info */}
      <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} pointer-events-auto`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {connectedUser && (
              <>
                <Avatar className="w-10 h-10 border-2 border-white">
                  <AvatarImage src={connectedUser.avatar} />
                  <AvatarFallback>
                    {connectedUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{connectedUser.name}, {connectedUser.age}</span>
                    {connectedUser.isVerified && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <Shield className="w-2 h-2 text-white" />
                      </div>
                    )}
                    {connectedUser.isPremium && (
                      <Star className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                  <div className="text-xs text-gray-300">{connectedUser.location}</div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Call Duration */}
            <Badge variant="secondary" className="bg-black/30 text-white border-0">
              {formatDuration(callDuration)}
            </Badge>

            {/* Connection Quality */}
            <div className={`flex items-center gap-1 ${getConnectionQualityColor()}`}>
              <span className="text-xs font-mono">{getConnectionQualityIcon()}</span>
            </div>

            {/* More Options */}
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Interests */}
        {connectedUser && connectedUser.interests.length > 0 && (
          <div className="flex gap-1 mt-2">
            {connectedUser.interests.slice(0, 3).map((interest) => (
              <Badge key={interest} variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                {interest}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Side Actions - Left (Like) */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto">
        <Button
          size="lg"
          className={`w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 shadow-lg transition-all duration-300 ${
            likeAnimation ? 'scale-125 animate-pulse' : 'hover:scale-110'
          }`}
          onClick={handleLike}
        >
          <Heart className="w-8 h-8 text-white fill-current" />
        </Button>
        
        {/* Like animation hearts */}
        {likeAnimation && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 text-red-500 animate-bounce"
                style={{
                  left: `${Math.random() * 60}px`,
                  top: `${Math.random() * 60}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              >
                ❤️
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side Actions - Right (Skip) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto">
        <Button
          size="lg"
          className={`w-16 h-16 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 shadow-lg transition-all duration-300 ${
            skipAnimation ? 'scale-125' : 'hover:scale-110'
          }`}
          onClick={handleSkip}
        >
          <SkipForward className="w-8 h-8 text-white" />
        </Button>
      </div>

      {/* Right Side Vertical Actions */}
      <div className="absolute right-4 bottom-32 flex flex-col gap-3 pointer-events-auto">
        {/* Chat Toggle */}
        <div className="relative">
          <Button
            size="lg"
            variant="secondary"
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-0"
            onClick={onToggleChat}
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </Button>
          {chatUnreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
            </Badge>
          )}
        </div>

        {/* Send Gift (Premium Feature) */}
        {onSendGift && connectedUser?.isPremium && (
          <Button
            size="lg"
            variant="secondary"
            className="w-12 h-12 rounded-full bg-yellow-500/80 backdrop-blur-sm hover:bg-yellow-500 border-0"
            onClick={onSendGift}
          >
            <Gift className="w-6 h-6 text-white" />
          </Button>
        )}

        {/* Report */}
        <Button
          size="lg"
          variant="secondary"
          className="w-12 h-12 rounded-full bg-red-500/80 backdrop-blur-sm hover:bg-red-500 border-0"
          onClick={onReport}
        >
          <Flag className="w-6 h-6 text-white" />
        </Button>
      </div>

      {/* Bottom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} pointer-events-auto`}>
        <div className="flex items-center justify-center gap-4">
          
          {/* Video Toggle */}
          <Button
            size="lg"
            variant={isVideoEnabled ? "secondary" : "destructive"}
            className="w-14 h-14 rounded-full"
            onClick={onToggleVideo}
          >
            {isVideoEnabled ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </Button>

          {/* Audio Toggle */}
          <Button
            size="lg"
            variant={isAudioEnabled ? "secondary" : "destructive"}
            className="w-14 h-14 rounded-full"
            onClick={onToggleAudio}
          >
            {isAudioEnabled ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </Button>

          {/* End Call */}
          <Button
            size="lg"
            variant="destructive"
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700"
            onClick={onEndCall}
          >
            <PhoneOff className="w-8 h-8" />
          </Button>

          {/* Mute Toggle */}
          <Button
            size="lg"
            variant={isMuted ? "destructive" : "secondary"}
            className="w-14 h-14 rounded-full"
            onClick={onToggleMute}
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6" />
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
          </Button>

          {/* Fullscreen Toggle */}
          {onFullscreen && (
            <Button
              size="lg"
              variant="secondary"
              className="w-14 h-14 rounded-full"
              onClick={onFullscreen}
            >
              {isFullscreen ? (
                <Minimize className="w-6 h-6" />
              ) : (
                <Maximize className="w-6 h-6" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Connection Quality Warning */}
      {connectionQuality === 'poor' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-auto">
          <Badge variant="destructive" className="bg-red-600/90 text-white animate-pulse">
            Poor connection quality
          </Badge>
        </div>
      )}

      {/* Quick Actions Hint */}
      {!showControls && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-black/50 text-white text-xs px-3 py-1 rounded-full animate-pulse">
            Tap screen for controls
          </div>
        </div>
      )}

      {/* Special Effects Overlay */}
      {likeAnimation && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="text-6xl animate-bounce">❤️</div>
          </div>
        </div>
      )}
    </div>
  );
};
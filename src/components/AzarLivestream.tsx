import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLivestream } from '@/hooks/useLivestream';
import { LivestreamChat } from './LivestreamChat';
import { supabase } from '@/integrations/supabase/client';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Settings,
  Users,
  Eye,
  Heart,
  Share,
  MoreVertical,
  Play,
  Square,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  MessageCircle,
  Star,
  Gift,
  Flag,
  UserPlus,
  Copy,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LiveStream } from '@/services/livestreamService';

interface AzarLivestreamProps {
  mode: 'broadcast' | 'view';
  stream?: LiveStream;
  onBack?: () => void;
}

export const AzarLivestream: React.FC<AzarLivestreamProps> = ({
  mode,
  stream,
  onBack
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [streamForm, setStreamForm] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    maxViewers: 1000,
    enableChat: true,
    enableReactions: true,
    visibility: 'community_only' as 'public' | 'community_only',
    communityId: '',
  });
  const [userCommunities, setUserCommunities] = useState<Array<{ id: string; name: string }>>([]);

  const {
    currentStream,
    isBroadcasting,
    isViewing,
    localStream,
    remoteStream,
    viewerCount,
    viewers,
    messages,
    reactions,
    reactionAnimations,
    unreadCount,
    isChatOpen,
    isControlsVisible,
    isSettingsOpen,
    volume,
    isMuted,
    broadcastConfig,
    chatUserProfiles,
    isLoading,
    error,
    createStream,
    startBroadcast,
    stopBroadcast,
    joinStream,
    leaveStream,
    sendMessage,
    sendReaction,
    toggleChat,
    toggleMute,
    setVolume,
    showControls,
    hideControls,
    toggleSettings,
    updateBroadcastConfig,
  } = useLivestream();

  // Set up video streams
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Auto-join stream if in view mode
  useEffect(() => {
    if (mode === 'view' && stream && !isViewing) {
      joinStream(stream.id);
    }
  }, [mode, stream, isViewing, joinStream]);

  // Fetch user communities when in broadcast mode
  useEffect(() => {
    if (mode === 'broadcast') {
      fetchUserCommunities();
    }
  }, [mode]);

  const fetchUserCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          community_id,
          communities (
            id,
            name
          )
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      const communities = data?.map(item => ({
        id: item.communities?.id || '',
        name: item.communities?.name || ''
      })).filter(c => c.id && c.name) || [];

      setUserCommunities(communities);
    } catch (error) {
      console.error('Error fetching user communities:', error);
    }
  };

  const handleCreateStream = async () => {
    try {
      const newStream = await createStream({
        title: streamForm.title,
        description: streamForm.description,
        community_id: streamForm.visibility === 'community_only' ? streamForm.communityId : undefined,
        visibility: streamForm.visibility,
        tags: streamForm.tags,
        max_viewers: streamForm.maxViewers,
        settings: {
          qa_mode: false,
          polls_enabled: true,
          reactions_enabled: streamForm.enableReactions,
          chat_moderation: false,
        }
      });
      
      setShowCreateDialog(false);
      await startBroadcast(newStream.id);
    } catch (error) {
      console.error('Failed to create stream:', error);
    }
  };

  const handleEndStream = async () => {
    if (currentStream) {
      await stopBroadcast(currentStream.id);
    }
    if (onBack) onBack();
  };

  const handleLeaveStream = async () => {
    if (stream) {
      await leaveStream(stream.id);
    }
    if (onBack) onBack();
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

  const handleShare = async () => {
    if (navigator.share && (currentStream || stream)) {
      try {
        await navigator.share({
          title: (currentStream || stream)?.title,
          text: `Watch this live stream: ${(currentStream || stream)?.title}`,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    }
  };

  const renderBroadcastMode = () => (
    <div 
      className="relative w-full h-screen bg-black overflow-hidden"
      onMouseMove={showControls}
      onMouseLeave={hideControls}
    >
      {/* Local Video (Main) */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Stream Info Overlay */}
      {currentStream && (
        <div className="absolute top-4 left-4 z-30">
          <Card className="bg-black/50 border-white/20 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <Avatar className="w-10 h-10 flex-shrink-0 border-2 border-white/30">
                  <AvatarImage src={currentStream.profiles?.avatar_url || "/placeholder-avatar.jpg"} />
                  <AvatarFallback className="bg-white/20 text-white text-sm">
                    {currentStream.profiles?.display_name?.slice(0, 2).toUpperCase() || currentStream.creator_id.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <h3 className="font-semibold">{currentStream.title}</h3>
                  <p className="text-sm text-white/80 mb-1">
                    {currentStream.profiles?.display_name || 'Anonymous Creator'}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-white/80">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{viewerCount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{messages.length}</span>
                    </div>
                    <span>{formatDistanceToNow(new Date(currentStream.actual_start_time || currentStream.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      {(isControlsVisible || !isBroadcasting) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!isBroadcasting ? (
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      <Play className="w-5 h-5 mr-2" />
                      Go Live
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Start Your Livestream</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Stream Title</Label>
                        <Input
                          id="title"
                          value={streamForm.title}
                          onChange={(e) => setStreamForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="What's happening?"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={streamForm.description}
                          onChange={(e) => setStreamForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Tell viewers what to expect..."
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="chat">Enable Chat</Label>
                        <Switch
                          id="chat"
                          checked={streamForm.enableChat}
                          onCheckedChange={(checked) => setStreamForm(prev => ({ ...prev, enableChat: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="reactions">Enable Reactions</Label>
                        <Switch
                          id="reactions"
                          checked={streamForm.enableReactions}
                          onCheckedChange={(checked) => setStreamForm(prev => ({ ...prev, enableReactions: checked }))}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Stream Visibility</Label>
                        <Select
                          value={streamForm.visibility}
                          onValueChange={(value: 'public' | 'community_only') => 
                            setStreamForm(prev => ({ ...prev, visibility: value, communityId: value === 'public' ? '' : prev.communityId }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">🌐 Public - Anyone can watch</SelectItem>
                            <SelectItem value="community_only">🔒 Community Only - Members only</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {streamForm.visibility === 'community_only' && (
                          <div>
                            <Label htmlFor="community">Select Community</Label>
                            <Select
                              value={streamForm.communityId}
                              onValueChange={(value) => setStreamForm(prev => ({ ...prev, communityId: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a community..." />
                              </SelectTrigger>
                              <SelectContent>
                                {userCommunities.map(community => (
                                  <SelectItem key={community.id} value={community.id}>
                                    {community.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {userCommunities.length === 0 && (
                              <p className="text-sm text-gray-500 mt-1">
                                You're not a member of any communities yet.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        onClick={handleCreateStream}
                        disabled={
                          !streamForm.title.trim() || 
                          isLoading || 
                          (streamForm.visibility === 'community_only' && !streamForm.communityId)
                        }
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        {isLoading ? 'Starting...' : 'Start Stream'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  onClick={handleEndStream}
                  variant="destructive"
                  size="lg"
                >
                  <Square className="w-5 h-5 mr-2" />
                  End Stream
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => updateBroadcastConfig({ video: !broadcastConfig.video })}
                className="text-white hover:bg-white/20"
              >
                {broadcastConfig.video ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => updateBroadcastConfig({ audio: !broadcastConfig.audio })}
                className="text-white hover:bg-white/20"
              >
                {broadcastConfig.audio ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={handleShare}
                className="text-white hover:bg-white/20"
              >
                <Share className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Component */}
      {currentStream && streamForm.enableChat && (
        <LivestreamChat
          streamId={currentStream.id}
          messages={messages}
          reactions={reactions}
          reactionAnimations={reactionAnimations}
          isOpen={isChatOpen}
          onClose={toggleChat}
          onSendMessage={(message, type) => sendMessage(currentStream.id, message, type)}
          onSendReaction={(type, position) => sendReaction(currentStream.id, type, position)}
          unreadCount={unreadCount}
          isStreamer={true}
          userProfiles={chatUserProfiles}
        />
      )}

      {!isChatOpen && currentStream && streamForm.enableChat && (
        <Button
          onClick={toggleChat}
          className="fixed bottom-20 right-4 z-50 rounded-full w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[20px] h-5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );

  const renderViewMode = () => (
    <div 
      className="relative w-full h-screen bg-black overflow-hidden"
      onMouseMove={showControls}
      onMouseLeave={hideControls}
    >
      {/* Remote Video (Main) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: remoteStream ? 1 : 0 }}
      />

      {/* Loading State */}
      {!remoteStream && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Connecting to stream...</p>
          </div>
        </div>
      )}

      {/* Stream Info */}
      {stream && (
        <div className="absolute top-4 left-4 z-30">
          <Card className="bg-black/50 border-white/20 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <Avatar className="w-10 h-10 flex-shrink-0 border-2 border-white/30">
                  <AvatarImage src={stream.profiles?.avatar_url || "/placeholder-avatar.jpg"} />
                  <AvatarFallback className="bg-white/20 text-white text-sm">
                    {stream.profiles?.display_name?.slice(0, 2).toUpperCase() || stream.creator_id.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <h3 className="font-semibold">{stream.title}</h3>
                  <p className="text-sm text-white/80 mb-1">
                    {stream.profiles?.display_name || 'Anonymous Creator'}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-white/80">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{viewerCount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{messages.length}</span>
                    </div>
                    <span>{formatDistanceToNow(new Date(stream.actual_start_time || stream.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Viewer Controls */}
      {(isControlsVisible || !isViewing) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleLeaveStream}
                variant="destructive"
                size="lg"
              >
                <PhoneOff className="w-5 h-5 mr-2" />
                Leave
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="lg"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={handleShare}
                className="text-white hover:bg-white/20"
              >
                <Share className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/20"
              >
                <Flag className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Reaction Buttons */}
      <div className="absolute right-4 bottom-32 flex flex-col space-y-3 z-30">
        {['love', 'laugh', 'clap', 'fire'].map((reaction) => (
          <Button
            key={reaction}
            variant="ghost"
            size="lg"
            onClick={(e) => stream && sendReaction(stream.id, reaction as any, {
              x: Math.random() * 100,
              y: Math.random() * 100
            })}
            className="rounded-full w-12 h-12 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md"
          >
            {reaction === 'love' && <Heart className="w-6 h-6" />}
            {reaction === 'laugh' && '😂'}
            {reaction === 'clap' && '👏'}
            {reaction === 'fire' && '🔥'}
          </Button>
        ))}
      </div>

      {/* Chat Component */}
      {stream && (
        <LivestreamChat
          streamId={stream.id}
          messages={messages}
          reactions={reactions}
          reactionAnimations={reactionAnimations}
          isOpen={isChatOpen}
          onClose={toggleChat}
          onSendMessage={(message, type) => sendMessage(stream.id, message, type)}
          onSendReaction={(type, position) => sendReaction(stream.id, type, position)}
          unreadCount={unreadCount}
          isStreamer={false}
          userProfiles={chatUserProfiles}
        />
      )}

      {!isChatOpen && stream && (
        <Button
          onClick={toggleChat}
          className="fixed bottom-20 right-4 z-50 rounded-full w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[20px] h-5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );

  return mode === 'broadcast' ? renderBroadcastMode() : renderViewMode();
};
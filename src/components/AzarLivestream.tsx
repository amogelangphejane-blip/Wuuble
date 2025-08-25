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
import { StreamImageUpload } from './StreamImageUpload';
import { ReactionAnimation } from './ReactionAnimation';
import { supabase } from '@/integrations/supabase/client';
import { StreamImage } from '@/services/streamImageService';
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
  const [streamDisplayImage, setStreamDisplayImage] = useState<StreamImage | null>(null);
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
      
      // Reset form
      setStreamForm({
        title: '',
        description: '',
        tags: [],
        maxViewers: 1000,
        enableChat: true,
        enableReactions: true,
        visibility: 'community_only',
        communityId: '',
      });
      setStreamDisplayImage(null);
      
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
        <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-auto z-30 sm:max-w-sm">
          <Card className="bg-black/60 border-white/10 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="relative flex-shrink-0">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full animate-pulse absolute -top-1 -right-1 z-10 border-2 border-white shadow-lg"></div>
                  <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-3 border-white/40 shadow-lg">
                    <AvatarImage src={currentStream.profiles?.avatar_url || "/placeholder-avatar.jpg"} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-base sm:text-lg font-bold">
                      {currentStream.profiles?.display_name?.slice(0, 2).toUpperCase() || currentStream.creator_id.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-white flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg mb-1 line-clamp-2 leading-tight">{currentStream.title}</h3>
                  <p className="text-xs sm:text-sm text-white/90 mb-2 sm:mb-3 font-medium">
                    {currentStream.profiles?.display_name || 'Anonymous Creator'}
                  </p>
                  <div className="flex flex-wrap gap-2 sm:grid sm:grid-cols-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="flex items-center space-x-1.5 sm:space-x-2 bg-white/10 rounded-full px-2 py-1 sm:px-3 sm:py-1.5">
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                      <span className="font-semibold">{viewerCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 bg-white/10 rounded-full px-2 py-1 sm:px-3 sm:py-1.5">
                      <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                      <span className="font-semibold">{messages.length.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 text-xs text-white/70 bg-white/10 rounded-full px-2 py-1 sm:px-3 sm:py-1 inline-block">
                    Started {formatDistanceToNow(new Date(currentStream.actual_start_time || currentStream.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      {(isControlsVisible || !isBroadcasting) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 sm:p-8 z-30">
          <div className="flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto gap-4 sm:gap-0">
            <div className="flex items-center space-x-4 sm:space-x-6">
              {!isBroadcasting ? (
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-4 text-lg font-semibold">
                      <Play className="w-6 h-6 mr-3" />
                      Go Live
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="text-center pb-4">
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        🎥 Start Your Livestream
                      </DialogTitle>
                      <p className="text-gray-600 mt-2">Share your content with the world and connect with your audience</p>
                    </DialogHeader>
                    <div className="space-y-6 animate-fadeInUp">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <Label htmlFor="title" className="text-base font-semibold">Stream Title *</Label>
                          <Input
                            id="title"
                            value={streamForm.title}
                            onChange={(e) => setStreamForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="What amazing content are you sharing today?"
                            className="mt-2 text-base py-3 border-2 focus:border-purple-400 transition-colors"
                            maxLength={100}
                          />
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-500">Make it catchy and descriptive</span>
                            <span className={`text-xs ${streamForm.title.length > 80 ? 'text-red-500' : 'text-gray-400'}`}>
                              {streamForm.title.length}/100
                            </span>
                          </div>
                        </div>
                        
                        <div className="md:col-span-2">
                          <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                          <Textarea
                            id="description"
                            value={streamForm.description}
                            onChange={(e) => setStreamForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Tell viewers what to expect, what you'll be discussing, or any special guests..."
                            rows={4}
                            className="mt-2 text-base border-2 focus:border-purple-400 transition-colors"
                            maxLength={500}
                          />
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-500">Help viewers understand what your stream is about</span>
                            <span className={`text-xs ${streamForm.description.length > 400 ? 'text-red-500' : 'text-gray-400'}`}>
                              {streamForm.description.length}/500
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Display Image Upload */}
                      <div>
                        <Label>Stream Thumbnail</Label>
                        <p className="text-sm text-gray-500 mb-3">
                          Create or upload a custom thumbnail that viewers will see on the discover page
                        </p>
                        <StreamImageUpload
                          currentImage={streamDisplayImage?.image_url}
                          onImageUploaded={(imageUrl) => setStreamDisplayImage({ image_url: imageUrl } as any)}
                          onImageRemoved={() => setStreamDisplayImage(null)}
                          showPreview={true}
                          maxSizeMB={3}
                          streamTitle={streamForm.title}
                          streamDescription={streamForm.description}
                          creatorName="You" // Could be fetched from user profile
                          showGenerator={true}
                        />
                      </div>
                      {/* Stream Settings */}
                      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stream Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors">
                            <div className="flex-1">
                              <Label htmlFor="chat" className="text-base font-medium">Enable Chat</Label>
                              <p className="text-sm text-gray-500 mt-1">Allow viewers to send messages</p>
                            </div>
                            <Switch
                              id="chat"
                              checked={streamForm.enableChat}
                              onCheckedChange={(checked) => setStreamForm(prev => ({ ...prev, enableChat: checked }))}
                              className="ml-4"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors">
                            <div className="flex-1">
                              <Label htmlFor="reactions" className="text-base font-medium">Enable Reactions</Label>
                              <p className="text-sm text-gray-500 mt-1">Allow emoji reactions from viewers</p>
                            </div>
                            <Switch
                              id="reactions"
                              checked={streamForm.enableReactions}
                              onCheckedChange={(checked) => setStreamForm(prev => ({ ...prev, enableReactions: checked }))}
                              className="ml-4"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Visibility Settings */}
                      <div className="bg-purple-50 rounded-lg p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Who Can Watch?</h3>
                        <div className="space-y-4">
                          <Select
                            value={streamForm.visibility}
                            onValueChange={(value: 'public' | 'community_only') => 
                              setStreamForm(prev => ({ ...prev, visibility: value, communityId: value === 'public' ? '' : prev.communityId }))
                            }
                          >
                            <SelectTrigger className="border-2 border-purple-200 focus:border-purple-400 py-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">
                                <div className="flex items-center space-x-3 py-2">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    🌐
                                  </div>
                                  <div>
                                    <div className="font-medium">Public Stream</div>
                                    <div className="text-sm text-gray-500">Anyone can discover and watch</div>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="community_only">
                                <div className="flex items-center space-x-3 py-2">
                                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    🔒
                                  </div>
                                  <div>
                                    <div className="font-medium">Community Only</div>
                                    <div className="text-sm text-gray-500">Only community members can watch</div>
                                  </div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {streamForm.visibility === 'community_only' && (
                            <div className="animate-slideInRight">
                              <Label htmlFor="community" className="text-base font-medium">Select Community</Label>
                              <Select
                                value={streamForm.communityId}
                                onValueChange={(value) => setStreamForm(prev => ({ ...prev, communityId: value }))}
                              >
                                <SelectTrigger className="mt-2 border-2 border-purple-200 focus:border-purple-400 py-3">
                                  <SelectValue placeholder="Choose a community..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {userCommunities.map(community => (
                                    <SelectItem key={community.id} value={community.id}>
                                      <div className="flex items-center space-x-2">
                                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                          {community.name.charAt(0)}
                                        </div>
                                        <span>{community.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {userCommunities.length === 0 && (
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <p className="text-sm text-yellow-800">
                                    💡 You're not a member of any communities yet. Join a community to stream exclusively to its members!
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Ready to Go Live?</h3>
                            <p className="text-sm text-gray-600">Make sure everything looks good before starting</p>
                          </div>
                          <div className="text-2xl">🚀</div>
                        </div>
                        
                        {/* Validation Checklist */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div className={`flex items-center space-x-2 ${streamForm.title.trim() ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${streamForm.title.trim() ? 'bg-green-100' : 'bg-gray-100'}`}>
                              {streamForm.title.trim() ? '✓' : '○'}
                            </div>
                            <span>Title Added</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${streamDisplayImage ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${streamDisplayImage ? 'bg-green-100' : 'bg-gray-100'}`}>
                              {streamDisplayImage ? '✓' : '○'}
                            </div>
                            <span>Thumbnail Set</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${streamForm.visibility === 'public' || streamForm.communityId ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${streamForm.visibility === 'public' || streamForm.communityId ? 'bg-green-100' : 'bg-gray-100'}`}>
                              {streamForm.visibility === 'public' || streamForm.communityId ? '✓' : '○'}
                            </div>
                            <span>Audience Set</span>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleCreateStream}
                          disabled={
                            !streamForm.title.trim() || 
                            isLoading || 
                            (streamForm.visibility === 'community_only' && !streamForm.communityId)
                          }
                          className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Starting Your Stream...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-2">
                              <Play className="w-6 h-6" />
                              <span>Start Livestream</span>
                            </div>
                          )}
                        </Button>
                        
                        {(!streamForm.title.trim() || (streamForm.visibility === 'community_only' && !streamForm.communityId)) && (
                          <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            {!streamForm.title.trim() && "Please add a title for your stream"}
                            {streamForm.visibility === 'community_only' && !streamForm.communityId && "Please select a community for your private stream"}
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  onClick={handleEndStream}
                  variant="destructive"
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 shadow-xl hover:shadow-2xl transition-all duration-300 px-6 py-3 font-semibold"
                >
                  <Square className="w-5 h-5 mr-2" />
                  End Stream
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => updateBroadcastConfig({ video: !broadcastConfig.video })}
                className={`text-white hover:bg-white/20 transition-all duration-300 w-12 h-12 sm:w-14 sm:h-14 rounded-full backdrop-blur-md ${
                  broadcastConfig.video ? 'bg-white/10' : 'bg-red-500/20'
                }`}
              >
                {broadcastConfig.video ? <Video className="w-5 h-5 sm:w-7 sm:h-7" /> : <VideoOff className="w-5 h-5 sm:w-7 sm:h-7" />}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => updateBroadcastConfig({ audio: !broadcastConfig.audio })}
                className={`text-white hover:bg-white/20 transition-all duration-300 w-12 h-12 sm:w-14 sm:h-14 rounded-full backdrop-blur-md ${
                  broadcastConfig.audio ? 'bg-white/10' : 'bg-red-500/20'
                }`}
              >
                {broadcastConfig.audio ? <Mic className="w-5 h-5 sm:w-7 sm:h-7" /> : <MicOff className="w-5 h-5 sm:w-7 sm:h-7" />}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20 transition-all duration-300 w-12 h-12 sm:w-14 sm:h-14 rounded-full backdrop-blur-md bg-white/10"
              >
                {isFullscreen ? <Minimize className="w-5 h-5 sm:w-7 sm:h-7" /> : <Maximize className="w-5 h-5 sm:w-7 sm:h-7" />}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={handleShare}
                className="text-white hover:bg-white/20 transition-all duration-300 w-12 h-12 sm:w-14 sm:h-14 rounded-full backdrop-blur-md bg-white/10"
              >
                <Share className="w-5 h-5 sm:w-7 sm:h-7" />
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
          className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 rounded-full w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 backdrop-blur-md border border-white/20 animate-pulse-glow"
        >
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white min-w-[20px] h-5 sm:min-w-[24px] sm:h-6 text-xs sm:text-sm font-bold shadow-lg animate-bounce">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Reaction Animations */}
      <ReactionAnimation 
        reactions={reactionAnimations.map(r => ({
          id: r.id,
          type: r.reaction_type,
          x: r.position?.x || Math.random() * 80 + 10,
          y: r.position?.y || Math.random() * 80 + 10,
          timestamp: new Date(r.created_at).getTime()
        }))}
      />
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
        <div className="absolute top-6 left-6 z-30 max-w-sm">
          <Card className="bg-black/60 border-white/10 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-5">
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse absolute -top-1 -right-1 z-10 border-2 border-white shadow-lg"></div>
                  <Avatar className="w-14 h-14 flex-shrink-0 border-3 border-white/40 shadow-lg">
                    <AvatarImage src={stream.profiles?.avatar_url || "/placeholder-avatar.jpg"} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg font-bold">
                      {stream.profiles?.display_name?.slice(0, 2).toUpperCase() || stream.creator_id.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-white flex-1">
                  <h3 className="font-bold text-lg mb-1 line-clamp-2 leading-tight">{stream.title}</h3>
                  <p className="text-sm text-white/90 mb-3 font-medium">
                    {stream.profiles?.display_name || 'Anonymous Creator'}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2 bg-white/10 rounded-full px-3 py-1.5">
                      <Eye className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold">{viewerCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white/10 rounded-full px-3 py-1.5">
                      <MessageCircle className="w-4 h-4 text-green-400" />
                      <span className="font-semibold">{messages.length.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-white/70 bg-white/10 rounded-full px-3 py-1 inline-block">
                    Started {formatDistanceToNow(new Date(stream.actual_start_time || stream.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Viewer Controls */}
      {(isControlsVisible || !isViewing) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-8 z-30">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-6">
              <Button
                onClick={handleLeaveStream}
                variant="destructive"
                size="lg"
                className="bg-red-600 hover:bg-red-700 shadow-xl hover:shadow-2xl transition-all duration-300 px-6 py-3 font-semibold"
              >
                <PhoneOff className="w-5 h-5 mr-2" />
                Leave Stream
              </Button>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="lg"
                onClick={toggleMute}
                className={`text-white hover:bg-white/20 transition-all duration-300 w-14 h-14 rounded-full backdrop-blur-md ${
                  isMuted ? 'bg-red-500/20' : 'bg-white/10'
                }`}
              >
                {isMuted ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20 transition-all duration-300 w-14 h-14 rounded-full backdrop-blur-md bg-white/10"
              >
                {isFullscreen ? <Minimize className="w-7 h-7" /> : <Maximize className="w-7 h-7" />}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={handleShare}
                className="text-white hover:bg-white/20 transition-all duration-300 w-14 h-14 rounded-full backdrop-blur-md bg-white/10"
              >
                <Share className="w-7 h-7" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/20 transition-all duration-300 w-14 h-14 rounded-full backdrop-blur-md bg-white/10"
              >
                <Flag className="w-7 h-7" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Reaction Buttons */}
      <div className="absolute right-4 sm:right-6 bottom-32 sm:bottom-36 flex flex-col space-y-3 sm:space-y-4 z-30">
        {[
          { type: 'love', icon: <Heart className="w-5 h-5 sm:w-6 sm:h-6" />, color: 'from-red-500 to-pink-500' },
          { type: 'laugh', icon: '😂', color: 'from-yellow-400 to-orange-500' },
          { type: 'clap', icon: '👏', color: 'from-green-400 to-emerald-500' },
          { type: 'fire', icon: '🔥', color: 'from-orange-500 to-red-500' }
        ].map((reaction) => (
          <Button
            key={reaction.type}
            variant="ghost"
            size="lg"
            onClick={(e) => stream && sendReaction(stream.id, reaction.type as any, {
              x: Math.random() * 100,
              y: Math.random() * 100
            })}
            className={`rounded-full w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${reaction.color} hover:scale-110 text-white backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/30`}
          >
            {typeof reaction.icon === 'string' ? (
              <span className="text-lg sm:text-2xl">{reaction.icon}</span>
            ) : (
              reaction.icon
            )}
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
          className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 rounded-full w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 backdrop-blur-md border border-white/20 animate-pulse-glow"
        >
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white min-w-[20px] h-5 sm:min-w-[24px] sm:h-6 text-xs sm:text-sm font-bold shadow-lg animate-bounce">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Reaction Animations */}
      <ReactionAnimation 
        reactions={reactionAnimations.map(r => ({
          id: r.id,
          type: r.reaction_type,
          x: r.position?.x || Math.random() * 80 + 10,
          y: r.position?.y || Math.random() * 80 + 10,
          timestamp: new Date(r.created_at).getTime()
        }))}
      />
    </div>
  );

  return mode === 'broadcast' ? renderBroadcastMode() : renderViewMode();
};
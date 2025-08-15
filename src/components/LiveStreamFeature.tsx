import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Radio,
  Play,
  Square,
  Users,
  Eye,
  MessageCircle,
  Heart,
  Share,
  Settings,
  Calendar,
  Clock,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  Camera,
  Volume2,
  VolumeX,
  Maximize,
  Send,
  ThumbsUp,
  Smile,
  Star
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { validateAvatarUrl } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  creator_id: string;
  scheduled_start_time: string | null;
  actual_start_time: string | null;
  viewer_count: number;
  max_viewers: number;
  thumbnail_url: string | null;
  created_at: string;
  creator_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface StreamChat {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface LiveStreamFeatureProps {
  communityId: string;
  communityName: string;
  isMember: boolean;
  isCreator: boolean;
}

export const LiveStreamFeature = ({ communityId, communityName, isMember, isCreator }: LiveStreamFeatureProps) => {
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [upcomingStreams, setUpcomingStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [createStreamDialogOpen, setCreateStreamDialogOpen] = useState(false);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [streamChat, setStreamChat] = useState<StreamChat[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamSettings, setStreamSettings] = useState({
    video: true,
    audio: true,
    screenShare: false
  });

  const [newStream, setNewStream] = useState({
    title: '',
    description: '',
    scheduled_start_time: '',
    max_viewers: 1000
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Fetch active and upcoming streams
  const fetchStreams = async () => {
    if (!isMember) return;

    try {
      const { data: streams, error } = await supabase
        .from('live_streams')
        .select(`
          *,
          profiles!live_streams_creator_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', communityId)
        .in('status', ['live', 'scheduled'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const streamsWithProfiles = (streams || []).map(stream => ({
        ...stream,
        creator_profile: stream.profiles
      }));

      setActiveStreams(streamsWithProfiles.filter(s => s.status === 'live'));
      setUpcomingStreams(streamsWithProfiles.filter(s => s.status === 'scheduled'));
    } catch (error: any) {
      console.error('Error fetching streams:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new stream
  const createStream = async () => {
    if (!user || !newStream.title.trim()) return;

    try {
      const scheduledTime = newStream.scheduled_start_time 
        ? new Date(newStream.scheduled_start_time).toISOString()
        : null;

      const { data: stream, error } = await supabase
        .from('live_streams')
        .insert([{
          community_id: communityId,
          creator_id: user.id,
          title: newStream.title.trim(),
          description: newStream.description.trim() || null,
          scheduled_start_time: scheduledTime,
          max_viewers: newStream.max_viewers,
          status: scheduledTime ? 'scheduled' : 'live'
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Stream ${scheduledTime ? 'scheduled' : 'created'} successfully`
      });

      setCreateStreamDialogOpen(false);
      setNewStream({ title: '', description: '', scheduled_start_time: '', max_viewers: 1000 });
      fetchStreams();

      // If starting immediately, open stream viewer
      if (!scheduledTime) {
        setSelectedStream({ ...stream, creator_profile: null });
      }
    } catch (error: any) {
      console.error('Error creating stream:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create stream",
        variant: "destructive"
      });
    }
  };

  // Start streaming (mock implementation - would integrate with actual streaming service)
  const startStreaming = async (streamId: string) => {
    try {
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: streamSettings.video, 
        audio: streamSettings.audio 
      });
      
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Update stream status to live
      await supabase
        .from('live_streams')
        .update({ 
          status: 'live',
          actual_start_time: new Date().toISOString()
        })
        .eq('id', streamId);

      setIsStreaming(true);
      toast({
        title: "Stream Started!",
        description: "You're now live streaming to your community"
      });

      fetchStreams();
    } catch (error: any) {
      console.error('Error starting stream:', error);
      toast({
        title: "Error",
        description: "Failed to start stream. Please check your camera and microphone permissions.",
        variant: "destructive"
      });
    }
  };

  // Stop streaming
  const stopStreaming = async (streamId: string) => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      await supabase
        .from('live_streams')
        .update({ 
          status: 'ended',
          end_time: new Date().toISOString()
        })
        .eq('id', streamId);

      setIsStreaming(false);
      setSelectedStream(null);
      
      toast({
        title: "Stream Ended",
        description: "Your live stream has ended successfully"
      });

      fetchStreams();
    } catch (error: any) {
      console.error('Error stopping stream:', error);
      toast({
        title: "Error",
        description: "Failed to stop stream",
        variant: "destructive"
      });
    }
  };

  // Join stream as viewer
  const joinStream = async (stream: LiveStream) => {
    if (!user) return;

    try {
      // Add user as viewer
      await supabase
        .from('stream_viewers')
        .upsert({
          stream_id: stream.id,
          user_id: user.id,
          is_active: true
        });

      setSelectedStream(stream);
      fetchStreamChat(stream.id);
    } catch (error: any) {
      console.error('Error joining stream:', error);
    }
  };

  // Fetch stream chat messages
  const fetchStreamChat = async (streamId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('stream_chat')
        .select(`
          *,
          profiles!stream_chat_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      setStreamChat(messages || []);
    } catch (error: any) {
      console.error('Error fetching chat:', error);
    }
  };

  // Send chat message
  const sendMessage = async () => {
    if (!user || !selectedStream || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('stream_chat')
        .insert([{
          stream_id: selectedStream.id,
          user_id: user.id,
          message: newMessage.trim()
        }]);

      if (error) throw error;

      setNewMessage('');
      fetchStreamChat(selectedStream.id);
    } catch (error: any) {
      console.error('Error sending message:', error);
    }
  };

  // Toggle stream settings
  const toggleSetting = (setting: 'video' | 'audio' | 'screenShare') => {
    setStreamSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));

    if (mediaStreamRef.current) {
      if (setting === 'video') {
        mediaStreamRef.current.getVideoTracks().forEach(track => {
          track.enabled = !streamSettings.video;
        });
      } else if (setting === 'audio') {
        mediaStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !streamSettings.audio;
        });
      }
    }
  };

  useEffect(() => {
    fetchStreams();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchStreams, 10000);
    return () => clearInterval(interval);
  }, [communityId, isMember]);

  // Real-time chat updates
  useEffect(() => {
    if (!selectedStream) return;

    const channel = supabase
      .channel(`stream_chat_${selectedStream.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'stream_chat',
        filter: `stream_id=eq.${selectedStream.id}`
      }, () => {
        fetchStreamChat(selectedStream.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedStream]);

  if (!isMember) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Radio className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Join to access live streams</h3>
          <p className="text-muted-foreground">
            Become a member to watch and create live streams in this community.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Streaming Header */}
      <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500" />
            Live Streaming
          </CardTitle>
          <CardDescription>
            Create and watch live streams with your community members
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stream Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create Stream */}
        <Dialog open={createStreamDialogOpen} onOpenChange={setCreateStreamDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-16 flex-col gap-2 bg-red-600 hover:bg-red-700">
              <Radio className="w-6 h-6" />
              <span>Start Live Stream</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Live Stream</DialogTitle>
              <DialogDescription>
                Start streaming live to your community members
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Stream Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Weekly Q&A Session, Tutorial Live"
                  value={newStream.title}
                  onChange={(e) => setNewStream({ ...newStream, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What will you be streaming about?"
                  value={newStream.description}
                  onChange={(e) => setNewStream({ ...newStream, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_time">Schedule for Later (Optional)</Label>
                <Input
                  id="scheduled_time"
                  type="datetime-local"
                  value={newStream.scheduled_start_time}
                  onChange={(e) => setNewStream({ ...newStream, scheduled_start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_viewers">Max Viewers</Label>
                <select
                  id="max_viewers"
                  value={newStream.max_viewers}
                  onChange={(e) => setNewStream({ ...newStream, max_viewers: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={100}>100 viewers</option>
                  <option value={500}>500 viewers</option>
                  <option value={1000}>1,000 viewers</option>
                  <option value={5000}>5,000 viewers</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={createStream}
                disabled={!newStream.title.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <Radio className="w-4 h-4 mr-2" />
                {newStream.scheduled_start_time ? 'Schedule Stream' : 'Start Stream'}
              </Button>
              <Button 
                onClick={() => setCreateStreamDialogOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Browse Streams */}
        <Button 
          size="lg" 
          variant="outline" 
          className="h-16 flex-col gap-2"
          onClick={() => {/* Could navigate to a dedicated streams page */}}
        >
          <Eye className="w-6 h-6" />
          <span>Browse All Streams</span>
        </Button>
      </div>

      {/* Active Streams */}
      {activeStreams.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            Live Now ({activeStreams.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeStreams.map((stream) => (
              <Card key={stream.id} className="border-red-200 bg-red-50/50 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={validateAvatarUrl(stream.creator_profile?.avatar_url)} 
                          alt={stream.creator_profile?.display_name || 'Streamer'}
                        />
                        <AvatarFallback>
                          {(stream.creator_profile?.display_name || 'S').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">
                          {stream.creator_profile?.display_name || 'Anonymous'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Started {formatDistanceToNow(new Date(stream.actual_start_time || stream.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      <div className="w-2 h-2 bg-white rounded-full mr-1"></div>
                      LIVE
                    </Badge>
                  </div>
                  
                  <h4 className="font-semibold mb-2 line-clamp-2">{stream.title}</h4>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {stream.viewer_count} watching
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Max {stream.max_viewers}
                    </span>
                  </div>
                  
                  <Button 
                    onClick={() => joinStream(stream)}
                    size="sm"
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Stream
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Streams */}
      {upcomingStreams.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Upcoming Streams ({upcomingStreams.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingStreams.map((stream) => (
              <Card key={stream.id} className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={validateAvatarUrl(stream.creator_profile?.avatar_url)} 
                          alt={stream.creator_profile?.display_name || 'Streamer'}
                        />
                        <AvatarFallback>
                          {(stream.creator_profile?.display_name || 'S').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">
                          {stream.creator_profile?.display_name || 'Anonymous'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {stream.scheduled_start_time 
                            ? formatDistanceToNow(new Date(stream.scheduled_start_time), { addSuffix: true })
                            : 'Soon'
                          }
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      SCHEDULED
                    </Badge>
                  </div>
                  
                  <h4 className="font-semibold mb-2 line-clamp-2">{stream.title}</h4>
                  
                  {stream.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {stream.description}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Star className="w-4 h-4 mr-2" />
                      Remind Me
                    </Button>
                    {stream.creator_id === user?.id && (
                      <Button 
                        size="sm" 
                        onClick={() => startStreaming(stream.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Stream Viewer Modal */}
      {selectedStream && (
        <Dialog open={!!selectedStream} onOpenChange={() => setSelectedStream(null)}>
          <DialogContent className="sm:max-w-[900px] h-[600px] p-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
              {/* Video Area */}
              <div className="lg:col-span-2 bg-black relative">
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted={selectedStream.creator_id !== user?.id}
                  playsInline
                />
                
                {/* Stream Controls (for streamers) */}
                {selectedStream.creator_id === user?.id && (
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant={streamSettings.video ? "default" : "secondary"}
                        onClick={() => toggleSetting('video')}
                      >
                        {streamSettings.video ? <Camera className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                      </Button>
                      <Button 
                        size="sm" 
                        variant={streamSettings.audio ? "default" : "secondary"}
                        onClick={() => toggleSetting('audio')}
                      >
                        {streamSettings.audio ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toggleSetting('screenShare')}
                      >
                        <Monitor className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => stopStreaming(selectedStream.id)}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      End Stream
                    </Button>
                  </div>
                )}

                {/* Stream Info Overlay */}
                <div className="absolute top-4 left-4 right-4">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
                    <h3 className="font-semibold mb-1">{selectedStream.title}</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {selectedStream.viewer_count} watching
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        LIVE
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Area */}
              <div className="bg-background border-l flex flex-col">
                <div className="p-4 border-b">
                  <h4 className="font-semibold">Live Chat</h4>
                </div>
                
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {streamChat.map((message) => (
                    <div key={message.id} className="flex gap-2 text-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarImage 
                          src={validateAvatarUrl(message.profiles?.avatar_url)} 
                          alt={message.profiles?.display_name || 'User'}
                        />
                        <AvatarFallback className="text-xs">
                          {(message.profiles?.display_name || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-xs text-muted-foreground">
                          {message.profiles?.display_name || 'Anonymous'}
                        </div>
                        <div>{message.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Chat Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={sendMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Help Section */}
      {activeStreams.length === 0 && upcomingStreams.length === 0 && (
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center">
            <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-semibold mb-2">No Active Streams</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Be the first to start a live stream in this community! Share your knowledge, 
              host Q&A sessions, or just hang out with fellow members.
            </p>
            <Button 
              onClick={() => setCreateStreamDialogOpen(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Radio className="w-4 h-4 mr-2" />
              Start Your First Stream
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
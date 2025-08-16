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
  Star,
  Gift,
  Sparkles,
  Zap,
  UserPlus,
  MoreHorizontal,
  Filter,
  Palette,
  X,
  Pin,
  Flag,
  Shield
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
  message_type?: 'text' | 'emoji' | 'system' | 'question';
  is_pinned?: boolean;
  reply_to_id?: string | null;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface StreamPoll {
  id: string;
  stream_id: string;
  question: string;
  options: string[];
  votes: { [option: string]: number };
  is_active: boolean;
  created_at: string;
}

interface StreamQuestion {
  id: string;
  stream_id: string;
  user_id: string;
  question: string;
  is_answered: boolean;
  likes: number;
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface LiveReaction {
  id: string;
  emoji: string;
  x: number;
  y: number;
  timestamp: number;
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
  const [streamQuestions, setStreamQuestions] = useState<StreamQuestion[]>([]);
  const [activePoll, setActivePoll] = useState<StreamPoll | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveReactions, setLiveReactions] = useState<LiveReaction[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showQAPanel, setShowQAPanel] = useState(false);
  const [showPollPanel, setShowPollPanel] = useState(false);
  const [chatFilter, setChatFilter] = useState<'all' | 'questions' | 'pinned'>('all');
  const [streamSettings, setStreamSettings] = useState({
    video: true,
    audio: true,
    screenShare: false,
    beauty: false,
    filter: 'none',
    qaMode: false,
    moderationMode: false
  });

  const [newStream, setNewStream] = useState({
    title: '',
    description: '',
    scheduled_start_time: '',
    max_viewers: 1000
  });

  // Available reaction emojis
  const reactionEmojis = ['❤️', '😍', '😂', '😮', '😢', '👏', '🔥', '💯', '🎉', '👍', '👎', '😡'];
  const filters = ['none', 'warm', 'cool', 'vintage', 'dramatic', 'soft'];

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [streamChat]);

  // Clean up reactions after animation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setLiveReactions(prev => prev.filter(reaction => now - reaction.timestamp < 3000));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Add live reaction
  const addReaction = (emoji: string) => {
    const reaction: LiveReaction = {
      id: Math.random().toString(36).substr(2, 9),
      emoji,
      x: Math.random() * 80 + 10, // Random position between 10% and 90%
      y: Math.random() * 20 + 70, // Start from bottom 70-90%
      timestamp: Date.now()
    };
    
    setLiveReactions(prev => [...prev, reaction]);
    setShowReactionPicker(false);

    // Send reaction to chat as well
    if (selectedStream && user) {
      sendChatMessage(emoji, 'emoji');
    }
  };

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
        title: "🎉 Stream Created!",
        description: `Your stream ${scheduledTime ? 'has been scheduled' : 'is starting now'}`,
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
        title: "❌ Error",
        description: error.message || "Failed to create stream",
        variant: "destructive"
      });
    }
  };

  // Start streaming with modern setup
  const startStreaming = async (streamId: string) => {
    try {
      // Request camera and microphone access with better constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user'
        }, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
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
        title: "🔴 You're Live!",
        description: "Your stream is now broadcasting to the community"
      });

      fetchStreams();
    } catch (error: any) {
      console.error('Error starting stream:', error);
      toast({
        title: "❌ Camera Access Required",
        description: "Please allow camera and microphone access to start streaming",
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
        title: "📱 Stream Ended",
        description: "Thanks for streaming! Your content was amazing."
      });

      fetchStreams();
    } catch (error: any) {
      console.error('Error stopping stream:', error);
      toast({
        title: "❌ Error",
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
      fetchStreamQuestions(stream.id);
      fetchActivePoll(stream.id);
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
        .limit(100);

      if (error) throw error;

      setStreamChat(messages || []);
    } catch (error: any) {
      console.error('Error fetching chat:', error);
    }
  };

  // Enhanced send message function with Q&A support
  const sendChatMessage = async (message?: string, messageType: 'text' | 'emoji' | 'system' | 'question' = 'text') => {
    if (!user || !selectedStream) return;
    
    const messageContent = message || newMessage.trim();
    if (!messageContent) return;

    try {
      const { error } = await supabase
        .from('stream_chat')
        .insert([{
          stream_id: selectedStream.id,
          user_id: user.id,
          message: messageContent,
          message_type: messageType,
          is_pinned: false
        }]);

      if (error) throw error;

      if (messageType === 'text') {
        setNewMessage('');
      }
      fetchStreamChat(selectedStream.id);
    } catch (error: any) {
      console.error('Error sending message:', error);
    }
  };

  // Submit Q&A question
  const submitQuestion = async () => {
    if (!user || !selectedStream || !newQuestion.trim()) return;

    try {
      const { error } = await supabase
        .from('stream_questions')
        .insert([{
          stream_id: selectedStream.id,
          user_id: user.id,
          question: newQuestion.trim(),
          is_answered: false,
          likes: 0
        }]);

      if (error) throw error;

      setNewQuestion('');
      fetchStreamQuestions(selectedStream.id);
      
      toast({
        title: "❓ Question Submitted!",
        description: "Your question has been added to the Q&A queue"
      });
    } catch (error: any) {
      console.error('Error submitting question:', error);
    }
  };

  // Fetch stream questions
  const fetchStreamQuestions = async (streamId: string) => {
    try {
      const { data: questions, error } = await supabase
        .from('stream_questions')
        .select(`
          *,
          profiles!stream_questions_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('stream_id', streamId)
        .order('likes', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      setStreamQuestions(questions || []);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
    }
  };

  // Like a question
  const likeQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('stream_questions')
        .update({ likes: streamQuestions.find(q => q.id === questionId)?.likes + 1 || 1 })
        .eq('id', questionId);

      if (error) throw error;
      
      if (selectedStream) {
        fetchStreamQuestions(selectedStream.id);
      }
    } catch (error: any) {
      console.error('Error liking question:', error);
    }
  };

  // Pin/unpin message (streamer only)
  const togglePinMessage = async (messageId: string, isPinned: boolean) => {
    if (selectedStream?.creator_id !== user?.id) return;

    try {
      const { error } = await supabase
        .from('stream_chat')
        .update({ is_pinned: !isPinned })
        .eq('id', messageId);

      if (error) throw error;
      
      fetchStreamChat(selectedStream.id);
    } catch (error: any) {
      console.error('Error toggling pin:', error);
    }
  };

  // Create a poll (streamer only)
  const createPoll = async (question: string, options: string[]) => {
    if (!user || !selectedStream || selectedStream.creator_id !== user.id) return;

    try {
      const { error } = await supabase
        .from('stream_polls')
        .insert([{
          stream_id: selectedStream.id,
          question,
          options,
          votes: options.reduce((acc, option) => ({ ...acc, [option]: 0 }), {}),
          is_active: true
        }]);

      if (error) throw error;

      fetchActivePoll(selectedStream.id);
      toast({
        title: "📊 Poll Created!",
        description: "Your poll is now live for viewers to vote"
      });
    } catch (error: any) {
      console.error('Error creating poll:', error);
    }
  };

  // Fetch active poll
  const fetchActivePoll = async (streamId: string) => {
    try {
      const { data: poll, error } = await supabase
        .from('stream_polls')
        .select('*')
        .eq('stream_id', streamId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setActivePoll(poll || null);
    } catch (error: any) {
      console.error('Error fetching poll:', error);
    }
  };

  // Vote on poll
  const voteOnPoll = async (option: string) => {
    if (!activePoll || !user) return;

    try {
      const newVotes = { ...activePoll.votes, [option]: (activePoll.votes[option] || 0) + 1 };
      
      const { error } = await supabase
        .from('stream_polls')
        .update({ votes: newVotes })
        .eq('id', activePoll.id);

      if (error) throw error;

      setActivePoll({ ...activePoll, votes: newVotes });
    } catch (error: any) {
      console.error('Error voting on poll:', error);
    }
  };

  // Filter chat messages based on current filter
  const filteredChat = streamChat.filter(message => {
    switch (chatFilter) {
      case 'questions':
        return message.message_type === 'question';
      case 'pinned':
        return message.is_pinned;
      default:
        return true;
    }
  });

  // Toggle stream settings
  const toggleSetting = (setting: keyof typeof streamSettings) => {
    setStreamSettings(prev => ({
      ...prev,
      [setting]: setting === 'filter' ? prev.filter : !prev[setting]
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
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10"></div>
        <CardContent className="relative text-center py-16 px-8">
          <div className="relative">
            <Radio className="w-20 h-20 text-red-500 mx-auto mb-6 animate-pulse" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-ping"></div>
          </div>
          <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-red-600 bg-clip-text text-transparent">
            Join to Go Live!
          </h3>
          <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
            Become a member to create amazing live streams and connect with your community in real-time.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span>Interactive features • Live reactions • Real-time chat</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modern Live Streaming Header */}
      <Card className="border-0 bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="relative">
              <Radio className="w-8 h-8" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse"></div>
            </div>
            Live Streaming
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Instagram-Style
            </Badge>
          </CardTitle>
          <CardDescription className="text-white/90 text-lg">
            Create engaging live streams with modern features and real-time interactions
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Enhanced Stream Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Stream - Instagram Style */}
        <Dialog open={createStreamDialogOpen} onOpenChange={setCreateStreamDialogOpen}>
          <DialogTrigger asChild>
            <Card className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
              <CardContent className="p-8 text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Radio className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full animate-bounce flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Go Live</h3>
                <p className="text-muted-foreground">Start streaming instantly or schedule for later</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Radio className="w-6 h-6" />
                  Create Live Stream
                </DialogTitle>
                <DialogDescription className="text-white/90">
                  Set up your live stream with modern features and reach your community
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-lg font-semibold">Stream Title</Label>
                <Input
                  id="title"
                  placeholder="What's your stream about? Make it catchy! ✨"
                  value={newStream.title}
                  onChange={(e) => setNewStream({ ...newStream, title: e.target.value })}
                  className="text-lg p-4 border-2 focus:border-red-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-lg font-semibold">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell your audience what to expect... 🎥"
                  value={newStream.description}
                  onChange={(e) => setNewStream({ ...newStream, description: e.target.value })}
                  rows={3}
                  className="resize-none border-2 focus:border-red-300"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_time" className="text-lg font-semibold">Schedule (Optional)</Label>
                  <Input
                    id="scheduled_time"
                    type="datetime-local"
                    value={newStream.scheduled_start_time}
                    onChange={(e) => setNewStream({ ...newStream, scheduled_start_time: e.target.value })}
                    className="border-2 focus:border-red-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_viewers" className="text-lg font-semibold">Max Viewers</Label>
                  <select
                    id="max_viewers"
                    value={newStream.max_viewers}
                    onChange={(e) => setNewStream({ ...newStream, max_viewers: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:border-red-300 bg-background"
                  >
                    <option value={100}>100 viewers</option>
                    <option value={500}>500 viewers</option>
                    <option value={1000}>1,000 viewers</option>
                    <option value={5000}>5,000 viewers</option>
                    <option value={10000}>10,000 viewers</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 flex gap-4">
              <Button 
                onClick={createStream}
                disabled={!newStream.title.trim()}
                className="flex-1 h-12 text-lg bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
              >
                <Radio className="w-5 h-5 mr-2" />
                {newStream.scheduled_start_time ? '📅 Schedule Stream' : '🔴 Go Live Now'}
              </Button>
              <Button 
                onClick={() => setCreateStreamDialogOpen(false)}
                variant="outline"
                className="flex-1 h-12 text-lg"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Browse Streams */}
        <Card className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardContent className="p-8 text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full animate-pulse flex items-center justify-center">
                <Users className="w-3 h-3 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Discover Streams</h3>
            <p className="text-muted-foreground">Explore live content from your community</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Streams - Modern Instagram Style */}
      {activeStreams.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
              <h3 className="text-2xl font-bold">Live Now</h3>
            </div>
            <Badge variant="secondary" className="bg-red-100 text-red-700 px-3 py-1">
              {activeStreams.length} streaming
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeStreams.map((stream) => (
              <Card key={stream.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-red-50/50">
                <div className="relative">
                  {/* Stream Thumbnail/Preview */}
                  <div className="aspect-video bg-gradient-to-br from-red-400 via-pink-500 to-purple-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-12 h-12 text-white/80 group-hover:scale-125 transition-transform" />
                    </div>
                    
                    {/* Live Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-red-500 hover:bg-red-500 text-white border-0 px-3 py-1 animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></div>
                        LIVE
                      </Badge>
                    </div>
                    
                    {/* Viewer Count */}
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {stream.viewer_count}
                    </div>
                  </div>
                  
                  {/* Stream Info */}
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-10 w-10 border-2 border-red-200">
                        <AvatarImage 
                          src={validateAvatarUrl(stream.creator_profile?.avatar_url)} 
                          alt={stream.creator_profile?.display_name || 'Streamer'}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-red-400 to-pink-400 text-white">
                          {(stream.creator_profile?.display_name || 'S').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg mb-1 line-clamp-2 group-hover:text-red-600 transition-colors">
                          {stream.title}
                        </h4>
                        <p className="text-sm text-muted-foreground font-medium">
                          {stream.creator_profile?.display_name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Started {formatDistanceToNow(new Date(stream.actual_start_time || stream.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => joinStream(stream)}
                      className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold text-lg group-hover:scale-105 transition-transform"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Join Live Stream
                    </Button>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Streams - Enhanced */}
      {upcomingStreams.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-500" />
            <h3 className="text-2xl font-bold">Coming Up</h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-3 py-1">
              {upcomingStreams.length} scheduled
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {upcomingStreams.map((stream) => (
              <Card key={stream.id} className="group overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar className="h-10 w-10 border-2 border-blue-200">
                      <AvatarImage 
                        src={validateAvatarUrl(stream.creator_profile?.avatar_url)} 
                        alt={stream.creator_profile?.display_name || 'Streamer'}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-400 text-white">
                        {(stream.creator_profile?.display_name || 'S').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-1 line-clamp-2">{stream.title}</h4>
                      <p className="text-sm text-muted-foreground font-medium">
                        {stream.creator_profile?.display_name || 'Anonymous'}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        {stream.scheduled_start_time 
                          ? formatDistanceToNow(new Date(stream.scheduled_start_time), { addSuffix: true })
                          : 'Soon'
                        }
                      </div>
                    </div>
                    <Badge variant="outline" className="border-blue-300 text-blue-600">
                      SCHEDULED
                    </Badge>
                  </div>
                  
                  {stream.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {stream.description}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50">
                      <Star className="w-4 h-4 mr-2" />
                      Remind Me
                    </Button>
                    {stream.creator_id === user?.id && (
                      <Button 
                        size="sm" 
                        onClick={() => startStreaming(stream.id)}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
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

      {/* Modern Stream Viewer Modal - Instagram Style */}
      {selectedStream && (
        <Dialog open={!!selectedStream} onOpenChange={() => setSelectedStream(null)}>
          <DialogContent className="sm:max-w-[95vw] h-[95vh] p-0 bg-black">
            <div className="grid grid-cols-1 lg:grid-cols-4 h-full">
              {/* Video Area - 3/4 width on large screens */}
              <div className="lg:col-span-3 relative bg-black overflow-hidden">
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted={selectedStream.creator_id !== user?.id}
                  playsInline
                />

                {/* Live Reactions Overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {liveReactions.map((reaction) => (
                    <div
                      key={reaction.id}
                      className="absolute text-4xl animate-bounce"
                      style={{
                        left: `${reaction.x}%`,
                        top: `${reaction.y}%`,
                        animation: `float 3s ease-out forwards`,
                      }}
                    >
                      {reaction.emoji}
                    </div>
                  ))}
                </div>

                {/* Active Poll Overlay */}
                {activePoll && (
                  <div className="absolute top-20 left-4 right-4 z-10">
                    <div className="bg-black/80 backdrop-blur-md rounded-2xl p-4 text-white max-w-md">
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        Live Poll
                      </h4>
                      <p className="mb-4 text-sm">{activePoll.question}</p>
                      <div className="space-y-2">
                        {activePoll.options.map((option, index) => {
                          const votes = activePoll.votes[option] || 0;
                          const totalVotes = Object.values(activePoll.votes).reduce((a, b) => a + b, 0);
                          const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                          
                          return (
                            <button
                              key={index}
                              onClick={() => voteOnPoll(option)}
                              className="w-full text-left p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm">{option}</span>
                                <span className="text-xs text-white/70">{percentage}%</span>
                              </div>
                              <div className="w-full bg-white/20 rounded-full h-1">
                                <div 
                                  className="bg-blue-500 h-1 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Stream Info Overlay - Top */}
                <div className="absolute top-4 left-4 right-4 z-10">
                  <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white/50">
                          <AvatarImage 
                            src={validateAvatarUrl(selectedStream.creator_profile?.avatar_url)} 
                            alt={selectedStream.creator_profile?.display_name || 'Streamer'}
                          />
                          <AvatarFallback>
                            {(selectedStream.creator_profile?.display_name || 'S').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-lg">{selectedStream.title}</h3>
                          <p className="text-sm text-white/80">
                            {selectedStream.creator_profile?.display_name || 'Anonymous'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-red-500 rounded-full px-3 py-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span className="text-sm font-bold">LIVE</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-bold">{selectedStream.viewer_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stream Controls - Bottom (for streamers) */}
                {selectedStream.creator_id === user?.id && (
                  <div className="absolute bottom-4 left-4 right-4 z-10">
                    <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button 
                            size="sm" 
                            variant={streamSettings.video ? "default" : "secondary"}
                            onClick={() => toggleSetting('video')}
                            className="rounded-full w-12 h-12"
                          >
                            {streamSettings.video ? <Camera className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                          </Button>
                          <Button 
                            size="sm" 
                            variant={streamSettings.audio ? "default" : "secondary"}
                            onClick={() => toggleSetting('audio')}
                            className="rounded-full w-12 h-12"
                          >
                            {streamSettings.audio ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleSetting('screenShare')}
                            className="rounded-full w-12 h-12"
                          >
                            <Monitor className="w-5 h-5" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setShowPollPanel(true)}
                            className="rounded-full w-12 h-12"
                          >
                            📊
                          </Button>
                          <Button 
                            size="sm" 
                            variant={streamSettings.qaMode ? "default" : "outline"}
                            onClick={() => toggleSetting('qaMode')}
                            className="rounded-full w-12 h-12"
                          >
                            ❓
                          </Button>
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => stopStreaming(selectedStream.id)}
                          className="rounded-full px-6"
                        >
                          <Square className="w-4 h-4 mr-2" />
                          End Stream
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Viewer Controls - Bottom Right */}
                {selectedStream.creator_id !== user?.id && (
                  <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-3">
                    {/* Reaction Button */}
                    <div className="relative">
                      <Button
                        onClick={() => setShowReactionPicker(!showReactionPicker)}
                        className="rounded-full w-14 h-14 bg-white/20 backdrop-blur-md hover:bg-white/30 border-0"
                      >
                        <Heart className="w-6 h-6 text-white" />
                      </Button>
                      
                      {/* Reaction Picker */}
                      {showReactionPicker && (
                        <div className="absolute bottom-16 right-0 bg-black/80 backdrop-blur-md rounded-2xl p-3 grid grid-cols-4 gap-2">
                          {reactionEmojis.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => addReaction(emoji)}
                              className="text-2xl hover:scale-125 transition-transform p-1"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => setShowQAPanel(!showQAPanel)}
                      className="rounded-full w-14 h-14 bg-white/20 backdrop-blur-md hover:bg-white/30 border-0"
                    >
                      <MessageCircle className="w-6 h-6 text-white" />
                    </Button>
                    
                    <Button className="rounded-full w-14 h-14 bg-white/20 backdrop-blur-md hover:bg-white/30 border-0">
                      <Share className="w-6 h-6 text-white" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Enhanced Chat Area - 1/4 width on large screens */}
              <div className="bg-white border-l flex flex-col h-full">
                {/* Chat Header with Tabs */}
                <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-lg flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-purple-500" />
                      Live Chat
                    </h4>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      {streamChat.length}
                    </Badge>
                  </div>
                  
                  {/* Chat Filter Tabs */}
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {[
                      { key: 'all', label: 'All', icon: '💬' },
                      { key: 'questions', label: 'Q&A', icon: '❓' },
                      { key: 'pinned', label: 'Pinned', icon: '📌' }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setChatFilter(tab.key as any)}
                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          chatFilter === tab.key 
                            ? 'bg-white text-purple-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Chat Messages */}
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-gray-50"
                >
                  {/* Q&A Questions (when in Q&A filter) */}
                  {chatFilter === 'questions' && (
                    <div className="space-y-3">
                      {streamQuestions.map((question) => (
                        <div key={question.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage 
                                src={validateAvatarUrl(question.profiles?.avatar_url)} 
                                alt={question.profiles?.display_name || 'User'}
                              />
                              <AvatarFallback className="text-xs">
                                {(question.profiles?.display_name || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-800">
                                {question.profiles?.display_name || 'Anonymous'}
                              </p>
                              <p className="text-sm text-blue-700">{question.question}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => likeQuestion(question.id)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              {question.likes}
                            </button>
                            {question.is_answered && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                ✅ Answered
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Regular Chat Messages */}
                  {chatFilter !== 'questions' && filteredChat.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${
                      message.message_type === 'emoji' ? 'justify-center' : ''
                    } ${message.is_pinned ? 'bg-yellow-50 border border-yellow-200 rounded-lg p-2' : ''}`}>
                      {message.message_type === 'emoji' ? (
                        <div className="text-3xl animate-bounce">{message.message}</div>
                      ) : (
                        <>
                          <Avatar className="h-8 w-8 border-2 border-gray-200">
                            <AvatarImage 
                              src={validateAvatarUrl(message.profiles?.avatar_url)} 
                              alt={message.profiles?.display_name || 'User'}
                            />
                            <AvatarFallback className="text-xs bg-gradient-to-r from-purple-400 to-pink-400 text-white">
                              {(message.profiles?.display_name || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-gray-800">
                                {message.profiles?.display_name || 'Anonymous'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                              </span>
                              {message.is_pinned && (
                                <Pin className="w-3 h-3 text-yellow-600" />
                              )}
                            </div>
                            <p className="text-sm text-gray-700 break-words">{message.message}</p>
                          </div>
                          {/* Message Actions (for streamers) */}
                          {selectedStream?.creator_id === user?.id && (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => togglePinMessage(message.id, message.is_pinned || false)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Pin className="w-3 h-3 text-gray-400" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  
                  {filteredChat.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>
                        {chatFilter === 'questions' ? 'No questions yet!' : 
                         chatFilter === 'pinned' ? 'No pinned messages!' : 
                         'Be the first to say something!'}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Enhanced Chat Input */}
                <div className="p-4 border-t bg-white">
                  {/* Q&A Input (when Q&A mode is active) */}
                  {(streamSettings.qaMode || showQAPanel) && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Ask a Question</span>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="What would you like to know?"
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && submitQuestion()}
                          className="flex-1 border-blue-300 focus:border-blue-400"
                        />
                        <Button 
                          onClick={submitQuestion}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Regular Chat Input */}
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Say something nice..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      className="flex-1 rounded-full border-2 focus:border-purple-300 px-4"
                    />
                    <Button 
                      onClick={() => sendChatMessage()}
                      className="rounded-full w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Quick Reactions */}
                  <div className="flex gap-2 justify-center">
                    {['❤️', '😍', '👏', '🔥', '💯'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => addReaction(emoji)}
                        className="text-xl hover:scale-125 transition-transform p-1 rounded-full hover:bg-gray-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Enhanced Help Section */}
      {activeStreams.length === 0 && upcomingStreams.length === 0 && (
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-red-500/5"></div>
          <CardContent className="relative p-12 text-center">
            <div className="relative mb-8">
              <Radio className="w-20 h-20 text-purple-400 mx-auto mb-4" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <h4 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Start Something Amazing
            </h4>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Be the first to bring your community together with live streaming! Share your passion, 
              host interactive sessions, or just hang out with your members in real-time.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <h5 className="font-semibold mb-2">High Quality Streaming</h5>
                <p className="text-sm text-muted-foreground">HD video with crystal clear audio</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h5 className="font-semibold mb-2">Interactive Features</h5>
                <p className="text-sm text-muted-foreground">Live reactions, chat, and engagement</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h5 className="font-semibold mb-2">Community Building</h5>
                <p className="text-sm text-muted-foreground">Connect with your audience in real-time</p>
              </div>
            </div>
            
            <Button 
              onClick={() => setCreateStreamDialogOpen(true)}
              size="lg"
              className="h-14 px-8 text-lg bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 rounded-full"
            >
              <Radio className="w-6 h-6 mr-3" />
              Create Your First Stream
              <Sparkles className="w-5 h-5 ml-3" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-50px) scale(1.1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
};
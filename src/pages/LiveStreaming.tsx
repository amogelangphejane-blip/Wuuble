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
import { useNavigate, useParams } from 'react-router-dom';
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
  Shield,
  Coins,
  Crown,
  Diamond,
  Flame,
  ArrowLeft,
  Search,
  TrendingUp,
  Globe,
  Users2,
  Music,
  Gamepad2,
  Brush,
  Wand2,
  BarChart
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { validateAvatarUrl } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ModernHeader } from '@/components/ModernHeader';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StreamAnalyticsDashboard } from '@/components/StreamAnalyticsDashboard';

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
  category?: string;
  tags?: string[];
  creator_profile?: {
    display_name: string | null;
    avatar_url: string | null;
    follower_count?: number;
    is_verified?: boolean;
  };
}

interface VirtualGift {
  id: string;
  name: string;
  emoji: string;
  price: number;
  animation: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface StreamChat {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  message_type?: 'text' | 'emoji' | 'system' | 'gift';
  gift_data?: VirtualGift;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
    is_vip?: boolean;
    level?: number;
  };
}

interface BeautyFilter {
  id: string;
  name: string;
  type: 'beauty' | 'filter' | 'ar';
  preview: string;
  intensity: number;
}

const VIRTUAL_GIFTS: VirtualGift[] = [
  { id: '1', name: 'Rose', emoji: '🌹', price: 1, animation: 'float', rarity: 'common' },
  { id: '2', name: 'Heart', emoji: '💖', price: 5, animation: 'pulse', rarity: 'common' },
  { id: '3', name: 'Fire', emoji: '🔥', price: 10, animation: 'flame', rarity: 'rare' },
  { id: '4', name: 'Crown', emoji: '👑', price: 50, animation: 'sparkle', rarity: 'epic' },
  { id: '5', name: 'Diamond', emoji: '💎', price: 100, animation: 'shine', rarity: 'legendary' },
  { id: '6', name: 'Rocket', emoji: '🚀', price: 25, animation: 'zoom', rarity: 'rare' },
  { id: '7', name: 'Trophy', emoji: '🏆', price: 75, animation: 'bounce', rarity: 'epic' },
  { id: '8', name: 'Star', emoji: '⭐', price: 15, animation: 'twinkle', rarity: 'rare' },
];

const BEAUTY_FILTERS: BeautyFilter[] = [
  { id: 'none', name: 'None', type: 'beauty', preview: '🚫', intensity: 0 },
  { id: 'smooth', name: 'Smooth Skin', type: 'beauty', preview: '✨', intensity: 50 },
  { id: 'bright', name: 'Brighten', type: 'beauty', preview: '☀️', intensity: 30 },
  { id: 'slim', name: 'Slim Face', type: 'beauty', preview: '🔹', intensity: 25 },
  { id: 'vintage', name: 'Vintage', type: 'filter', preview: '📸', intensity: 60 },
  { id: 'warm', name: 'Warm', type: 'filter', preview: '🧡', intensity: 40 },
  { id: 'cool', name: 'Cool', type: 'filter', preview: '💙', intensity: 40 },
  { id: 'dramatic', name: 'Dramatic', type: 'filter', preview: '🎭', intensity: 70 },
];

const STREAM_CATEGORIES = [
  { id: 'just_chatting', name: 'Just Chatting', icon: MessageCircle, color: 'bg-blue-500' },
  { id: 'music', name: 'Music', icon: Music, color: 'bg-purple-500' },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2, color: 'bg-green-500' },
  { id: 'art', name: 'Art & Creative', icon: Brush, color: 'bg-pink-500' },
  { id: 'lifestyle', name: 'Lifestyle', icon: Users2, color: 'bg-orange-500' },
  { id: 'education', name: 'Education', icon: Users, color: 'bg-indigo-500' },
];

export default function LiveStreaming() {
  const [activeTab, setActiveTab] = useState<'discover' | 'following' | 'live' | 'analytics'>('discover');
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [streamChat, setStreamChat] = useState<StreamChat[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [showBeautyPanel, setShowBeautyPanel] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<BeautyFilter>(BEAUTY_FILTERS[0]);
  const [filterIntensity, setFilterIntensity] = useState(50);
  const [userCoins, setUserCoins] = useState(1000); // Mock user coins
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamSettings, setStreamSettings] = useState({
    video: true,
    audio: true,
    beauty: true,
    filter: 'none',
    category: 'just_chatting',
    title: '',
    description: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { streamId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockStreams: LiveStream[] = [
      {
        id: '1',
        title: 'Late Night Vibes 🌙',
        description: 'Chilling and chatting with my amazing viewers!',
        status: 'live',
        creator_id: 'user1',
        scheduled_start_time: null,
        actual_start_time: new Date().toISOString(),
        viewer_count: 1247,
        max_viewers: 5000,
        thumbnail_url: null,
        created_at: new Date().toISOString(),
        category: 'just_chatting',
        tags: ['chill', 'music', 'chat'],
        creator_profile: {
          display_name: 'Luna_Dreams',
          avatar_url: null,
          follower_count: 15420,
          is_verified: true
        }
      },
      {
        id: '2',
        title: 'Gaming Session - New Battle Royale!',
        description: 'Trying out the latest battle royale game. Come join the fun!',
        status: 'live',
        creator_id: 'user2',
        scheduled_start_time: null,
        actual_start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        viewer_count: 892,
        max_viewers: 2000,
        thumbnail_url: null,
        created_at: new Date().toISOString(),
        category: 'gaming',
        tags: ['gaming', 'battle royale', 'competitive'],
        creator_profile: {
          display_name: 'ProGamer_Alex',
          avatar_url: null,
          follower_count: 8930,
          is_verified: false
        }
      },
      {
        id: '3',
        title: 'Digital Art Stream ✨',
        description: 'Creating a beautiful landscape painting digitally',
        status: 'live',
        creator_id: 'user3',
        scheduled_start_time: null,
        actual_start_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        viewer_count: 456,
        max_viewers: 1000,
        thumbnail_url: null,
        created_at: new Date().toISOString(),
        category: 'art',
        tags: ['art', 'digital', 'creative'],
        creator_profile: {
          display_name: 'ArtisticSoul',
          avatar_url: null,
          follower_count: 3240,
          is_verified: true
        }
      }
    ];
    setStreams(mockStreams);
  }, []);

  // Start streaming function
  const startStreaming = async () => {
    try {
      if (!streamSettings.title.trim()) {
        toast({
          title: "Title Required",
          description: "Please enter a title for your stream",
          variant: "destructive"
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
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

      setIsStreaming(true);
      toast({
        title: "🎉 You're Live!",
        description: "Your stream has started successfully",
      });
    } catch (error: any) {
      console.error('Error starting stream:', error);
      toast({
        title: "Camera Access Error",
        description: "Please allow camera access to start streaming",
        variant: "destructive"
      });
    }
  };

  // Stop streaming function
  const stopStreaming = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsStreaming(false);
    toast({
      title: "Stream Ended",
      description: "Your stream has been stopped",
    });
  };

  // Send gift function
  const sendGift = (gift: VirtualGift) => {
    if (userCoins < gift.price) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${gift.price - userCoins} more coins`,
        variant: "destructive"
      });
      return;
    }

    setUserCoins(prev => prev - gift.price);
    
    // Add gift message to chat
    const giftMessage: StreamChat = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: user?.id || 'anonymous',
      message: `sent ${gift.name} ${gift.emoji}`,
      created_at: new Date().toISOString(),
      message_type: 'gift',
      gift_data: gift,
      profiles: {
        display_name: user?.user_metadata?.display_name || 'Anonymous',
        avatar_url: null,
        is_vip: true,
        level: 5
      }
    };

    setStreamChat(prev => [...prev, giftMessage]);
    setShowGiftPanel(false);

    toast({
      title: `Gift Sent! ${gift.emoji}`,
      description: `You sent ${gift.name} for ${gift.price} coins`,
    });
  };

  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim() || !user) return;

    const message: StreamChat = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: user.id,
      message: newMessage.trim(),
      created_at: new Date().toISOString(),
      message_type: 'text',
      profiles: {
        display_name: user.user_metadata?.display_name || 'Anonymous',
        avatar_url: null,
        level: 3
      }
    };

    setStreamChat(prev => [...prev, message]);
    setNewMessage('');
  };

  // Filter streams based on search and category
  const filteredStreams = streams.filter(stream => {
    const matchesSearch = stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stream.creator_profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || stream.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <ModernHeader />
      
      {/* Stream View - Full Screen */}
      {selectedStream && isFullScreen && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="relative w-full h-full">
            {/* Stream Video */}
            <div className="w-full h-full bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="w-16 h-16" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{selectedStream.title}</h3>
                  <p className="text-lg text-gray-300">{selectedStream.creator_profile?.display_name}</p>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
                      <Radio className="w-3 h-3 mr-1" />
                      LIVE
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      <Eye className="w-3 h-3 mr-1" />
                      {selectedStream.viewer_count.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Stream Controls Overlay */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullScreen(false)}
                className="bg-black/50 hover:bg-black/70 text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/50 hover:bg-black/70 text-white"
                >
                  <Share className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/50 hover:bg-black/70 text-white"
                >
                  <Heart className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Chat Overlay */}
            <div className="absolute bottom-4 right-4 w-80 h-96 bg-black/80 backdrop-blur-sm rounded-lg border border-white/10">
              <div className="p-3 border-b border-white/10">
                <h4 className="text-white font-semibold">Live Chat</h4>
              </div>
              
              <div
                ref={chatContainerRef}
                className="flex-1 h-64 overflow-y-auto p-3 space-y-2"
              >
                {streamChat.map((message) => (
                  <div key={message.id} className="flex gap-2 text-sm">
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">
                        {message.profiles?.display_name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-purple-400 font-medium truncate">
                          {message.profiles?.display_name || 'Anonymous'}
                        </span>
                        {message.profiles?.is_vip && (
                          <Crown className="w-3 h-3 text-yellow-400" />
                        )}
                        {message.profiles?.level && (
                          <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                            {message.profiles.level}
                          </Badge>
                        )}
                      </div>
                      {message.message_type === 'gift' && message.gift_data ? (
                        <div className="text-yellow-400 font-medium">
                          {message.message} ✨
                        </div>
                      ) : (
                        <p className="text-gray-300 break-words">{message.message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-white/10">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Say something..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button
                    onClick={() => setShowGiftPanel(true)}
                    size="icon"
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    <Gift className="w-4 h-4" />
                  </Button>
                  <Button onClick={sendMessage} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Live Streaming</h1>
              <p className="text-gray-300">Discover amazing live content and connect with creators</p>
            </div>
            
            {/* User Coins Display */}
            <div className="flex items-center gap-4">
              <div className="bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-semibold">{userCoins.toLocaleString()}</span>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <Radio className="w-4 h-4 mr-2" />
                    Go Live
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Start Your Live Stream</DialogTitle>
                    <DialogDescription>
                      Set up your stream and connect with your audience
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Stream Preview */}
                    <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        className="w-full h-full object-cover"
                      />
                      {!isStreaming && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="text-center text-white">
                            <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>Camera preview will appear here</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Beauty Filter Controls */}
                      {isStreaming && (
                        <div className="absolute bottom-4 left-4 flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowBeautyPanel(true)}
                            className="bg-black/50 hover:bg-black/70 text-white"
                          >
                            <Wand2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setStreamSettings(prev => ({ ...prev, video: !prev.video }))}
                            className="bg-black/50 hover:bg-black/70 text-white"
                          >
                            {streamSettings.video ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setStreamSettings(prev => ({ ...prev, audio: !prev.audio }))}
                            className="bg-black/50 hover:bg-black/70 text-white"
                          >
                            {streamSettings.audio ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Stream Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="stream-title">Stream Title</Label>
                          <Input
                            id="stream-title"
                            value={streamSettings.title}
                            onChange={(e) => setStreamSettings(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="What's your stream about?"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="stream-description">Description</Label>
                          <Textarea
                            id="stream-description"
                            value={streamSettings.description}
                            onChange={(e) => setStreamSettings(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Tell viewers what to expect..."
                            rows={3}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label>Category</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {STREAM_CATEGORIES.map((category) => {
                              const IconComponent = category.icon;
                              return (
                                <Button
                                  key={category.id}
                                  variant={streamSettings.category === category.id ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setStreamSettings(prev => ({ ...prev, category: category.id }))}
                                  className="justify-start"
                                >
                                  <IconComponent className="w-4 h-4 mr-2" />
                                  {category.name}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="beauty-mode">Beauty Mode</Label>
                          <Switch
                            id="beauty-mode"
                            checked={streamSettings.beauty}
                            onCheckedChange={(checked) => setStreamSettings(prev => ({ ...prev, beauty: checked }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      {!isStreaming ? (
                        <Button
                          onClick={startStreaming}
                          className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 h-12"
                        >
                          <Radio className="w-5 h-5 mr-2" />
                          Start Streaming
                        </Button>
                      ) : (
                        <Button
                          onClick={stopStreaming}
                          variant="destructive"
                          className="flex-1 h-12"
                        >
                          <Square className="w-5 h-5 mr-2" />
                          End Stream
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        onClick={() => setShowBeautyPanel(true)}
                        className="px-6 h-12"
                      >
                        <Wand2 className="w-5 h-5 mr-2" />
                        Filters
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="bg-black/30 backdrop-blur-sm">
              <TabsTrigger value="discover" className="data-[state=active]:bg-white/10">
                <Globe className="w-4 h-4 mr-2" />
                Discover
              </TabsTrigger>
              <TabsTrigger value="following" className="data-[state=active]:bg-white/10">
                <UserPlus className="w-4 h-4 mr-2" />
                Following
              </TabsTrigger>
              <TabsTrigger value="live" className="data-[state=active]:bg-white/10">
                <TrendingUp className="w-4 h-4 mr-2" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white/10">
                <BarChart className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Search and Filters */}
            <div className="flex gap-4 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search streams, creators..."
                  className="pl-10 bg-black/30 backdrop-blur-sm border-white/10 text-white placeholder:text-gray-400"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                  size="sm"
                >
                  All
                </Button>
                {STREAM_CATEGORIES.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      onClick={() => setSelectedCategory(category.id)}
                      size="sm"
                    >
                      <IconComponent className="w-4 h-4 mr-1" />
                      {category.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-6">
              <StreamAnalyticsDashboard />
            </TabsContent>

            {/* Stream Grid */}
            <TabsContent value={activeTab} className="mt-6">
              {activeTab !== 'analytics' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStreams.map((stream) => {
                  const category = STREAM_CATEGORIES.find(c => c.id === stream.category);
                  const IconComponent = category?.icon || MessageCircle;
                  
                  return (
                    <Card
                      key={stream.id}
                      className="bg-black/30 backdrop-blur-sm border-white/10 hover:border-white/20 transition-all cursor-pointer group"
                      onClick={() => {
                        setSelectedStream(stream);
                        setIsFullScreen(true);
                      }}
                    >
                      <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 relative overflow-hidden rounded-t-lg">
                        {/* Mock Thumbnail */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-white">
                            <IconComponent className="w-12 h-12 mx-auto mb-2 opacity-70" />
                            <p className="text-sm opacity-70">Live Stream</p>
                          </div>
                        </div>
                        
                        {/* Live Badge */}
                        <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-500 text-white">
                          <Radio className="w-3 h-3 mr-1" />
                          LIVE
                        </Badge>
                        
                        {/* Viewer Count */}
                        <Badge className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white border-0">
                          <Eye className="w-3 h-3 mr-1" />
                          {stream.viewer_count.toLocaleString()}
                        </Badge>
                        
                        {/* Play Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-white ml-1" />
                          </div>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                              {stream.creator_profile?.display_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                              {stream.title}
                            </h3>
                            <div className="flex items-center gap-1 mt-1">
                              <p className="text-sm text-gray-300 truncate">
                                {stream.creator_profile?.display_name}
                              </p>
                              {stream.creator_profile?.is_verified && (
                                <Badge variant="secondary" className="w-4 h-4 p-0 bg-blue-500">
                                  ✓
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {category?.name} • {stream.creator_profile?.follower_count?.toLocaleString()} followers
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Virtual Gifts Panel */}
      <Dialog open={showGiftPanel} onOpenChange={setShowGiftPanel}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-500" />
              Send Virtual Gift
            </DialogTitle>
            <DialogDescription>
              Support the streamer with a virtual gift
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">Your Balance</span>
              </div>
              <span className="font-bold text-yellow-500">{userCoins.toLocaleString()}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {VIRTUAL_GIFTS.map((gift) => (
                <Button
                  key={gift.id}
                  variant="outline"
                  onClick={() => sendGift(gift)}
                  disabled={userCoins < gift.price}
                  className={`h-16 flex-col gap-1 ${
                    gift.rarity === 'legendary' ? 'border-yellow-500/50 bg-yellow-500/5' :
                    gift.rarity === 'epic' ? 'border-purple-500/50 bg-purple-500/5' :
                    gift.rarity === 'rare' ? 'border-blue-500/50 bg-blue-500/5' :
                    'border-gray-500/50'
                  }`}
                >
                  <span className="text-2xl">{gift.emoji}</span>
                  <div className="text-center">
                    <div className="font-medium text-xs">{gift.name}</div>
                    <div className="text-xs text-yellow-500 font-semibold">{gift.price}</div>
                  </div>
                </Button>
              ))}
            </div>
            
            <Button variant="outline" className="w-full">
              <Coins className="w-4 h-4 mr-2" />
              Buy More Coins
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Beauty Filters Panel */}
      <Dialog open={showBeautyPanel} onOpenChange={setShowBeautyPanel}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-500" />
              Beauty Filters & Effects
            </DialogTitle>
            <DialogDescription>
              Enhance your appearance with real-time filters
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Filter Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Filters</Label>
              <div className="grid grid-cols-4 gap-3">
                {BEAUTY_FILTERS.map((filter) => (
                  <Button
                    key={filter.id}
                    variant={selectedFilter.id === filter.id ? "default" : "outline"}
                    onClick={() => setSelectedFilter(filter)}
                    className="h-16 flex-col gap-1 text-xs"
                  >
                    <span className="text-lg">{filter.preview}</span>
                    <span>{filter.name}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Intensity Slider */}
            {selectedFilter.id !== 'none' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Intensity</Label>
                  <span className="text-sm text-gray-500">{filterIntensity}%</span>
                </div>
                <Slider
                  value={[filterIntensity]}
                  onValueChange={(value) => setFilterIntensity(value[0])}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
            
            {/* Beauty Settings */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Beauty Settings</Label>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="smooth-skin">Smooth Skin</Label>
                <Switch id="smooth-skin" />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="brighten">Brighten</Label>
                <Switch id="brighten" />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="slim-face">Slim Face</Label>
                <Switch id="slim-face" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
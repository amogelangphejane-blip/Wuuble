import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { VideoChat } from '@/components/VideoChat';
import { ModernHeader } from '@/components/ModernHeader';
import { 
  Video, 
  Users, 
  Globe, 
  Zap, 
  Heart,
  Star,
  Play,
  Shuffle,
  MessageCircle,
  Settings,
  Crown,
  Sparkles,
  Camera,
  Mic,
  Phone,
  UserPlus,
  Activity,
  Clock,
  MapPin,
  Languages,
  Search,
  Shield,
  Grid3X3,
  List,
  Filter,
  TrendingUp
} from 'lucide-react';

interface OnlineUser {
  id: string;
  name: string;
  avatar: string;
  location: string;
  isActive: boolean;
}

const RandomVideoChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showVideoChat, setShowVideoChat] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Header state for search and filters (similar to landing page)
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'live' | 'scheduled' | 'popular'>('all');

  // Mock online users for demonstration
  useEffect(() => {
    const mockUsers: OnlineUser[] = [
      { id: '1', name: 'Alex Chen', avatar: '', location: 'San Francisco', isActive: true },
      { id: '2', name: 'Maria Rodriguez', avatar: '', location: 'Barcelona', isActive: true },
      { id: '3', name: 'David Kim', avatar: '', location: 'Seoul', isActive: false },
      { id: '4', name: 'Sophie Laurent', avatar: '', location: 'Paris', isActive: true },
      { id: '5', name: 'James Wilson', avatar: '', location: 'London', isActive: true },
      { id: '6', name: 'Priya Sharma', avatar: '', location: 'Mumbai', isActive: false },
    ];
    setOnlineUsers(mockUsers);
  }, []);

  const startRandomChat = () => {
    setIsSearching(true);
    // Simulate matching process
    setTimeout(() => {
      setIsSearching(false);
      setShowVideoChat(true);
    }, 2000);
  };

  const stopVideoChat = () => {
    setShowVideoChat(false);
  };

  if (showVideoChat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950">
        <ModernHeader />
        <div className="container mx-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Random Video Chat
            </h1>
            <Button 
              onClick={stopVideoChat} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              End Chat
            </Button>
          </div>
          <VideoChat />
        </div>
      </div>
    );
  }

  if (isSearching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950">
        <ModernHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Card className="w-full max-w-md mx-4 border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
            <CardContent className="p-8 text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center animate-pulse">
                  <Search className="w-10 h-10 text-white animate-spin" />
                </div>
                <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-ping opacity-20"></div>
              </div>
              <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Finding your perfect match...
              </h3>
              <p className="text-muted-foreground mb-4">
                We're connecting you with someone amazing
              </p>
              <div className="flex justify-center">
                <Button 
                  onClick={() => setIsSearching(false)} 
                  variant="outline" 
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Modern Header - Same as Landing Page */}
      <ModernHeader />
      
      {/* Discover-style Header Section */}
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Inner Circle
                </h1>
                <p className="text-sm text-muted-foreground">Random Video Chat</p>
              </div>
            </div>
            
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <Activity className="w-3 h-3 mr-1" />
              {onlineUsers.filter(u => u.isActive).length} Online
            </Badge>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search people, interests, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <Select value={filterType} onValueChange={(value: 'all' | 'live' | 'scheduled' | 'popular') => setFilterType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="live">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span>Live</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="popular">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Popular</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="scheduled">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Scheduled</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 mb-6">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Welcome back, {user?.user_metadata?.display_name || 'Friend'}!
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Meet Amazing People
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with people from around the world through safe, instant video conversations. 
              Every chat is a new adventure waiting to happen.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Video Chat Card */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <Video className="w-6 h-6" />
                    Start Video Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <div className="relative">
                      <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mb-6 shadow-lg">
                        <Camera className="w-16 h-16 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-2xl font-semibold">Ready to connect?</h3>
                      <p className="text-muted-foreground">
                        Click the button below to start a random video chat with someone new. 
                        Our smart matching system will find the perfect conversation partner for you.
                      </p>
                    </div>

                    <Button 
                      onClick={startRandomChat}
                      size="lg"
                      className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      <Play className="w-6 h-6 mr-3" />
                      Start Random Chat
                    </Button>

                    <div className="grid grid-cols-3 gap-4 pt-6">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-2">
                          <Shield className="w-6 h-6 text-purple-600" />
                        </div>
                        <p className="text-sm font-medium">Safe & Secure</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-2">
                          <Globe className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium">Global Reach</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-2">
                          <Zap className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-sm font-medium">Instant Connect</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Online Users */}
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-green-500" />
                    People Online
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {onlineUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {user.isActive && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {user.location}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => navigate('/communities')}
                  >
                    View All Communities
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Today's Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Active Users</span>
                    </div>
                    <Badge variant="secondary">2,847</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Video Chats</span>
                    </div>
                    <Badge variant="secondary">1,234</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Countries</span>
                    </div>
                    <Badge variant="secondary">89</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Connections Made</span>
                    </div>
                    <Badge variant="secondary">15,678</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5 text-orange-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => navigate('/communities')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Browse Communities
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => navigate('/azar-livestreams')}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Live Streams
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => navigate('/marketplace')}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Marketplace
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  <Shuffle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Smart Matching</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI finds the perfect conversation partner based on your interests and preferences.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Safe Environment</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced moderation and safety features ensure a positive experience for everyone.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Global Community</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with people from over 89 countries and discover new cultures and perspectives.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center">
            <Card className="border-0 shadow-2xl bg-gradient-to-r from-purple-500 to-blue-500 text-white overflow-hidden">
              <CardContent className="p-8 relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-3">Ready for your next conversation?</h3>
                  <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
                    Join thousands of people making meaningful connections every day. 
                    Your next best friend might be just one click away.
                  </p>
                  <Button 
                    onClick={startRandomChat}
                    size="lg"
                    className="bg-white text-purple-600 hover:bg-gray-100 shadow-lg transform hover:scale-105 transition-all duration-200 h-14 px-8 text-lg font-semibold"
                  >
                    <Play className="w-6 h-6 mr-3" />
                    Start Video Chat Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RandomVideoChat;
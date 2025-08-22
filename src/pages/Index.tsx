import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModernHeader } from '@/components/ModernHeader';
import { 
  Video, 
  Users, 
  Globe, 
  Play,
  Shuffle,
  Camera,
  Activity,
  Shield,
  Zap,
  Heart,
  Star,
  MessageCircle,
  MapPin,
  Clock,
  UserPlus,
  Sparkles,
  TrendingUp,
  Languages,
  Settings
} from 'lucide-react';

interface OnlineUser {
  id: string;
  name: string;
  avatar: string;
  location: string;
  isActive: boolean;
  interests: string[];
}

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [genderPreference, setGenderPreference] = useState<'all' | 'male' | 'female'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(2847);

  // Mock online users for demonstration
  useEffect(() => {
    const mockUsers: OnlineUser[] = [
      { 
        id: '1', 
        name: 'Alex Chen', 
        avatar: '', 
        location: 'San Francisco', 
        isActive: true, 
        interests: ['Photography', 'Travel'] 
      },
      { 
        id: '2', 
        name: 'Maria Rodriguez', 
        avatar: '', 
        location: 'Barcelona', 
        isActive: true, 
        interests: ['Art', 'Music'] 
      },
      { 
        id: '3', 
        name: 'David Kim', 
        avatar: '', 
        location: 'Seoul', 
        isActive: true, 
        interests: ['Gaming', 'Tech'] 
      },
      { 
        id: '4', 
        name: 'Sophie Laurent', 
        avatar: '', 
        location: 'Paris', 
        isActive: false, 
        interests: ['Fashion', 'Culture'] 
      },
      { 
        id: '5', 
        name: 'James Wilson', 
        avatar: '', 
        location: 'London', 
        isActive: true, 
        interests: ['Sports', 'Movies'] 
      },
      { 
        id: '6', 
        name: 'Priya Sharma', 
        avatar: '', 
        location: 'Mumbai', 
        isActive: true, 
        interests: ['Dance', 'Food'] 
      },
    ];
    setOnlineUsers(mockUsers);

    // Simulate live count updates
    const interval = setInterval(() => {
      setOnlineCount(prev => prev + Math.floor(Math.random() * 10) - 5);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const startRandomChat = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    setIsSearching(true);
    // Simulate matching process
    setTimeout(() => {
      setIsSearching(false);
      navigate('/communities');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
                  <Shuffle className="w-10 h-10 text-white animate-spin" />
                </div>
                <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-ping opacity-20"></div>
              </div>
              <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Finding your perfect match...
              </h3>
              <p className="text-muted-foreground mb-4">
                Connecting you with someone awesome worldwide
              </p>
              <Button 
                onClick={() => setIsSearching(false)} 
                variant="outline" 
                size="sm"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950">
      <ModernHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 flex items-center justify-center shadow-2xl">
                <Video className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Random Video Chat
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with people from around the world instantly. Make new friends, learn about different cultures, and have amazing conversations.
            </p>
            
            {/* Live Stats */}
            <div className="flex justify-center items-center gap-6 mb-8">
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-4 py-2 text-lg">
                <Activity className="w-4 h-4 mr-2" />
                {onlineCount.toLocaleString()} online now
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-4 py-2 text-lg">
                <Globe className="w-4 h-4 mr-2" />
                195 countries
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Chat Interface */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg overflow-hidden">
                <CardContent className="p-8">
                  <div className="space-y-8">
                    {/* Chat Preferences */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Chat Preferences
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Who would you like to meet?
                          </label>
                          <Select value={genderPreference} onValueChange={(value: 'all' | 'male' | 'female') => setGenderPreference(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Everyone</SelectItem>
                              <SelectItem value="male">Men</SelectItem>
                              <SelectItem value="female">Women</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Language Preference
                          </label>
                          <Select defaultValue="any">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any Language</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="de">German</SelectItem>
                              <SelectItem value="zh">Chinese</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Start Chat Button */}
                    <div className="text-center">
                      <Button 
                        onClick={startRandomChat}
                        size="lg"
                        className="w-full md:w-auto h-16 px-12 text-xl bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 hover:from-purple-600 hover:via-blue-600 hover:to-indigo-600 shadow-2xl transform hover:scale-105 transition-all duration-300"
                      >
                        <Play className="w-6 h-6 mr-3" />
                        Start Video Chat
                      </Button>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-2">
                          <Shield className="w-6 h-6 text-purple-600" />
                        </div>
                        <p className="text-sm font-medium">Safe & Secure</p>
                        <p className="text-xs text-muted-foreground">Moderated chats</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-2">
                          <Zap className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium">Instant Connect</p>
                        <p className="text-xs text-muted-foreground">No waiting time</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-2">
                          <Globe className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-sm font-medium">Global Reach</p>
                        <p className="text-xs text-muted-foreground">Worldwide users</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mb-2">
                          <Heart className="w-6 h-6 text-yellow-600" />
                        </div>
                        <p className="text-sm font-medium">Make Friends</p>
                        <p className="text-xs text-muted-foreground">Real connections</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Online Users Sidebar */}
            <div className="space-y-6">
              {/* Online Now */}
              <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      People Online
                    </h3>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {onlineUsers.filter(u => u.isActive).length} active
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {onlineUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {user.isActive && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{user.location}</span>
                          </div>
                        </div>
                        {user.isActive && (
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Today's Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Connections Made</span>
                      <span className="font-semibold">12,847</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Average Chat Time</span>
                      <span className="font-semibold">8m 32s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Happy Ratings</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">4.8</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Explore More</h3>
                  <div className="space-y-2">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => navigate('/communities')}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Join Communities
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => navigate('/azar-livestreams')}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Live Streams
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => navigate('/chat')}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Text Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              By using our service, you agree to our Terms of Service and Privacy Policy. 
              Please be respectful and follow our community guidelines. Report any inappropriate behavior.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

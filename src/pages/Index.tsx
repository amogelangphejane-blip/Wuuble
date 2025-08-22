import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModernHeader } from '@/components/ModernHeader';
import { 
  Video, 
  Users, 
  Globe, 
  Play,
  Shuffle,
  Settings,
  Camera,
  Activity,
  Shield,
  Zap,
  Heart
} from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [genderPreference, setGenderPreference] = useState<'all' | 'male' | 'female'>('all');
  const [isSearching, setIsSearching] = useState(false);

  const startRandomChat = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    setIsSearching(true);
    // Simulate matching process
    setTimeout(() => {
      setIsSearching(false);
      navigate('/random-video-chat');
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
                Finding your match...
              </h3>
              <p className="text-muted-foreground mb-4">
                Connecting you with someone awesome
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
      
      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="w-full max-w-md">
          {/* Main Video Chat Card */}
          <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                {/* Logo/Icon */}
                <div className="relative">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                    <Camera className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Activity className="w-3 h-3 text-white" />
                  </div>
                </div>
                
                {/* Title */}
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Meet New People
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Start a random video chat instantly
                  </p>
                </div>

                {/* Gender Preference */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">
                    Who would you like to meet?
                  </label>
                  <Select value={genderPreference} onValueChange={(value: 'all' | 'male' | 'female') => setGenderPreference(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="male">Men</SelectItem>
                      <SelectItem value="female">Women</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Chat Button */}
                <Button 
                  onClick={startRandomChat}
                  size="lg"
                  className="w-full h-12 text-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Video Chat
                </Button>

                {/* Quick Features */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-1">
                      <Shield className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Safe</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-1">
                      <Globe className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Global</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-1">
                      <Zap className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Instant</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Online Stats */}
          <div className="mt-6 text-center">
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <Activity className="w-3 h-3 mr-1" />
              2,847 people online now
            </Badge>
          </div>

          {/* Quick Links */}
          <div className="mt-6 flex justify-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/communities')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Users className="w-4 h-4 mr-1" />
              Communities
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/azar-livestreams')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Video className="w-4 h-4 mr-1" />
              Live Streams
            </Button>
          </div>

          {/* Privacy Notice */}
          <p className="text-xs text-muted-foreground text-center mt-6 max-w-xs mx-auto">
            By starting a chat, you agree to our Terms of Service and Privacy Policy. 
            Be respectful and have fun!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Users, 
  Globe, 
  Zap,
  Heart,
  Settings,
  X,
  MapPin,
  Clock,
  Wifi,
  Star,
  Sparkles,
  Target
} from 'lucide-react';

interface WaitingScreenProps {
  isSearching: boolean;
  onlineUsers: number;
  estimatedWaitTime: number;
  userLocation: string;
  searchPreferences: {
    ageRange: [number, number];
    location: string;
    interests: string[];
  };
  onCancel: () => void;
  onUpdatePreferences: () => void;
}

interface AnimatedUser {
  id: string;
  name: string;
  avatar?: string;
  age: number;
  location: string;
  interests: string[];
  x: number;
  y: number;
  opacity: number;
}

export const UserWaitingScreen: React.FC<WaitingScreenProps> = ({
  isSearching,
  onlineUsers,
  estimatedWaitTime,
  userLocation,
  searchPreferences,
  onCancel,
  onUpdatePreferences
}) => {
  const [searchProgress, setSearchProgress] = useState(0);
  const [animatedUsers, setAnimatedUsers] = useState<AnimatedUser[]>([]);
  const [searchTips, setSearchTips] = useState(0);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  const tips = [
    "💡 Tip: Add more interests to find better matches",
    "🌍 Tip: Try expanding your location range",
    "⭐ Tip: Verified users get matched faster",
    "🎯 Tip: Be yourself and have fun!",
    "💬 Tip: A good first impression goes a long way"
  ];

  // Simulate search progress
  useEffect(() => {
    if (isSearching) {
      const interval = setInterval(() => {
        setSearchProgress(prev => {
          if (prev >= 100) return 0; // Reset when complete
          return prev + Math.random() * 15;
        });
      }, 800);

      return () => clearInterval(interval);
    } else {
      setSearchProgress(0);
    }
  }, [isSearching]);

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setSearchTips(prev => (prev + 1) % tips.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Generate animated users
  useEffect(() => {
    if (isSearching) {
      const generateUsers = () => {
        const users: AnimatedUser[] = [];
        for (let i = 0; i < 8; i++) {
          users.push({
            id: `user-${i}`,
            name: ['Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Morgan'][i],
            age: Math.floor(Math.random() * 20) + 20,
            location: ['NYC', 'LA', 'London', 'Tokyo', 'Paris', 'Berlin', 'Sydney', 'Toronto'][i],
            interests: ['music', 'travel', 'gaming'].slice(0, Math.floor(Math.random() * 3) + 1),
            x: Math.random() * 100,
            y: Math.random() * 100,
            opacity: Math.random() * 0.7 + 0.3
          });
        }
        setAnimatedUsers(users);
      };

      generateUsers();
      const interval = setInterval(generateUsers, 4000);
      return () => clearInterval(interval);
    } else {
      setAnimatedUsers([]);
    }
  }, [isSearching]);

  // Pulse animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseAnimation(prev => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatWaitTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 relative overflow-hidden">
      
      {/* Animated Background Users */}
      {isSearching && (
        <div className="absolute inset-0 pointer-events-none">
          {animatedUsers.map((user) => (
            <div
              key={user.id}
              className="absolute transition-all duration-4000 ease-in-out"
              style={{
                left: `${user.x}%`,
                top: `${user.y}%`,
                opacity: user.opacity,
                transform: `translate(-50%, -50%) scale(${0.8 + Math.random() * 0.4})`
              }}
            >
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-3 py-2 shadow-sm">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-xs">
                  <div className="font-medium">{user.name}, {user.age}</div>
                  <div className="text-muted-foreground">{user.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-md mx-auto relative z-10">
        
        {/* Header Stats */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">{onlineUsers.toLocaleString()} online</span>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {userLocation}
          </Badge>
        </div>

        {/* Main Search Card */}
        <Card className="mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-400/10" />
          
          <CardContent className="p-8 text-center relative">
            
            {/* Search Icon with Animation */}
            <div className="mb-6">
              <div className={`relative mx-auto w-20 h-20 ${pulseAnimation ? 'animate-pulse' : ''}`}>
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <div className="absolute inset-2 bg-primary/40 rounded-full animate-ping delay-75" />
                <div className="relative w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                  {isSearching ? (
                    <Search className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Heart className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
            </div>

            {/* Status Text */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {isSearching ? 'Finding your match...' : 'Ready to connect?'}
              </h2>
              <p className="text-muted-foreground">
                {isSearching 
                  ? 'Searching through thousands of users worldwide'
                  : 'Tap the button below to start matching'
                }
              </p>
            </div>

            {/* Search Progress */}
            {isSearching && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Matching progress</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.min(Math.round(searchProgress), 100)}%
                  </span>
                </div>
                <Progress value={Math.min(searchProgress, 100)} className="h-2" />
              </div>
            )}

            {/* Estimated Wait Time */}
            {isSearching && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                <Clock className="w-4 h-4" />
                <span>Est. wait time: {formatWaitTime(estimatedWaitTime)}</span>
              </div>
            )}

            {/* Action Button */}
            <Button 
              onClick={onCancel}
              variant={isSearching ? "outline" : "default"}
              size="lg"
              className="w-full"
            >
              {isSearching ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancel Search
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Start Matching
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Search Preferences */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Your Preferences
              </h3>
              <Button variant="ghost" size="sm" onClick={onUpdatePreferences}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Age Range:</span>
                <span>{searchPreferences.ageRange[0]} - {searchPreferences.ageRange[1]} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span>{searchPreferences.location}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Interests:</span>
                <div className="flex flex-wrap gap-1 max-w-32">
                  {searchPreferences.interests.slice(0, 3).map((interest) => (
                    <Badge key={interest} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                  {searchPreferences.interests.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{searchPreferences.interests.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <p className="text-sm transition-all duration-500">
                {tips[searchTips]}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Network Status */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Wifi className="w-4 h-4 text-green-500" />
            <span>Connected</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>Premium Quality</span>
          </div>
          <div className="flex items-center gap-1">
            <Globe className="w-4 h-4 text-blue-500" />
            <span>Worldwide</span>
          </div>
        </div>

        {/* Fun Facts */}
        {isSearching && (
          <Card className="mt-6">
            <CardContent className="p-4 text-center">
              <h4 className="font-semibold mb-2 flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                While you wait...
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-lg font-bold text-primary">2.3M+</div>
                  <div className="text-muted-foreground">Connections made</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-500">95%</div>
                  <div className="text-muted-foreground">Success rate</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-500">180+</div>
                  <div className="text-muted-foreground">Countries</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-500">24/7</div>
                  <div className="text-muted-foreground">Always active</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Floating particles animation */}
      {isSearching && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary/30 rounded-full animate-bounce"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${2 + i * 0.3}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
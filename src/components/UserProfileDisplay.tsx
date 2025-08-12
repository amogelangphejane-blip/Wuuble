import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  MapPin, 
  Calendar, 
  Heart,
  MessageCircle,
  Phone,
  Video,
  MoreVertical,
  Flag,
  UserX,
  Share2,
  Star,
  Crown,
  Shield,
  Verified,
  Gift,
  Zap,
  Award,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';

interface UserStats {
  totalConnections: number;
  likesReceived: number;
  likesGiven: number;
  averageCallDuration: number;
  matchRate: number;
  joinDate: Date;
  isVerified: boolean;
  isPremium: boolean;
  level: number;
  streak: number;
}

interface UserProfile {
  id: string;
  name: string;
  age: number;
  location: string;
  avatar?: string;
  bio: string;
  interests: string[];
  stats: UserStats;
  isOnline: boolean;
  lastSeen?: Date;
}

interface ProfileProps {
  user: UserProfile;
  currentUserId: string;
  onLike: (userId: string) => void;
  onMessage: (userId: string) => void;
  onVideoCall: (userId: string) => void;
  onVoiceCall: (userId: string) => void;
  onReport: (userId: string) => void;
  onBlock: (userId: string) => void;
  onShare: (userId: string) => void;
}

const INTEREST_ICONS: Record<string, React.ReactNode> = {
  music: '🎵',
  gaming: '🎮',
  reading: '📚',
  art: '🎨',
  fitness: '💪',
  food: '🍕',
  travel: '✈️',
  movies: '🎬',
  tech: '💻',
  podcasts: '🎧',
  cars: '🚗',
  sports: '⚽'
};

export const UserProfileDisplay: React.FC<ProfileProps> = ({
  user,
  currentUserId,
  onLike,
  onMessage,
  onVideoCall,
  onVoiceCall,
  onReport,
  onBlock,
  onShare
}) => {
  const [showMoreStats, setShowMoreStats] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike(user.id);
    toast({
      title: isLiked ? "Like removed" : "Liked!",
      description: isLiked ? `You unliked ${user.name}` : `You liked ${user.name}`,
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatLastSeen = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getLevelColor = (level: number) => {
    if (level >= 50) return 'text-purple-600';
    if (level >= 30) return 'text-blue-600';
    if (level >= 15) return 'text-green-600';
    if (level >= 5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* Main Profile Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-purple-400 to-pink-400" />
          
          <CardContent className="relative pt-20 pb-6">
            {/* Avatar and Basic Info */}
            <div className="text-center mb-6">
              <div className="relative mx-auto w-24 h-24 mb-4">
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-2xl">
                    <User className="w-12 h-12" />
                  </AvatarFallback>
                </Avatar>
                
                {/* Online Status */}
                <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-white ${
                  user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                
                {/* Verification Badge */}
                {user.stats.isVerified && (
                  <div className="absolute -top-1 -right-1">
                    <div className="bg-blue-500 text-white rounded-full p-1">
                      <Verified className="w-4 h-4" />
                    </div>
                  </div>
                )}
                
                {/* Premium Badge */}
                {user.stats.isPremium && (
                  <div className="absolute -top-1 -left-1">
                    <div className="bg-yellow-500 text-white rounded-full p-1">
                      <Crown className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <Badge variant="secondary" className={`${getLevelColor(user.stats.level)} border-current`}>
                    Lvl {user.stats.level}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{user.age}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{user.location}</span>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {user.isOnline ? (
                    <span className="text-green-600 font-medium">Online now</span>
                  ) : (
                    <span>Last seen {formatLastSeen(user.lastSeen)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="text-center mb-6">
                <p className="text-muted-foreground">{user.bio}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <Button 
                variant={isLiked ? "default" : "outline"} 
                size="sm"
                onClick={handleLike}
                className={isLiked ? "bg-red-500 hover:bg-red-600" : ""}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onMessage(user.id)}>
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onVideoCall(user.id)}>
                <Video className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onVoiceCall(user.id)}>
                <Phone className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div>
                <div className="text-xl font-bold text-primary">{user.stats.totalConnections}</div>
                <div className="text-xs text-muted-foreground">Connections</div>
              </div>
              <div>
                <div className="text-xl font-bold text-red-500">{user.stats.likesReceived}</div>
                <div className="text-xs text-muted-foreground">Likes</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-500">{user.stats.matchRate}%</div>
                <div className="text-xs text-muted-foreground">Match Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="flex items-center gap-1">
                  <span>{INTEREST_ICONS[interest] || '⭐'}</span>
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Statistics
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowMoreStats(!showMoreStats)}
              >
                {showMoreStats ? 'Less' : 'More'}
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Avg. Call Duration</span>
                </div>
                <span className="font-medium">{formatDuration(user.stats.averageCallDuration)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Current Streak</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{user.stats.streak}</span>
                  <span className="text-xs text-muted-foreground">days</span>
                </div>
              </div>

              {showMoreStats && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Likes Given</span>
                    </div>
                    <span className="font-medium">{user.stats.likesGiven}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Member Since</span>
                    </div>
                    <span className="font-medium">
                      {user.stats.joinDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Level Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {user.stats.level}/100
                      </span>
                    </div>
                    <Progress value={user.stats.level} className="h-2" />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Menu */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => onShare(user.id)} className="justify-start">
                <Share2 className="w-4 h-4 mr-2" />
                Share Profile
              </Button>
              <Button variant="outline" onClick={() => onReport(user.id)} className="justify-start text-yellow-600">
                <Flag className="w-4 h-4 mr-2" />
                Report User
              </Button>
              <Button variant="outline" onClick={() => onBlock(user.id)} className="justify-start text-red-600">
                <UserX className="w-4 h-4 mr-2" />
                Block User
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Achievements (if premium) */}
        {user.stats.isPremium && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                Achievements
                <Badge variant="secondary" className="text-xs">Premium</Badge>
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-yellow-50 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                  <div className="text-xs font-medium">Popular</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                  <div className="text-xs font-medium">Trusted</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <Zap className="w-6 h-6 text-green-500 mx-auto mb-1" />
                  <div className="text-xs font-medium">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
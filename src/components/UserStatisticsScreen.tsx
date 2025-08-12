import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Heart,
  Users,
  Clock,
  Star,
  Award,
  Zap,
  Calendar,
  Globe,
  Target,
  Trophy,
  Crown,
  Gift,
  MessageCircle,
  Video,
  Phone,
  ThumbsUp,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface UserStats {
  totalConnections: number;
  totalCallTime: number; // in minutes
  averageCallDuration: number; // in minutes
  likesReceived: number;
  likesGiven: number;
  matchRate: number; // percentage
  currentStreak: number; // days
  longestStreak: number; // days
  level: number;
  xp: number;
  xpToNextLevel: number;
  joinDate: Date;
  favoriteCountries: string[];
  mostActiveHours: number[];
  weeklyStats: {
    connections: number;
    callTime: number;
    likes: number;
  }[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  unlockedDate?: Date;
  progress?: number;
  maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface StatisticsProps {
  stats: UserStats;
  achievements: Achievement[];
  onShareStats: () => void;
}

const SAMPLE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-connection',
    title: 'First Connection',
    description: 'Made your first video call',
    icon: Users,
    unlockedDate: new Date('2024-01-15'),
    rarity: 'common'
  },
  {
    id: 'social-butterfly',
    title: 'Social Butterfly',
    description: 'Connected with 100+ people',
    icon: Heart,
    progress: 85,
    maxProgress: 100,
    rarity: 'rare'
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Made 50 calls after midnight',
    icon: Clock,
    unlockedDate: new Date('2024-02-01'),
    rarity: 'epic'
  },
  {
    id: 'global-citizen',
    title: 'Global Citizen',
    description: 'Connected with people from 25+ countries',
    icon: Globe,
    progress: 18,
    maxProgress: 25,
    rarity: 'epic'
  },
  {
    id: 'conversation-master',
    title: 'Conversation Master',
    description: 'Maintained a 7-day streak',
    icon: Trophy,
    unlockedDate: new Date('2024-02-10'),
    rarity: 'legendary'
  }
];

export const UserStatisticsScreen: React.FC<StatisticsProps> = ({
  stats,
  achievements = SAMPLE_ACHIEVEMENTS,
  onShareStats
}) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatJoinDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getAchievementColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-purple-300 bg-purple-50';
      case 'epic': return 'border-blue-300 bg-blue-50';
      case 'rare': return 'border-green-300 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getAchievementBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-purple-100 text-purple-700';
      case 'epic': return 'bg-blue-100 text-blue-700';
      case 'rare': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 50) return 'text-purple-600';
    if (level >= 30) return 'text-blue-600';
    if (level >= 15) return 'text-green-600';
    if (level >= 5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Level and XP */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${getLevelColor(stats.level)}`}>
                  Level {stats.level}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {stats.xp.toLocaleString()} XP
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {stats.xpToNextLevel} XP to next level
            </Badge>
          </div>
          <Progress value={(stats.xp / (stats.xp + stats.xpToNextLevel)) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.totalConnections}</div>
            <div className="text-sm text-muted-foreground">Total Connections</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{formatDuration(stats.totalCallTime)}</div>
            <div className="text-sm text-muted-foreground">Total Call Time</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.likesReceived}</div>
            <div className="text-sm text-muted-foreground">Likes Received</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <div className="text-sm text-muted-foreground">Current Streak</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Detailed Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Average Call Duration</span>
            <span className="font-medium">{formatDuration(stats.averageCallDuration)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Match Rate</span>
            <div className="flex items-center gap-2">
              <Progress value={stats.matchRate} className="w-20 h-2" />
              <span className="font-medium">{stats.matchRate}%</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Likes Given</span>
            <span className="font-medium">{stats.likesGiven}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Longest Streak</span>
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">{stats.longestStreak} days</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Member Since</span>
            <span className="font-medium">{formatJoinDate(stats.joinDate)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Top Countries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Favorite Countries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats.favoriteCountries.slice(0, 5).map((country, index) => (
              <Badge key={country} variant="secondary" className="flex items-center gap-1">
                <span>#{index + 1}</span>
                {country}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAchievements = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Achievements</h3>
        <Badge variant="secondary">
          {achievements.filter(a => a.unlockedDate).length} / {achievements.length}
        </Badge>
      </div>

      <div className="grid gap-3">
        {achievements.map((achievement) => {
          const Icon = achievement.icon;
          const isUnlocked = !!achievement.unlockedDate;
          const hasProgress = achievement.progress !== undefined;

          return (
            <Card 
              key={achievement.id} 
              className={`${getAchievementColor(achievement.rarity)} ${
                isUnlocked ? '' : 'opacity-60'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isUnlocked ? 'bg-white shadow-sm' : 'bg-gray-200'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      isUnlocked ? 'text-primary' : 'text-gray-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{achievement.title}</h4>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getAchievementBadgeColor(achievement.rarity)}`}
                      >
                        {achievement.rarity}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    
                    {isUnlocked && achievement.unlockedDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Unlocked {achievement.unlockedDate.toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {hasProgress && !isUnlocked && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <Progress 
                          value={(achievement.progress! / achievement.maxProgress!) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex gap-2 bg-muted rounded-lg p-1">
        {(['week', 'month', 'year', 'all'] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange(range)}
            className="flex-1"
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </Button>
        ))}
      </div>

      {/* Weekly Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Weekly Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.weeklyStats.map((week, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Week {index + 1}</span>
                  <span className="text-muted-foreground">
                    {week.connections} connections
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-blue-100 p-2 rounded text-center">
                    <div className="font-medium text-blue-700">{week.connections}</div>
                    <div className="text-blue-600">Connections</div>
                  </div>
                  <div className="bg-green-100 p-2 rounded text-center">
                    <div className="font-medium text-green-700">{formatDuration(week.callTime)}</div>
                    <div className="text-green-600">Call Time</div>
                  </div>
                  <div className="bg-red-100 p-2 rounded text-center">
                    <div className="font-medium text-red-700">{week.likes}</div>
                    <div className="text-red-600">Likes</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Most Active Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Most Active Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 24 }, (_, hour) => {
              const isActive = stats.mostActiveHours.includes(hour);
              const intensity = isActive ? Math.random() * 0.6 + 0.4 : 0.1;
              
              return (
                <div
                  key={hour}
                  className={`h-8 rounded text-xs flex items-center justify-center ${
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                  style={{ opacity: intensity }}
                >
                  {hour}
                </div>
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            Hours (24h format)
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Your Statistics
          </h1>
          <p className="text-muted-foreground">Track your progress and achievements</p>
          
          <Button 
            variant="outline" 
            onClick={onShareStats}
            className="mt-3"
          >
            <Gift className="w-4 h-4 mr-2" />
            Share Stats
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {renderOverview()}
          </TabsContent>
          
          <TabsContent value="achievements" className="space-y-4">
            {renderAchievements()}
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-4">
            {renderActivity()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
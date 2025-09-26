import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, TrendingUp, Star, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  points: number;
  streak: number;
  badges: string[];
  change: 'up' | 'down' | 'same';
}

interface CommunityLeaderboardProps {
  communityId: string;
}

export const CommunityLeaderboard: React.FC<CommunityLeaderboardProps> = ({
  communityId
}) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');
  
  const [leaderboard] = useState<LeaderboardEntry[]>([
    {
      rank: 1,
      userId: '1',
      displayName: 'Sarah Chen',
      avatarUrl: '',
      points: 2850,
      streak: 15,
      badges: ['top-contributor', 'helpful'],
      change: 'up'
    },
    {
      rank: 2,
      userId: '2',
      displayName: 'Alex Johnson',
      avatarUrl: '',
      points: 2420,
      streak: 8,
      badges: ['active-member'],
      change: 'same'
    },
    {
      rank: 3,
      userId: '3',
      displayName: 'Emily Davis',
      avatarUrl: '',
      points: 2100,
      streak: 12,
      badges: ['rising-star'],
      change: 'up'
    },
    {
      rank: 4,
      userId: '4',
      displayName: 'Michael Brown',
      avatarUrl: '',
      points: 1850,
      streak: 5,
      badges: [],
      change: 'down'
    },
    {
      rank: 5,
      userId: '5',
      displayName: 'Lisa Wang',
      avatarUrl: '',
      points: 1620,
      streak: 3,
      badges: [],
      change: 'up'
    }
  ]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="w-5 h-5 text-center font-bold">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800';
      case 2:
        return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
      case 3:
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Leaderboard</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Top contributors in the community
          </p>
        </div>
        
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
          <TabsList>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {leaderboard.slice(0, 3).map((entry, index) => (
          <Card key={entry.userId} className={cn(
            "text-center",
            index === 0 && "md:order-2 md:scale-110 z-10",
            index === 1 && "md:order-1",
            index === 2 && "md:order-3"
          )}>
            <CardContent className="pt-6">
              <div className="relative">
                <Avatar className={cn(
                  "mx-auto mb-3",
                  index === 0 ? "w-20 h-20" : "w-16 h-16"
                )}>
                  <AvatarImage src={entry.avatarUrl} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    {entry.displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2">
                  {getRankIcon(entry.rank)}
                </div>
              </div>
              <h3 className="font-semibold">{entry.displayName}</h3>
              <p className="text-2xl font-bold mt-2">{entry.points}</p>
              <p className="text-sm text-gray-500">points</p>
              {entry.streak > 7 && (
                <Badge className="mt-2" variant="secondary">
                  <Flame className="w-3 h-3 mr-1" />
                  {entry.streak} day streak
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Rankings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {leaderboard.map((entry) => (
            <div
              key={entry.userId}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg",
                getRankStyle(entry.rank)
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 text-center">
                  {getRankIcon(entry.rank)}
                </div>
                
                <Avatar>
                  <AvatarImage src={entry.avatarUrl} />
                  <AvatarFallback>
                    {entry.displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <p className="font-semibold">{entry.displayName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {entry.badges.map((badge) => (
                      <Badge key={badge} variant="outline" className="text-xs">
                        {badge.replace('-', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {entry.change === 'up' && (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                )}
                {entry.change === 'down' && (
                  <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                )}
                <div className="text-right">
                  <p className="font-bold text-lg">{entry.points}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Points Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>How to Earn Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Create a discussion post</span>
              <Badge variant="secondary">+10 points</Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Comment on a post</span>
              <Badge variant="secondary">+5 points</Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Receive a like</span>
              <Badge variant="secondary">+2 points</Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Daily login streak</span>
              <Badge variant="secondary">+3 points/day</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
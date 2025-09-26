import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp, Zap, Target, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  points: number;
  rank: number;
  achievements?: string[];
}

interface SkoolLeaderboardProps {
  communityId: string;
}

export const SkoolLeaderboard: React.FC<SkoolLeaderboardProps> = ({ communityId }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    fetchLeaderboard();
  }, [communityId, timeframe]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_leaderboard')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('community_id', communityId)
        .order('points', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }

      const transformedEntries: LeaderboardEntry[] = (data || []).map((entry, index) => ({
        id: entry.id,
        user_id: entry.user_id,
        username: entry.profiles?.username || 'Anonymous',
        avatar_url: entry.profiles?.avatar_url,
        points: entry.points || 0,
        rank: index + 1,
        achievements: entry.achievements || []
      }));

      setEntries(transformedEntries);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="font-bold text-gray-500">#{rank}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-gray-500 text-sm mt-1">Top contributors and most active members</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={timeframe === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('week')}
          >
            This Week
          </Button>
          <Button
            variant={timeframe === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('month')}
          >
            This Month
          </Button>
          <Button
            variant={timeframe === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('all')}
          >
            All Time
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : entries.length === 0 ? (
        <Card className="p-8 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No leaderboard data yet</h3>
          <p className="text-gray-500 mb-4">
            Start participating in the community to earn points and climb the leaderboard!
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <div className="text-center">
              <Crown className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm font-medium">Post & Comment</p>
              <p className="text-xs text-gray-500">Earn points</p>
            </div>
            <div className="text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-medium">Help Others</p>
              <p className="text-xs text-gray-500">Get recognized</p>
            </div>
            <div className="text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium">Complete Challenges</p>
              <p className="text-xs text-gray-500">Level up</p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className={cn(
                "hover:shadow-lg transition-all",
                entry.rank === 1 && "border-yellow-400 dark:border-yellow-600 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20"
              )}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={entry.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {entry.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <p className="font-semibold">{entry.username}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {entry.points.toLocaleString()} points
                        </span>
                        {entry.achievements && entry.achievements.length > 0 && (
                          <div className="flex gap-1">
                            {entry.achievements.slice(0, 3).map((achievement, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {achievement}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {entry.rank <= 3 && (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
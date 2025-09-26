import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkoolLeaderboardProps {
  communityId: string;
}

export const SkoolLeaderboard: React.FC<SkoolLeaderboardProps> = ({ communityId }) => {
  const leaderboard = [
    { rank: 1, name: 'Sarah Chen', level: 10, points: 5420, change: 'up', streak: 45 },
    { rank: 2, name: 'Mike Johnson', level: 9, points: 4890, change: 'same', streak: 32 },
    { rank: 3, name: 'Emma Wilson', level: 8, points: 4230, change: 'up', streak: 28 },
    { rank: 4, name: 'David Lee', level: 7, points: 3670, change: 'down', streak: 15 },
    { rank: 5, name: 'Lisa Anderson', level: 7, points: 3420, change: 'up', streak: 22 },
    { rank: 6, name: 'Tom Brown', level: 6, points: 2980, change: 'same', streak: 18 },
    { rank: 7, name: 'Jessica Taylor', level: 6, points: 2750, change: 'up', streak: 12 },
    { rank: 8, name: 'Ryan Garcia', level: 5, points: 2340, change: 'down', streak: 8 },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-500">#{rank}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-gray-500 text-sm mt-1">Top performers this month</p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {leaderboard.slice(0, 3).map((member, index) => (
          <Card 
            key={member.rank}
            className={cn(
              "p-6 text-center",
              index === 0 && "md:order-2 md:scale-105",
              index === 1 && "md:order-1",
              index === 2 && "md:order-3"
            )}
          >
            <div className="flex justify-center mb-3">
              {getRankIcon(member.rank)}
            </div>
            <Avatar className={cn("mx-auto mb-3", index === 0 ? "w-20 h-20" : "w-16 h-16")}>
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                {member.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-semibold">{member.name}</h3>
            <Badge className="mt-2 mb-3">Level {member.level}</Badge>
            <p className="text-2xl font-bold">{member.points.toLocaleString()}</p>
            <p className="text-sm text-gray-500">points</p>
            {member.streak > 30 && (
              <div className="mt-3 flex items-center justify-center gap-1 text-orange-500">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">{member.streak} day streak!</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Full Leaderboard */}
      <Card>
        <div className="divide-y">
          {leaderboard.map((member) => (
            <div key={member.rank} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8">
                    {getRankIcon(member.rank)}
                  </div>
                  
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                      {member.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">Level {member.level}</Badge>
                      {member.streak > 7 && (
                        <span className="text-xs text-orange-500 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {member.streak} days
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {member.change === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                  {member.change === 'down' && <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />}
                  <div className="text-right">
                    <p className="text-lg font-bold">{member.points.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
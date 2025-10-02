import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Medal,
  Award,
  Star,
  Crown,
  TrendingUp,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Gift
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { gamificationService } from '@/services/gamificationService';
import { ACHIEVEMENT_DEFINITIONS } from '@/types/gamification';

interface SimplifiedLeaderboardProps {
  communityId: string;
}

export const SimplifiedLeaderboard: React.FC<SimplifiedLeaderboardProps> = ({ communityId }) => {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch leaderboard data
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['leaderboard', communityId],
    queryFn: () => gamificationService.getLeaderboard(communityId, 50),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ['user-stats', communityId, user?.id],
    queryFn: () => user ? gamificationService.getUserStats(communityId, user.id) : null,
    enabled: !!user?.id,
  });

  // Fetch user achievements
  const { data: userAchievements = [] } = useQuery({
    queryKey: ['user-achievements', communityId, user?.id],
    queryFn: () => user ? gamificationService.getUserAchievements(communityId, user.id) : [],
    enabled: !!user?.id,
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank <= 3) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rank <= 10) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    if (rank <= 25) return 'bg-gradient-to-r from-green-400 to-green-600';
    return 'bg-gradient-to-r from-gray-400 to-gray-600';
  };

  const getLevelBadgeColor = (level: number) => {
    if (level >= 10) return 'from-purple-500 to-pink-500';
    if (level >= 5) return 'from-blue-500 to-cyan-500';
    return 'from-green-500 to-emerald-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span>Loading leaderboard...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-6 h-6" />
                <span>Community Leaderboard</span>
              </CardTitle>
              <p className="text-blue-100 mt-2">
                Earn points, unlock achievements, and climb the ranks!
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{leaderboard.length}</div>
              <div className="text-sm opacity-90">Active Members</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leaderboard">
            <Trophy className="w-4 h-4 mr-2" />
            Rankings
          </TabsTrigger>
          <TabsTrigger value="mystats">
            <Target className="w-4 h-4 mr-2" />
            My Stats
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Award className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
        </TabsList>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          {/* User's Position Card (if not in top 10) */}
          {userStats && userStats.rank > 10 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getRankBadgeColor(userStats.rank)}`}>
                        #{userStats.rank}
                      </div>
                      <div>
                        <h3 className="font-semibold">Your Position</h3>
                        <p className="text-sm text-gray-600">
                          {userStats.total_points} points • Level {userStats.level}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      Top {Math.round((userStats.rank / userStats.total_members) * 100)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Leaderboard List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Top Contributors</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No rankings yet</h3>
                  <p className="text-gray-500">
                    Start participating to appear on the leaderboard!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <motion.div
                      key={entry.user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div 
                        className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                          entry.rank <= 3 ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                        } ${entry.user.id === user?.id ? 'border-blue-300 bg-blue-50' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            {/* Rank */}
                            <div className="w-12 flex items-center justify-center">
                              {getRankIcon(entry.rank) || (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getRankBadgeColor(entry.rank)}`}>
                                  #{entry.rank}
                                </div>
                              )}
                            </div>

                            {/* Avatar */}
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={entry.user.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                {entry.user.full_name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            {/* User Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{entry.user.full_name}</h4>
                                {entry.user.id === user?.id && (
                                  <Badge variant="secondary" className="text-xs">You</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  {entry.points} pts
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${getLevelBadgeColor(entry.level)} text-white`}>
                                  Level {entry.level}
                                </span>
                              </div>
                              
                              {/* Badges */}
                              {entry.badges.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {entry.badges.slice(0, 5).map((badge) => (
                                    <span 
                                      key={badge.id} 
                                      className="text-lg" 
                                      title={badge.achievement_name}
                                    >
                                      {badge.icon}
                                    </span>
                                  ))}
                                  {entry.badges.length > 5 && (
                                    <span className="text-sm text-gray-500">+{entry.badges.length - 5}</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Expand Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedUser(
                                expandedUser === entry.user.id ? null : entry.user.id
                              )}
                            >
                              {expandedUser === entry.user.id ? 
                                <ChevronUp className="w-4 h-4" /> : 
                                <ChevronDown className="w-4 h-4" />
                              }
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {expandedUser === entry.user.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t"
                            >
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <div className="text-2xl font-bold text-blue-600">
                                    {entry.stats.posts}
                                  </div>
                                  <div className="text-xs text-gray-500">Posts</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold text-green-600">
                                    {entry.stats.comments}
                                  </div>
                                  <div className="text-xs text-gray-500">Comments</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold text-pink-600">
                                    {entry.stats.likes_given}
                                  </div>
                                  <div className="text-xs text-gray-500">Likes Given</div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Stats Tab */}
        <TabsContent value="mystats" className="space-y-4">
          {userStats ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Your Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Level Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="font-semibold">Level {userStats.level}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {userStats.total_points} / {userStats.next_level_points} pts
                      </span>
                    </div>
                    <Progress value={userStats.progress_to_next_level} className="h-3" />
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.ceil(userStats.next_level_points - userStats.total_points)} points to next level
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {userStats.total_points}
                        </div>
                        <div className="text-sm text-gray-600">Total Points</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-purple-600">
                          #{userStats.rank}
                        </div>
                        <div className="text-sm text-gray-600">Your Rank</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100">
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {userStats.level}
                        </div>
                        <div className="text-sm text-gray-600">Current Level</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-pink-50 to-pink-100">
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-pink-600">
                          {userStats.achievements_count}
                        </div>
                        <div className="text-sm text-gray-600">Achievements</div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Achievements */}
              {userStats.recent_achievements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                      Recent Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {userStats.recent_achievements.map((achievement) => (
                        <div 
                          key={achievement.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200"
                        >
                          <span className="text-3xl">{achievement.icon}</span>
                          <div className="flex-1">
                            <h4 className="font-semibold">{achievement.achievement_name}</h4>
                            <p className="text-sm text-gray-600">{achievement.achievement_description}</p>
                          </div>
                          <Badge variant="secondary">
                            {new Date(achievement.earned_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">
                  Start participating to track your progress!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                All Achievements
              </CardTitle>
              <p className="text-sm text-gray-500">
                Unlock these badges by participating in the community
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ACHIEVEMENT_DEFINITIONS.map((achievement) => {
                  const isUnlocked = userAchievements.some(
                    a => a.achievement_key === achievement.key
                  );
                  const unlockedAchievement = userAchievements.find(
                    a => a.achievement_key === achievement.key
                  );

                  return (
                    <Card 
                      key={achievement.key}
                      className={`transition-all ${
                        isUnlocked 
                          ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50' 
                          : 'opacity-60 grayscale'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-4xl">{achievement.icon}</span>
                          <div className="flex-1">
                            <h4 className="font-semibold flex items-center gap-2">
                              {achievement.name}
                              {isUnlocked && (
                                <Badge variant="secondary" className="text-xs">
                                  Unlocked
                                </Badge>
                              )}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {achievement.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              Requirement: {achievement.requirement.value} {achievement.requirement.type}
                            </p>
                            {isUnlocked && unlockedAchievement && (
                              <p className="text-xs text-green-600 mt-1">
                                Earned {new Date(unlockedAchievement.earned_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Clock, 
  Award,
  Crown,
  Shield,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Heart,
  MessageCircle,
  Star,
  Eye
} from 'lucide-react';
import { EnhancedCommunityMember } from '@/types/members';
import { formatDistanceToNow } from 'date-fns';

interface MemberAnalyticsDashboardProps {
  members: EnhancedCommunityMember[];
  onlineCount: number;
  className?: string;
}

const MemberAnalyticsDashboard: React.FC<MemberAnalyticsDashboardProps> = ({
  members,
  onlineCount,
  className = ''
}) => {
  const analytics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Basic stats
    const totalMembers = members.length;
    const activeToday = members.filter(m => 
      new Date(m.last_active_at) >= today
    ).length;
    const activeYesterday = members.filter(m => {
      const lastActive = new Date(m.last_active_at);
      return lastActive >= yesterday && lastActive < today;
    }).length;

    // New member stats
    const newToday = members.filter(m => new Date(m.joined_at) >= today).length;
    const newThisWeek = members.filter(m => new Date(m.joined_at) >= weekAgo).length;
    const newThisMonth = members.filter(m => new Date(m.joined_at) >= monthAgo).length;

    // Role distribution
    const creators = members.filter(m => m.role === 'creator').length;
    const moderators = members.filter(m => m.role === 'moderator').length;
    const regularMembers = members.filter(m => m.role === 'member').length;

    // Activity distribution
    const highActivity = members.filter(m => (m.activity_score || 0) >= 80).length;
    const mediumActivity = members.filter(m => {
      const score = m.activity_score || 0;
      return score >= 50 && score < 80;
    }).length;
    const lowActivity = members.filter(m => (m.activity_score || 0) < 50).length;

    // Engagement stats
    const totalActivityScore = members.reduce((sum, m) => sum + (m.activity_score || 0), 0);
    const averageActivityScore = totalMembers > 0 ? Math.round(totalActivityScore / totalMembers) : 0;
    const totalBadges = members.reduce((sum, m) => sum + (m.badges?.length || 0), 0);

    // Growth calculation
    const growthRate = activeYesterday > 0 
      ? Math.round(((activeToday - activeYesterday) / activeYesterday) * 100)
      : activeToday > 0 ? 100 : 0;

    // Most active members
    const topMembers = [...members]
      .sort((a, b) => (b.activity_score || 0) - (a.activity_score || 0))
      .slice(0, 5);

    // Newest members
    const newestMembers = [...members]
      .sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime())
      .slice(0, 3);

    return {
      totalMembers,
      onlineMembers: onlineCount,
      activeToday,
      newToday,
      newThisWeek,
      newThisMonth,
      creators,
      moderators,
      regularMembers,
      highActivity,
      mediumActivity,
      lowActivity,
      averageActivityScore,
      totalBadges,
      growthRate,
      topMembers,
      newestMembers
    };
  }, [members, onlineCount]);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    change, 
    color = 'blue',
    description 
  }: {
    title: string;
    value: string | number;
    icon: any;
    change?: number;
    color?: string;
    description?: string;
  }) => (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-3xl font-bold">{value}</p>
              {description && (
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              )}
            </div>
            <div className={`p-3 rounded-full bg-${color}-100`}>
              <Icon className={`h-6 w-6 text-${color}-600`} />
            </div>
          </div>
          {change !== undefined && (
            <div className="mt-4 flex items-center">
              <Badge 
                variant={change >= 0 ? "default" : "destructive"}
                className="text-xs"
              >
                {change >= 0 ? '+' : ''}{change}%
              </Badge>
              <span className="text-xs text-gray-500 ml-2">vs yesterday</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Members"
          value={analytics.totalMembers}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Online Now"
          value={analytics.onlineMembers}
          icon={Activity}
          color="green"
          description={`${Math.round((analytics.onlineMembers / analytics.totalMembers) * 100)}% of total`}
        />
        <StatCard
          title="Active Today"
          value={analytics.activeToday}
          icon={Zap}
          change={analytics.growthRate}
          color="purple"
        />
        <StatCard
          title="Avg. Activity"
          value={`${analytics.averageActivityScore}%`}
          icon={Target}
          color="orange"
        />
      </div>

      {/* Growth & Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Member Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Today</span>
                <Badge variant="secondary">{analytics.newToday}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">This Week</span>
                <Badge variant="secondary">{analytics.newThisWeek}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">This Month</span>
                <Badge variant="secondary">{analytics.newThisMonth}</Badge>
              </div>
            </div>
            
            {analytics.newestMembers.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Newest Members</h4>
                <div className="space-y-2">
                  {analytics.newestMembers.map((member, index) => (
                    <div key={member.id} className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                        {(member.profiles?.display_name || 'A')[0].toUpperCase()}
                      </div>
                      <span className="flex-1 truncate">
                        {member.profiles?.display_name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Activity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">High Activity (80%+)</span>
                  <Badge className="bg-green-100 text-green-700">
                    {analytics.highActivity}
                  </Badge>
                </div>
                <Progress 
                  value={(analytics.highActivity / analytics.totalMembers) * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Medium Activity (50-79%)</span>
                  <Badge className="bg-yellow-100 text-yellow-700">
                    {analytics.mediumActivity}
                  </Badge>
                </div>
                <Progress 
                  value={(analytics.mediumActivity / analytics.totalMembers) * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Low Activity (0-49%)</span>
                  <Badge className="bg-gray-100 text-gray-700">
                    {analytics.lowActivity}
                  </Badge>
                </div>
                <Progress 
                  value={(analytics.lowActivity / analytics.totalMembers) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution & Top Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Creators</span>
                </div>
                <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                  {analytics.creators}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Moderators</span>
                </div>
                <Badge variant="outline" className="border-blue-500 text-blue-700">
                  {analytics.moderators}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Members</span>
                </div>
                <Badge variant="outline" className="border-gray-500 text-gray-700">
                  {analytics.regularMembers}
                </Badge>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Badges Earned</span>
                <Badge className="bg-purple-100 text-purple-700">
                  <Award className="h-3 w-3 mr-1" />
                  {analytics.totalBadges}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Active Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-orange-600" />
              Top Active Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 text-white text-xs font-bold">
                    #{index + 1}
                  </div>
                  
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
                    {(member.profiles?.display_name || 'A')[0].toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.profiles?.display_name || 'Anonymous'}
                    </p>
                    <div className="flex items-center gap-2">
                      {member.role !== 'member' && (
                        <Badge variant="secondary" className="text-xs">
                          {member.role === 'creator' && <Crown className="h-3 w-3 mr-1" />}
                          {member.role === 'moderator' && <Shield className="h-3 w-3 mr-1" />}
                          {member.role}
                        </Badge>
                      )}
                      <div className={`w-2 h-2 rounded-full ${
                        member.is_online ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">
                      {member.activity_score || 0}%
                    </p>
                    <p className="text-xs text-gray-500">activity</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberAnalyticsDashboard;
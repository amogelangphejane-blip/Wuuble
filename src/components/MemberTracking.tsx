import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  TrendingUp,
  TrendingDown,
  UserPlus,
  UserMinus,
  Activity,
  Clock,
  Calendar
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';

interface MemberStats {
  total_members: number;
  new_today: number;
  new_this_week: number;
  new_this_month: number;
  growth_rate: number;
  active_members: number;
}

interface MemberGrowth {
  date: string;
  count: number;
}

interface MemberTrackingProps {
  communityId: string;
}

export const MemberTracking: React.FC<MemberTrackingProps> = ({ communityId }) => {
  const [stats, setStats] = useState<MemberStats>({
    total_members: 0,
    new_today: 0,
    new_this_week: 0,
    new_this_month: 0,
    growth_rate: 0,
    active_members: 0
  });
  const [growth, setGrowth] = useState<MemberGrowth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (communityId) {
      fetchMemberStats();
      // Set up real-time subscription
      const subscription = supabase
        .channel(`member_tracking_${communityId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'community_members',
            filter: `community_id=eq.${communityId}`
          },
          () => {
            // Refresh stats when members change
            fetchMemberStats();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [communityId]);

  const fetchMemberStats = async () => {
    if (!communityId) return;

    try {
      setLoading(true);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = subDays(now, 7);
      const monthAgo = subMonths(now, 1);

      // Fetch all members
      const { data: members, error } = await supabase
        .from('community_members')
        .select('id, joined_at')
        .eq('community_id', communityId);

      if (error) throw error;

      const totalMembers = members?.length || 0;
      
      // Calculate new members
      const newToday = members?.filter(m => 
        new Date(m.joined_at) >= today
      ).length || 0;

      const newThisWeek = members?.filter(m => 
        new Date(m.joined_at) >= weekAgo
      ).length || 0;

      const newThisMonth = members?.filter(m => 
        new Date(m.joined_at) >= monthAgo
      ).length || 0;

      // Calculate growth rate (percentage change from last month)
      const previousMonthStart = subMonths(monthAgo, 1);
      const previousMonthMembers = members?.filter(m => 
        new Date(m.joined_at) < monthAgo && new Date(m.joined_at) >= previousMonthStart
      ).length || 0;
      
      const growthRate = previousMonthMembers > 0 
        ? ((newThisMonth - previousMonthMembers) / previousMonthMembers) * 100
        : newThisMonth > 0 ? 100 : 0;

      // Calculate growth chart data (last 7 days)
      const growthData: MemberGrowth[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const count = members?.filter(m => 
          new Date(m.joined_at) <= dateStart
        ).length || 0;
        
        growthData.push({
          date: format(dateStart, 'MMM dd'),
          count
        });
      }

      setStats({
        total_members: totalMembers,
        new_today: newToday,
        new_this_week: newThisWeek,
        new_this_month: newThisMonth,
        growth_rate: Math.round(growthRate * 10) / 10,
        active_members: totalMembers // Can be refined with activity tracking
      });

      setGrowth(growthData);

    } catch (error) {
      console.error('Error fetching member stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Members
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {loading ? '...' : stats.total_members}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  New Today
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {loading ? '...' : stats.new_today}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <UserPlus className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  New This Week
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {loading ? '...' : stats.new_this_week}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Growth Rate
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {loading ? '...' : `${stats.growth_rate}%`}
                  </p>
                  {stats.growth_rate >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-full ${
                stats.growth_rate >= 0 
                  ? 'bg-green-100 dark:bg-green-900' 
                  : 'bg-red-100 dark:bg-red-900'
              }`}>
                <Activity className={`w-6 h-6 ${
                  stats.growth_rate >= 0 
                    ? 'text-green-600 dark:text-green-300' 
                    : 'text-red-600 dark:text-red-300'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Member Growth (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {growth.map((item, index) => {
                const prevCount = index > 0 ? growth[index - 1].count : item.count;
                const change = item.count - prevCount;
                return (
                  <div key={item.date} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.date}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {item.count}
                      </span>
                      {change !== 0 && (
                        <Badge variant={change > 0 ? "default" : "secondary"} className="text-xs">
                          {change > 0 ? '+' : ''}{change}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    New This Month
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.new_this_month}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active Members
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.active_members}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Average Daily Growth
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {Math.round((stats.new_this_week / 7) * 10) / 10}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberTracking;
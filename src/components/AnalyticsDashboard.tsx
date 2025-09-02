import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Video, 
  Calendar,
  Award,
  Clock,
  Activity,
  BarChart3,
  PieChart,
  Download
} from 'lucide-react';
import { usePerformanceMonitoring } from '@/utils/performanceMonitor';
import { useAchievements } from '@/hooks/useAchievements';
import { cn } from '@/lib/utils';

interface AnalyticsMetric {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

const AnalyticsDashboard = () => {
  const { getPerformanceSummary } = usePerformanceMonitoring();
  const { userStats } = useAchievements();
  const [performanceData, setPerformanceData] = useState<any>(null);

  useEffect(() => {
    const summary = getPerformanceSummary();
    setPerformanceData(summary);
  }, [getPerformanceSummary]);

  const userMetrics: AnalyticsMetric[] = [
    {
      label: 'Communities Joined',
      value: userStats?.communities_joined || 0,
      icon: <Users className="h-4 w-4" />,
      color: 'text-blue-600'
    },
    {
      label: 'Messages Sent',
      value: userStats?.messages_sent || 0,
      icon: <MessageCircle className="h-4 w-4" />,
      color: 'text-green-600'
    },
    {
      label: 'Video Calls',
      value: userStats?.video_calls_completed || 0,
      icon: <Video className="h-4 w-4" />,
      color: 'text-purple-600'
    },
    {
      label: 'Events Attended',
      value: userStats?.events_attended || 0,
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-orange-600'
    },
    {
      label: 'Total Points',
      value: userStats?.total_points || 0,
      icon: <Award className="h-4 w-4" />,
      color: 'text-yellow-600'
    },
    {
      label: 'Current Streak',
      value: `${userStats?.current_streak || 0} days`,
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-red-600'
    }
  ];

  const performanceMetrics = performanceData ? [
    {
      label: 'First Contentful Paint',
      value: `${(performanceData.coreWebVitals.fcp / 1000).toFixed(2)}s`,
      icon: <Clock className="h-4 w-4" />,
      color: 'text-blue-600',
      status: performanceData.coreWebVitals.fcp < 1800 ? 'good' : performanceData.coreWebVitals.fcp < 3000 ? 'needs-improvement' : 'poor'
    },
    {
      label: 'Largest Contentful Paint',
      value: `${(performanceData.coreWebVitals.lcp / 1000).toFixed(2)}s`,
      icon: <BarChart3 className="h-4 w-4" />,
      color: 'text-green-600',
      status: performanceData.coreWebVitals.lcp < 2500 ? 'good' : performanceData.coreWebVitals.lcp < 4000 ? 'needs-improvement' : 'poor'
    },
    {
      label: 'Cumulative Layout Shift',
      value: performanceData.coreWebVitals.cls.toFixed(3),
      icon: <Activity className="h-4 w-4" />,
      color: 'text-purple-600',
      status: performanceData.coreWebVitals.cls < 0.1 ? 'good' : performanceData.coreWebVitals.cls < 0.25 ? 'needs-improvement' : 'poor'
    },
    {
      label: 'Page Views',
      value: performanceData.sessionMetrics.pageViews,
      icon: <PieChart className="h-4 w-4" />,
      color: 'text-orange-600'
    }
  ] : [];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      case 'poor': return 'text-red-600 bg-red-100 dark:bg-red-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">Monitor your activity and app performance</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      <Tabs defaultValue="user-metrics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="user-metrics">User Activity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="user-metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userMetrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                  <div className={cn("p-2 rounded-full bg-gray-100 dark:bg-gray-800", metric.color)}>
                    {metric.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  {metric.change !== undefined && (
                    <p className={cn(
                      "text-xs flex items-center gap-1",
                      metric.change > 0 ? "text-green-600" : metric.change < 0 ? "text-red-600" : "text-gray-600"
                    )}>
                      <TrendingUp className="h-3 w-3" />
                      {metric.change > 0 ? '+' : ''}{metric.change}% from last month
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Level Progress */}
          {userStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Level Progress
                </CardTitle>
                <CardDescription>
                  You're currently Level {userStats.level} with {userStats.total_points} total points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Level {userStats.level}</span>
                    <span>Level {userStats.level + 1}</span>
                  </div>
                  <Progress value={65} className="h-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Complete more activities to level up and unlock new achievements!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {performanceMetrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                  <div className={cn("p-2 rounded-full bg-gray-100 dark:bg-gray-800", metric.color)}>
                    {metric.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  {(metric as any).status && (
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs mt-1", getStatusColor((metric as any).status))}
                    >
                      {(metric as any).status.replace('-', ' ')}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">App is performing well</span>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Excellent
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>• Your connection quality is stable</p>
                  <p>• Page load times are optimal</p>
                  <p>• No critical performance issues detected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
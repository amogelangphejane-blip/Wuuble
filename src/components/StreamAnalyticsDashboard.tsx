import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  Users,
  Eye,
  MessageCircle,
  Gift,
  Heart,
  Clock,
  Calendar,
  DollarSign,
  Star,
  Zap,
  Crown,
  Award,
  Target,
  Activity
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface StreamAnalytics {
  stream_id: string;
  stream_title: string;
  total_viewers: number;
  peak_viewers: number;
  total_messages: number;
  total_gifts: number;
  total_revenue: number;
  average_watch_time: number;
  engagement_rate: number;
  stream_duration: number;
  created_at: string;
}

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
  description: string;
}

interface ChartData {
  name: string;
  value: number;
  viewers?: number;
  messages?: number;
  gifts?: number;
  revenue?: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88', '#ff0088'];

export const StreamAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<StreamAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'viewers' | 'revenue' | 'engagement'>('viewers');
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Mock data for demonstration
  useEffect(() => {
    const mockAnalytics: StreamAnalytics[] = [
      {
        stream_id: '1',
        stream_title: 'Late Night Gaming Session',
        total_viewers: 1247,
        peak_viewers: 1580,
        total_messages: 3420,
        total_gifts: 89,
        total_revenue: 450,
        average_watch_time: 1800, // 30 minutes
        engagement_rate: 85.2,
        stream_duration: 7200, // 2 hours
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        stream_id: '2',
        stream_title: 'Art & Chill Stream',
        total_viewers: 892,
        peak_viewers: 1120,
        total_messages: 2150,
        total_gifts: 156,
        total_revenue: 780,
        average_watch_time: 2400, // 40 minutes
        engagement_rate: 92.1,
        stream_duration: 5400, // 1.5 hours
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        stream_id: '3',
        stream_title: 'Music & Chat',
        total_viewers: 2340,
        peak_viewers: 2890,
        total_messages: 5680,
        total_gifts: 234,
        total_revenue: 1200,
        average_watch_time: 3600, // 1 hour
        engagement_rate: 78.5,
        stream_duration: 10800, // 3 hours
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    setAnalytics(mockAnalytics);
    setLoading(false);
  }, [timeRange]);

  // Calculate summary metrics
  const totalStreams = analytics.length;
  const totalViewers = analytics.reduce((sum, a) => sum + a.total_viewers, 0);
  const totalRevenue = analytics.reduce((sum, a) => sum + a.total_revenue, 0);
  const averageEngagement = analytics.reduce((sum, a) => sum + a.engagement_rate, 0) / analytics.length || 0;
  const totalStreamTime = analytics.reduce((sum, a) => sum + a.stream_duration, 0);

  const metricCards: MetricCard[] = [
    {
      title: 'Total Viewers',
      value: totalViewers.toLocaleString(),
      change: 15.2,
      icon: Eye,
      color: 'text-blue-500',
      description: 'Unique viewers across all streams'
    },
    {
      title: 'Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      change: 23.8,
      icon: DollarSign,
      color: 'text-green-500',
      description: 'Total earnings from gifts and tips'
    },
    {
      title: 'Avg Engagement',
      value: `${averageEngagement.toFixed(1)}%`,
      change: 8.4,
      icon: Heart,
      color: 'text-pink-500',
      description: 'Average viewer engagement rate'
    },
    {
      title: 'Stream Time',
      value: `${Math.round(totalStreamTime / 3600)}h`,
      change: 12.1,
      icon: Clock,
      color: 'text-purple-500',
      description: 'Total streaming hours'
    }
  ];

  // Chart data
  const viewerChartData: ChartData[] = analytics.map((a, index) => ({
    name: `Stream ${index + 1}`,
    viewers: a.total_viewers,
    peak: a.peak_viewers,
    messages: a.total_messages,
    gifts: a.total_gifts,
    revenue: a.total_revenue
  }));

  const engagementPieData: ChartData[] = [
    { name: 'Messages', value: analytics.reduce((sum, a) => sum + a.total_messages, 0) },
    { name: 'Gifts', value: analytics.reduce((sum, a) => sum + a.total_gifts, 0) },
    { name: 'Reactions', value: 1250 }, // Mock data
    { name: 'Shares', value: 340 } // Mock data
  ];

  const revenueAreaData: ChartData[] = analytics.map((a, index) => ({
    name: format(new Date(a.created_at), 'MMM dd'),
    value: a.total_revenue,
    viewers: a.total_viewers
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Stream Analytics</h2>
          <p className="text-muted-foreground">Track your streaming performance and growth</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('7d')}
            size="sm"
          >
            7 Days
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('30d')}
            size="sm"
          >
            30 Days
          </Button>
          <Button
            variant={timeRange === '90d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('90d')}
            size="sm"
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <IconComponent className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  <span className="text-green-500">+{metric.change}%</span>
                  <span className="ml-1">from last period</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
              </CardContent>
              <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${
                metric.color.includes('blue') ? 'from-blue-500 to-blue-600' :
                metric.color.includes('green') ? 'from-green-500 to-green-600' :
                metric.color.includes('pink') ? 'from-pink-500 to-pink-600' :
                'from-purple-500 to-purple-600'
              }`} />
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <Tabs value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as any)}>
        <TabsList>
          <TabsTrigger value="viewers">
            <Eye className="w-4 h-4 mr-2" />
            Viewers
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <DollarSign className="w-4 h-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="engagement">
            <Heart className="w-4 h-4 mr-2" />
            Engagement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="viewers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Viewer Statistics</CardTitle>
                <CardDescription>Total and peak viewers per stream</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={viewerChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="viewers" fill="#8884d8" name="Total Viewers" />
                    <Bar dataKey="peak" fill="#82ca9d" name="Peak Viewers" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stream Performance</CardTitle>
                <CardDescription>Messages and interactions per stream</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={viewerChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="messages" stroke="#8884d8" name="Messages" />
                    <Line type="monotone" dataKey="gifts" stroke="#82ca9d" name="Gifts" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Earnings over time from gifts and tips</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={revenueAreaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Area type="monotone" dataKey="value" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Breakdown</CardTitle>
                <CardDescription>Types of viewer interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={engagementPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {engagementPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Streams</CardTitle>
                <CardDescription>Streams with highest engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics
                    .sort((a, b) => b.engagement_rate - a.engagement_rate)
                    .slice(0, 5)
                    .map((stream, index) => (
                      <div key={stream.stream_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-600' :
                            'bg-blue-500'
                          }`}>
                            {index === 0 ? <Crown className="w-4 h-4 text-white" /> :
                             index === 1 ? <Award className="w-4 h-4 text-white" /> :
                             index === 2 ? <Star className="w-4 h-4 text-white" /> :
                             <Target className="w-4 h-4 text-white" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm truncate max-w-[200px]">{stream.stream_title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(stream.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="mb-1">
                            {stream.engagement_rate.toFixed(1)}%
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {stream.total_viewers.toLocaleString()} viewers
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Streams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Streams</CardTitle>
          <CardDescription>Detailed breakdown of your latest streaming sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Stream</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-right p-2">Duration</th>
                  <th className="text-right p-2">Viewers</th>
                  <th className="text-right p-2">Peak</th>
                  <th className="text-right p-2">Messages</th>
                  <th className="text-right p-2">Gifts</th>
                  <th className="text-right p-2">Revenue</th>
                  <th className="text-right p-2">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((stream) => (
                  <tr key={stream.stream_id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="font-medium truncate max-w-[200px]">{stream.stream_title}</div>
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {format(new Date(stream.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="p-2 text-right text-sm">
                      {Math.round(stream.stream_duration / 3600)}h {Math.round((stream.stream_duration % 3600) / 60)}m
                    </td>
                    <td className="p-2 text-right">{stream.total_viewers.toLocaleString()}</td>
                    <td className="p-2 text-right">{stream.peak_viewers.toLocaleString()}</td>
                    <td className="p-2 text-right">{stream.total_messages.toLocaleString()}</td>
                    <td className="p-2 text-right">{stream.total_gifts}</td>
                    <td className="p-2 text-right text-green-600 font-medium">
                      ${stream.total_revenue.toLocaleString()}
                    </td>
                    <td className="p-2 text-right">
                      <Badge variant={stream.engagement_rate > 80 ? 'default' : 'secondary'}>
                        {stream.engagement_rate.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
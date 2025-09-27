import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Share2, 
  Clock,
  MapPin,
  Download,
  Filter,
  MoreVertical,
  Eye,
  Heart,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CommunityEvent, EventRSVP } from '@/types/events';
import { format, parseISO, subDays, subMonths } from 'date-fns';

interface EventAnalytics {
  totalViews: number;
  uniqueViews: number;
  rsvpRate: number;
  attendanceRate: number;
  sharesCount: number;
  clickThroughRate: number;
  topReferrers: { source: string; count: number }[];
  rsvpTrend: { date: string; going: number; maybe: number; total: number }[];
  categoryPerformance: { category: string; events: number; avgRsvp: number }[];
  timeSlotPerformance: { hour: number; events: number; avgAttendance: number }[];
  geographicData: { location: string; attendees: number }[];
}

interface EventAnalyticsDashboardProps {
  events: CommunityEvent[];
  selectedEventId?: string;
  onEventSelect: (eventId: string | undefined) => void;
  userCanViewAnalytics: boolean;
  className?: string;
}

export const EventAnalyticsDashboard = ({
  events,
  selectedEventId,
  onEventSelect,
  userCanViewAnalytics,
  className
}: EventAnalyticsDashboardProps) => {
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [loading, setLoading] = useState(false);

  // Mock analytics data - in production, this would come from your analytics service
  const generateMockAnalytics = (event?: CommunityEvent): EventAnalytics => {
    const rsvpCount = event?.rsvp_count || Math.floor(Math.random() * 100);
    const views = Math.floor(rsvpCount * (2 + Math.random() * 3));
    
    return {
      totalViews: views,
      uniqueViews: Math.floor(views * 0.8),
      rsvpRate: Math.floor((rsvpCount / views) * 100),
      attendanceRate: Math.floor(80 + Math.random() * 15),
      sharesCount: Math.floor(rsvpCount * 0.3),
      clickThroughRate: Math.floor(5 + Math.random() * 10),
      topReferrers: [
        { source: 'Direct Link', count: Math.floor(views * 0.4) },
        { source: 'Facebook', count: Math.floor(views * 0.25) },
        { source: 'Twitter', count: Math.floor(views * 0.15) },
        { source: 'Email', count: Math.floor(views * 0.2) }
      ],
      rsvpTrend: Array.from({ length: 14 }, (_, i) => {
        const date = subDays(new Date(), 13 - i);
        const going = Math.floor(Math.random() * 10);
        const maybe = Math.floor(Math.random() * 5);
        return {
          date: format(date, 'MMM dd'),
          going,
          maybe,
          total: going + maybe
        };
      }),
      categoryPerformance: [
        { category: 'Meetings', events: 15, avgRsvp: 45 },
        { category: 'Social', events: 8, avgRsvp: 78 },
        { category: 'Education', events: 12, avgRsvp: 52 },
        { category: 'Sports', events: 6, avgRsvp: 89 }
      ],
      timeSlotPerformance: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        events: Math.floor(Math.random() * 5),
        avgAttendance: Math.floor(60 + Math.random() * 40)
      })).filter(slot => slot.events > 0),
      geographicData: [
        { location: 'San Francisco', attendees: 45 },
        { location: 'New York', attendees: 32 },
        { location: 'Los Angeles', attendees: 28 },
        { location: 'Chicago', attendees: 23 },
        { location: 'Seattle', attendees: 18 }
      ]
    };
  };

  useEffect(() => {
    if (userCanViewAnalytics) {
      setLoading(true);
      setTimeout(() => {
        const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : undefined;
        setAnalytics(generateMockAnalytics(selectedEvent));
        setLoading(false);
      }, 500);
    }
  }, [selectedEventId, timeRange, events, userCanViewAnalytics]);

  if (!userCanViewAnalytics) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Analytics Not Available</h3>
            <p className="text-gray-600">You need event creator permissions to view analytics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : undefined;
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Event Analytics</h2>
            <p className="text-gray-600">
              {selectedEvent ? `Analytics for "${selectedEvent.title}"` : 'Overview of all your events'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedEventId || 'all'} onValueChange={(value) => onEventSelect(value === 'all' ? undefined : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Analytics
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Key Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.totalViews.toLocaleString()}</p>
                    <p className="text-sm text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +12% from last period
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-full">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">RSVP Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.rsvpRate}%</p>
                    <p className="text-sm text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +5% from last period
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-full">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Shares</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.sharesCount}</p>
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <TrendingDown className="h-4 w-4 mr-1" />
                      -2% from last period
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-full">
                    <Share2 className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.attendanceRate}%</p>
                    <p className="text-sm text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +8% from last period
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-full">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Analytics */}
        {analytics && (
          <Tabs defaultValue="engagement" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="engagement" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* RSVP Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>RSVP Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics.rsvpTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="going" stroke="#10b981" strokeWidth={2} />
                        <Line type="monotone" dataKey="maybe" stroke="#f59e0b" strokeWidth={2} />
                        <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Traffic Sources */}
                <Card>
                  <CardHeader>
                    <CardTitle>Traffic Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analytics.topReferrers}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {analytics.topReferrers.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Engagement Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Click-through Rate</span>
                        <span>{analytics.clickThroughRate}%</span>
                      </div>
                      <Progress value={analytics.clickThroughRate} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Share Rate</span>
                        <span>{Math.floor((analytics.sharesCount / analytics.totalViews) * 100)}%</span>
                      </div>
                      <Progress value={(analytics.sharesCount / analytics.totalViews) * 100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Return Visitor Rate</span>
                        <span>{Math.floor((1 - analytics.uniqueViews / analytics.totalViews) * 100)}%</span>
                      </div>
                      <Progress value={(1 - analytics.uniqueViews / analytics.totalViews) * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audience" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Geographic Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Geographic Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.geographicData.map((location, index) => (
                        <div key={location.location} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-sm font-medium">{location.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{location.attendees}</span>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full" 
                                style={{ 
                                  width: `${(location.attendees / Math.max(...analytics.geographicData.map(l => l.attendees))) * 100}%`,
                                  backgroundColor: COLORS[index % COLORS.length]
                                }} 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Audience Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle>Audience Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">New Attendees</span>
                        </div>
                        <span className="text-blue-600 font-bold">23%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Heart className="h-5 w-5 text-green-600" />
                          <span className="font-medium">Repeat Attendees</span>
                        </div>
                        <span className="text-green-600 font-bold">77%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-purple-600" />
                          <span className="font-medium">Engagement Score</span>
                        </div>
                        <span className="text-purple-600 font-bold">8.4/10</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Category Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.categoryPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avgRsvp" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Time Slot Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Best Time Slots</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.timeSlotPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="hour" 
                          tickFormatter={(hour) => `${hour}:00`}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(hour) => `${hour}:00`}
                        />
                        <Bar dataKey="avgAttendance" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">High Performance</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Evening events (6-8 PM) have 40% higher attendance rates than morning events.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-800">Engagement Opportunity</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Events with cover images get 60% more views than those without.
                      </p>
                    </div>

                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <span className="font-medium text-orange-800">Timing Insight</span>
                      </div>
                      <p className="text-sm text-orange-700">
                        Publishing events 2-3 weeks in advance results in higher RSVP rates.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Optimize Event Timing</p>
                          <p className="text-sm text-gray-600">Schedule more events between 6-8 PM for better attendance</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Add Cover Images</p>
                          <p className="text-sm text-gray-600">Include attractive cover images to increase visibility</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Promote on Facebook</p>
                          <p className="text-sm text-gray-600">Facebook is your top referral source - increase promotion there</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Early Planning</p>
                          <p className="text-sm text-gray-600">Plan and publish events earlier for better RSVP rates</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};
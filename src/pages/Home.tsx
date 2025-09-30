import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ModernHeader } from '@/components/ModernHeader';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Calendar, 
  Plus,
  Activity,
  Video,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { validateAvatarUrl } from '@/lib/utils';
import { useFollowedCommunities } from '@/hooks/useFollowedCommunities';
import { useActivityFeed } from '@/hooks/useActivityFeed';

const Home = () => {
  const { user, loading: authLoading } = useAuth();
  const { followedCommunities, isLoading: loading } = useFollowedCommunities();
  const { activities: recentActivity, isLoading: activityLoading } = useActivityFeed();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <MessageCircle className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'member_joined':
        return <Users className="h-4 w-4" />;
      case 'video_call':
        return <Video className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'post':
        return 'text-blue-600';
      case 'event':
        return 'text-green-600';
      case 'member_joined':
        return 'text-purple-600';
      case 'video_call':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-primary" />
                Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}!
              </h1>
              <p className="text-muted-foreground">Stay connected with your communities</p>
            </div>
            <Button
              onClick={() => navigate('/communities')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Explore Communities
            </Button>
          </div>

          {/* Stats Bar */}
          {!loading && followedCommunities.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Joined Communities</p>
                      <p className="text-2xl font-bold text-foreground">{followedCommunities.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Recent Activities</p>
                      <p className="text-2xl font-bold text-foreground">{recentActivity.length}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Members</p>
                      <p className="text-2xl font-bold text-foreground">
                        {followedCommunities.reduce((sum, c) => sum + c.member_count, 0)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Communities Section - Enhanced */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  My Communities
                </h2>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <Skeleton className="h-16 w-16 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-full" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : followedCommunities.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="text-center py-12">
                    <div className="text-6xl mb-4">🏠</div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No communities yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                      Discover and join communities that match your interests
                    </p>
                    <Button
                      onClick={() => navigate('/communities')}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Find Communities
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {followedCommunities.map((community) => (
                    <Card 
                      key={community.id}
                      className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
                      onClick={() => navigate(`/community/${community.id}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start space-x-4 mb-4">
                          <Avatar className="h-16 w-16 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                            <AvatarImage 
                              src={validateAvatarUrl(community.avatar_url)} 
                              alt={community.name} 
                            />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold text-lg">
                              {community.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate mb-1 group-hover:text-primary transition-colors">
                              {community.name}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {community.description}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {community.member_count} members
                              </Badge>
                              {community.subscription_plan && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    community.subscription_status === 'active' 
                                      ? 'border-green-500 text-green-600' 
                                      : 'border-blue-500 text-blue-600'
                                  }`}
                                >
                                  {community.subscription_plan}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {community.last_activity ? formatDistanceToNow(new Date(community.last_activity), { addSuffix: true }) : 'No recent activity'}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs group-hover:bg-primary/10 group-hover:text-primary transition-all"
                          >
                            View
                            <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
                </h2>
              </div>
              
              {activityLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-2">
                          <Skeleton className="h-5 w-5 rounded" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-2 w-3/4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="text-center py-8">
                    <div className="text-4xl mb-3">📱</div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      No activity yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Activity from your communities will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-thin">
                  {recentActivity.slice(0, 10).map((activity) => (
                    <Card 
                      key={activity.id}
                      className="hover:shadow-md transition-all cursor-pointer group hover:border-primary/50"
                      onClick={() => navigate(`/community/${activity.community_id}`)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-2">
                          <div className={`p-1.5 rounded-md shrink-0 ${
                            activity.type === 'post' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                            activity.type === 'event' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                            activity.type === 'member_joined' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                            activity.type === 'video_call' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {activity.title}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate mb-1">
                              {activity.community_name}
                            </p>
                            {activity.content && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {activity.content}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                              </span>
                              {activity.engagement && (
                                <div className="flex items-center gap-2">
                                  {activity.engagement.likes > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Heart className="h-3 w-3" />
                                      {activity.engagement.likes}
                                    </span>
                                  )}
                                  {activity.engagement.comments > 0 && (
                                    <span className="flex items-center gap-1">
                                      <MessageCircle className="h-3 w-3" />
                                      {activity.engagement.comments}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
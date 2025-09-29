import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ModernHeader } from '@/components/ModernHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Calendar, 
  TrendingUp, 
  Clock,
  Star,
  ArrowRight,
  Plus,
  Activity,
  BookOpen,
  Video,
  Image as ImageIcon,
  Sparkles,
  Search
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { validateAvatarUrl } from '@/lib/utils';
import { useFollowedCommunities } from '@/hooks/useFollowedCommunities';
import { useActivityFeed } from '@/hooks/useActivityFeed';

const Home = () => {
  const { user, loading: authLoading } = useAuth();
  const { followedCommunities, isLoading: loading } = useFollowedCommunities();
  const { activities: recentActivity, isLoading: activityLoading } = useActivityFeed();
  const { toast } = useToast();
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
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}!
              </h1>
              <p className="text-muted-foreground">
                Stay connected with your communities
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Button
              variant="outline"
              className="justify-start h-auto p-4 hover:bg-muted/50 transition-colors"
              onClick={() => navigate('/communities')}
            >
              <Search className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium">Explore</div>
                <div className="text-xs text-muted-foreground">Find new communities</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4 hover:bg-muted/50 transition-colors"
              onClick={() => navigate('/messages')}
            >
              <MessageCircle className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium">Messages</div>
                <div className="text-xs text-muted-foreground">Chat with members</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4 hover:bg-muted/50 transition-colors"
              onClick={() => navigate('/profile')}
            >
              <Users className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium">Profile</div>
                <div className="text-xs text-muted-foreground">Edit your profile</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4 hover:bg-muted/50 transition-colors"
              onClick={() => {
                // Navigate to the first community if user has any, otherwise to communities page
                if (followedCommunities.length > 0) {
                  navigate(`/community/${followedCommunities[0].id}/calendar`);
                } else {
                  navigate('/communities');
                }
              }}
            >
              <Calendar className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium">Events</div>
                <div className="text-xs text-muted-foreground">View upcoming events</div>
              </div>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Followed Communities Section */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-sm bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Your Communities
                  <Badge variant="secondary" className="ml-auto">
                    {followedCommunities.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] lg:h-[500px]">
                  {loading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-3 p-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-1 flex-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : followedCommunities.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No communities yet
                      </p>
                      <Button
                        onClick={() => navigate('/communities')}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Discover Communities
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {followedCommunities.map((community) => (
                        <div
                          key={community.id}
                          className="flex items-center space-x-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-all duration-200 hover:shadow-sm"
                          onClick={() => navigate(`/community/${community.id}`)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={validateAvatarUrl(community.avatar_url)} 
                              alt={community.name} 
                            />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                              {community.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate text-sm">
                              {community.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {community.member_count}
                              <Badge 
                                variant={community.subscription_status === 'active' ? 'default' : 'secondary'}
                                className="text-xs px-1.5 py-0.5"
                              >
                                {community.subscription_status}
                              </Badge>
                            </div>
                          </div>
                          <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Section */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] lg:h-[500px]">
                  {activityLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="p-4 rounded-xl border border-border">
                          <div className="flex items-start space-x-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-1/3" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-3 w-2/3" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentActivity.length === 0 ? (
                    <div className="text-center py-16">
                      <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-foreground font-medium mb-2">
                        No recent activity
                      </p>
                      <p className="text-sm text-muted-foreground mb-6">
                        Join communities to see their latest updates here
                      </p>
                      <Button
                        onClick={() => navigate('/communities')}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Find Communities
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((activity) => (
                        <div 
                          key={activity.id}
                          className="p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => navigate(`/community/${activity.community_id}`)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-1.5 rounded-lg ${
                              activity.type === 'post' ? 'bg-blue-100 text-blue-600' :
                              activity.type === 'event' ? 'bg-green-100 text-green-600' :
                              activity.type === 'member_joined' ? 'bg-purple-100 text-purple-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-foreground text-sm">
                                    {activity.title}
                                  </h4>
                                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                                    {activity.community_name}
                                  </Badge>
                                </div>
                              </div>
                              
                              {activity.content && (
                                <p className="text-muted-foreground text-sm mb-3 line-clamp-2 leading-relaxed">
                                  {activity.content}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                </span>
                                {activity.engagement && (
                                  <>
                                    <span className="flex items-center gap-1">
                                      <Heart className="h-3 w-3" />
                                      {activity.engagement.likes}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MessageCircle className="h-3 w-3" />
                                      {activity.engagement.comments}
                                    </span>
                                  </>
                                )}
                                {activity.user_name && (
                                  <span className="ml-auto text-xs text-muted-foreground">
                                    by {activity.user_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
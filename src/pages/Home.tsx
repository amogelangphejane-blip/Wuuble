import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ModernHeader } from '@/components/ModernHeader';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Calendar, 
  Plus,
  Activity,
  Video
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
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Simple Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Hello, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
          </h1>
          <p className="text-muted-foreground">Here's what's happening in your communities</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Communities Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-foreground">Communities</h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate('/communities')}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              ) : followedCommunities.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🏠</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    No communities yet
                  </p>
                  <Button
                    size="sm"
                    onClick={() => navigate('/communities')}
                    className="text-xs"
                  >
                    Find Communities
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {followedCommunities.map((community) => (
                    <div
                      key={community.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/community/${community.id}`)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={validateAvatarUrl(community.avatar_url)} 
                          alt={community.name} 
                        />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {community.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {community.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {community.member_count} members
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              <h2 className="font-medium text-foreground">Recent Activity</h2>
              
              {activityLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start space-x-3">
                        <Skeleton className="h-6 w-6 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📱</div>
                  <p className="text-lg font-medium text-foreground mb-2">
                    No activity yet
                  </p>
                  <p className="text-muted-foreground mb-6">
                    Join communities to see their latest posts and updates
                  </p>
                  <Button onClick={() => navigate('/communities')}>
                    Explore Communities
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div 
                      key={activity.id}
                      className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow cursor-pointer"
                      onClick={() => navigate(`/community/${activity.community_id}`)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-1 rounded ${
                          activity.type === 'post' ? 'bg-blue-50 text-blue-600' :
                          activity.type === 'event' ? 'bg-green-50 text-green-600' :
                          activity.type === 'member_joined' ? 'bg-purple-50 text-purple-600' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-foreground">
                              {activity.title}
                            </h3>
                            <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                              {activity.community_name}
                            </span>
                          </div>
                          
                          {activity.content && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {activity.content}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                            </span>
                            {activity.engagement && (
                              <>
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
                              </>
                            )}
                            {activity.user_name && (
                              <span className="ml-auto">by {activity.user_name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
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
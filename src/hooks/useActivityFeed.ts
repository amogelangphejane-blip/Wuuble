import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ActivityItem {
  id: string;
  type: 'post' | 'event' | 'member_joined' | 'video_call';
  title: string;
  content?: string;
  community_id: string;
  community_name: string;
  community_avatar?: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  created_at: string;
  engagement?: {
    likes: number;
    comments: number;
  };
}

export const useActivityFeed = () => {
  const { user } = useAuth();

  const {
    data: activities,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['activity-feed', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First, get the communities the user is following
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('community_member_subscriptions')
        .select('community_id')
        .eq('user_id', user.id)
        .in('status', ['active', 'trial']);

      if (subscriptionsError) throw subscriptionsError;

      const followedCommunityIds = subscriptions?.map(sub => sub.community_id) || [];
      
      if (followedCommunityIds.length === 0) {
        return [];
      }

      const activities: ActivityItem[] = [];

      // Fetch recent posts from followed communities
      const { data: posts, error: postsError } = await supabase
        .from('community_posts')
        .select(`
          id,
          content,
          image_url,
          community_id,
          user_id,
          created_at,
          category,
          communities (
            name,
            avatar_url
          ),
          profiles (
            full_name,
            avatar_url
          )
        `)
        .in('community_id', followedCommunityIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      // Transform posts to activity items
      if (posts) {
        for (const post of posts) {
          // Get engagement data for each post
          const { data: likes } = await supabase
            .from('community_post_likes')
            .select('id')
            .eq('post_id', post.id);

          const { data: comments } = await supabase
            .from('community_post_comments')
            .select('id')
            .eq('post_id', post.id);

          activities.push({
            id: post.id,
            type: 'post',
            title: post.category === 'announcement' ? '📢 New Announcement' : 
                   post.category === 'question' ? '❓ New Question' : 
                   post.category === 'event' ? '📅 New Event' :
                   '💬 New Post',
            content: post.content || (post.image_url ? 'Shared an image' : ''),
            community_id: post.community_id,
            community_name: post.communities?.name || 'Unknown Community',
            community_avatar: post.communities?.avatar_url,
            user_id: post.user_id,
            user_name: post.profiles?.full_name || 'Anonymous User',
            user_avatar: post.profiles?.avatar_url,
            created_at: post.created_at,
            engagement: {
              likes: likes?.length || 0,
              comments: comments?.length || 0
            }
          });
        }
      }

      // Fetch recent events from followed communities
      const { data: events, error: eventsError } = await supabase
        .from('community_events')
        .select(`
          id,
          title,
          description,
          event_date,
          community_id,
          user_id,
          created_at,
          communities (
            name,
            avatar_url
          ),
          profiles (
            full_name,
            avatar_url
          )
        `)
        .in('community_id', followedCommunityIds)
        .gte('event_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (eventsError) throw eventsError;

      // Transform events to activity items
      if (events) {
        for (const event of events) {
          activities.push({
            id: event.id,
            type: 'event',
            title: `📅 ${event.title}`,
            content: event.description,
            community_id: event.community_id,
            community_name: event.communities?.name || 'Unknown Community',
            community_avatar: event.communities?.avatar_url,
            user_id: event.user_id,
            user_name: event.profiles?.full_name || 'Anonymous User',
            user_avatar: event.profiles?.avatar_url,
            created_at: event.created_at
          });
        }
      }

      // Fetch recent member joins (this would require a separate table to track membership changes)
      // For now, we'll skip this as it would require additional database schema changes

      // Sort all activities by creation date
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return activities.slice(0, 50); // Return top 50 activities
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    activities: activities || [],
    isLoading,
    error,
    refetch
  };
};
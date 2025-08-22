import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FollowedCommunity {
  id: string;
  name: string;
  description: string;
  avatar_url?: string | null;
  member_count: number;
  subscription_status: string;
  last_activity?: string;
  subscription_plan?: string;
  current_period_end?: string;
}

export const useFollowedCommunities = () => {
  const { user } = useAuth();

  const {
    data: followedCommunities,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['followed-communities', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch communities where user has active subscriptions
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('community_member_subscriptions')
        .select(`
          *,
          community:communities (
            id,
            name,
            description,
            avatar_url,
            member_count
          ),
          plan:community_subscription_plans (
            name,
            price_monthly,
            price_yearly
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'trial'])
        .order('created_at', { ascending: false });

      if (subscriptionsError) throw subscriptionsError;

      // Transform the data to match our interface
      const followedCommunities: FollowedCommunity[] = (subscriptions || [])
        .filter(sub => sub.community) // Filter out any null communities
        .map(subscription => ({
          id: subscription.community.id,
          name: subscription.community.name,
          description: subscription.community.description || '',
          avatar_url: subscription.community.avatar_url,
          member_count: subscription.community.member_count,
          subscription_status: subscription.status,
          subscription_plan: subscription.plan?.name || 'Free',
          current_period_end: subscription.current_period_end,
          // We'll add last_activity later when we implement activity tracking
          last_activity: subscription.updated_at
        }));

      return followedCommunities;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    followedCommunities: followedCommunities || [],
    isLoading,
    error,
    refetch
  };
};
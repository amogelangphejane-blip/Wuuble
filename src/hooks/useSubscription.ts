import { useState, useEffect } from 'react';
import { SubscriptionService } from '@/services/subscriptionService';
import { 
  SubscriptionPlan, 
  MemberSubscription, 
  SubscriptionStatus,
  SubscriptionMetrics 
} from '@/types/subscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export function useSubscription(communityId: string) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<MemberSubscription | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptionData();
    
    // Set up real-time subscription for subscription changes
    const channel = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_member_subscriptions',
          filter: `community_id=eq.${communityId}`,
        },
        () => {
          loadSubscriptionData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Load subscription plans
      const plansData = await SubscriptionService.getSubscriptionPlans(communityId);
      setPlans(plansData);

      // Load user's subscription
      const subscriptionData = await SubscriptionService.getUserSubscription(communityId, user.id);
      setSubscription(subscriptionData);

      // Load subscription status
      const statusData = await SubscriptionService.getSubscriptionStatus(communityId, user.id);
      setStatus(statusData);

      // Check if user has active subscription
      const isActive = await SubscriptionService.hasActiveSubscription(communityId, user.id);
      setHasActiveSubscription(isActive);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (
    planId: string,
    billingCycle: 'monthly' | 'yearly',
    stripeCustomerId?: string,
    couponId?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newSubscription = await SubscriptionService.createMemberSubscription(
        {
          community_id: communityId,
          plan_id: planId,
          billing_cycle: billingCycle,
        },
        user.id,
        stripeCustomerId,
        couponId
      );

      await loadSubscriptionData();
      
      toast({
        title: 'Success!',
        description: 'Your subscription has been activated',
      });

      return newSubscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to create subscription',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const cancel = async () => {
    try {
      if (!subscription) {
        throw new Error('No active subscription to cancel');
      }

      await SubscriptionService.cancelSubscription(subscription.id);
      await loadSubscriptionData();
      
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription has been cancelled. You can continue using premium features until the end of your billing period.',
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const refresh = async () => {
    await loadSubscriptionData();
  };

  return {
    loading,
    plans,
    subscription,
    status,
    hasActiveSubscription,
    subscribe,
    cancel,
    refresh,
  };
}

export function useSubscriptionMetrics(communityId: string) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
  }, [communityId]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const metricsData = await SubscriptionService.getSubscriptionMetrics(communityId);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading subscription metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription metrics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    metrics,
    refresh: loadMetrics,
  };
}

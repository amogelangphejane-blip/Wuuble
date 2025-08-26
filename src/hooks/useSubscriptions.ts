import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { handleError } from '@/utils/errorHandling';
import {
  SubscriptionPlan,
  MemberSubscription,
  SubscriptionPayment,
  SubscriptionStatus,
  CreateSubscriptionPlanRequest,
  UpdateSubscriptionPlanRequest,
  CreateMemberSubscriptionRequest,
  SubscriptionMetrics,
  BillingHistory
} from '@/types/subscription';

export const useSubscriptions = (communityId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real-time subscription updates
  useEffect(() => {
    if (!communityId || !user?.id) return;

    const subscription = supabase
      .channel(`subscription_${communityId}_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_member_subscriptions',
          filter: `community_id=eq.${communityId} and user_id=eq.${user.id}`
        },
        () => {
          // Refetch subscription data
          queryClient.invalidateQueries({ queryKey: ['user-subscription', communityId, user.id] });
          queryClient.invalidateQueries({ queryKey: ['subscription-status', communityId, user.id] });
          queryClient.invalidateQueries({ queryKey: ['has-active-subscription', communityId, user.id] });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [communityId, user?.id, queryClient]);

  // Fetch subscription plans for a community
  const {
    data: subscriptionPlans,
    isLoading: plansLoading,
    error: plansError
  } = useQuery({
    queryKey: ['subscription-plans', communityId],
    queryFn: async () => {
      if (!communityId) return [];
      
      const { data, error } = await supabase
        .from('community_subscription_plans')
        .select('*')
        .eq('community_id', communityId)
        .eq('is_active', true)
        .order('price_monthly', { ascending: true, nullsFirst: true });

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
    enabled: !!communityId
  });

  // Fetch user's subscription status for a community
  const {
    data: userSubscription,
    isLoading: subscriptionLoading,
    error: subscriptionError
  } = useQuery({
    queryKey: ['user-subscription', communityId, user?.id],
    queryFn: async () => {
      if (!communityId || !user?.id) return null;

      const { data, error } = await supabase
        .from('community_member_subscriptions')
        .select(`
          *,
          plan:community_subscription_plans(*)
        `)
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as MemberSubscription | null;
    },
    enabled: !!communityId && !!user?.id
  });

  // Fetch subscription status using database function
  const {
    data: subscriptionStatus,
    isLoading: statusLoading
  } = useQuery({
    queryKey: ['subscription-status', communityId, user?.id],
    queryFn: async () => {
      if (!communityId || !user?.id) return null;

      const { data, error } = await supabase
        .rpc('get_subscription_status', {
          p_community_id: communityId,
          p_user_id: user.id
        });

      if (error) throw error;
      return data?.[0] as SubscriptionStatus | null;
    },
    enabled: !!communityId && !!user?.id
  });

  // Check if user has active subscription
  const hasActiveSubscription = useQuery({
    queryKey: ['has-active-subscription', communityId, user?.id],
    queryFn: async () => {
      if (!communityId || !user?.id) return false;

      const { data, error } = await supabase
        .rpc('has_active_subscription', {
          p_community_id: communityId,
          p_user_id: user.id
        });

      if (error) throw error;
      return data as boolean;
    },
    enabled: !!communityId && !!user?.id
  });

  // Fetch billing history
  const {
    data: billingHistory,
    isLoading: billingLoading
  } = useQuery({
    queryKey: ['billing-history', userSubscription?.id],
    queryFn: async () => {
      if (!userSubscription?.id) return null;

      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('subscription_id', userSubscription.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const payments = data as SubscriptionPayment[];
      const totalPaid = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        payments,
        total_paid: totalPaid,
        next_payment_date: userSubscription.current_period_end,
        next_payment_amount: userSubscription.plan?.price_monthly || 0
      } as BillingHistory;
    },
    enabled: !!userSubscription?.id
  });

  // Create subscription plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (planData: CreateSubscriptionPlanRequest) => {
      console.log('Creating subscription plan with data:', planData);
      
      // Validate required fields
      if (!planData.community_id) {
        throw new Error('Community ID is required');
      }
      if (!planData.name || planData.name.trim() === '') {
        throw new Error('Plan name is required');
      }
      if (!planData.features || planData.features.length === 0) {
        throw new Error('At least one feature is required');
      }
      
      const { data, error } = await supabase
        .from('community_subscription_plans')
        .insert(planData)
        .select()
        .single();

      if (error) {
        console.error('Database error creating subscription plan:', error);
        
        // Provide more specific error messages based on common database errors
        if (error.code === '23503') {
          throw new Error('Invalid community ID - the community may not exist or you may not have access to it');
        } else if (error.code === '23505') {
          throw new Error('A subscription plan with this name already exists in this community');
        } else if (error.code === '42501') {
          throw new Error('Permission denied - you may not have permission to create subscription plans for this community');
        } else if (error.message?.includes('violates row-level security')) {
          throw new Error('Access denied - only community creators can create subscription plans');
        } else if (error.message?.includes('violates check constraint')) {
          throw new Error('Invalid data provided - please check all required fields');
        }
        
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans', communityId] });
      toast({
        title: "Success",
        description: "Subscription plan created successfully",
      });
    },
    onError: (error) => {
      console.error('Failed to create subscription plan:', error);
      const errorMessage = handleError(error, 'create');
      
      toast({
        title: "Error",
        description: `Failed to create subscription plan: ${errorMessage}`,
        variant: "destructive",
      });
    }
  });

  // Update subscription plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ planId, updates }: { planId: string; updates: UpdateSubscriptionPlanRequest }) => {
      const { data, error } = await supabase
        .from('community_subscription_plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans', communityId] });
      toast({
        title: "Success",
        description: "Subscription plan updated successfully",
      });
    },
    onError: (error) => {
      console.error('Failed to update subscription plan:', error);
      const errorMessage = handleError(error, 'update');
      
      toast({
        title: "Error",
        description: `Failed to update subscription plan: ${errorMessage}`,
        variant: "destructive",
      });
    }
  });

  // Subscribe to plan mutation
  const subscribeMutation = useMutation({
    mutationFn: async (subscriptionData: CreateMemberSubscriptionRequest) => {
      const plan = subscriptionPlans?.find(p => p.id === subscriptionData.plan_id);
      if (!plan) throw new Error('Plan not found');

      const now = new Date();
      const trialEnd = plan.trial_days > 0 
        ? new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000)
        : null;
      
      const periodEnd = subscriptionData.billing_cycle === 'yearly'
        ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
        : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      const { data, error } = await supabase
        .from('community_member_subscriptions')
        .insert({
          ...subscriptionData,
          user_id: user!.id,
          status: plan.trial_days > 0 ? 'trial' : 'active',
          current_period_start: now.toISOString(),
          current_period_end: (trialEnd || periodEnd).toISOString(),
          trial_start: plan.trial_days > 0 ? now.toISOString() : null,
          trial_end: trialEnd?.toISOString() || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription', communityId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['subscription-status', communityId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['has-active-subscription', communityId, user?.id] });
      toast({
        title: "Success",
        description: "Successfully subscribed to plan",
      });
    },
    onError: (error) => {
      console.error('Failed to subscribe:', error);
      const errorMessage = handleError(error, 'subscribe');
      
      toast({
        title: "Error",
        description: `Failed to subscribe: ${errorMessage}`,
        variant: "destructive",
      });
    }
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data, error } = await supabase
        .from('community_member_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription', communityId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['subscription-status', communityId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['has-active-subscription', communityId, user?.id] });
      toast({
        title: "Success",
        description: "Subscription cancelled successfully",
      });
    },
    onError: (error) => {
      console.error('Failed to cancel subscription:', error);
      const errorMessage = handleError(error, 'cancel');
      
      toast({
        title: "Error",
        description: `Failed to cancel subscription: ${errorMessage}`,
        variant: "destructive",
      });
    }
  });

  return {
    // Data
    subscriptionPlans,
    userSubscription,
    subscriptionStatus,
    billingHistory,
    
    // Loading states
    plansLoading,
    subscriptionLoading,
    statusLoading,
    billingLoading,
    
    // Computed values
    hasActiveSubscription: hasActiveSubscription.data || false,
    isOnTrial: subscriptionStatus?.is_trial || false,
    
    // Mutations
    createPlan: createPlanMutation.mutate,
    updatePlan: updatePlanMutation.mutate,
    subscribe: subscribeMutation.mutate,
    cancelSubscription: cancelSubscriptionMutation.mutate,
    
    // Loading states for mutations
    isCreatingPlan: createPlanMutation.isPending,
    isUpdatingPlan: updatePlanMutation.isPending,
    isSubscribing: subscribeMutation.isPending,
    isCancelling: cancelSubscriptionMutation.isPending,
    
    // Errors
    plansError,
    subscriptionError
  };
};

export const useSubscriptionMetrics = (communityId: string) => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['subscription-metrics', communityId],
    queryFn: async () => {
      // Fetch subscription metrics
      const { data: subscriptions, error } = await supabase
        .from('community_member_subscriptions')
        .select(`
          *,
          plan:community_subscription_plans(price_monthly, price_yearly)
        `)
        .eq('community_id', communityId);

      if (error) throw error;

      const total = subscriptions.length;
      const active = subscriptions.filter(s => s.status === 'active').length;
      const trial = subscriptions.filter(s => s.status === 'trial').length;
      
      const monthlyRevenue = subscriptions
        .filter(s => s.status === 'active' && s.billing_cycle === 'monthly')
        .reduce((sum, s) => sum + (s.plan?.price_monthly || 0), 0);
        
      const yearlyRevenue = subscriptions
        .filter(s => s.status === 'active' && s.billing_cycle === 'yearly')
        .reduce((sum, s) => sum + (s.plan?.price_yearly || 0), 0);

      return {
        total_subscribers: total,
        active_subscribers: active,
        trial_subscribers: trial,
        monthly_revenue: monthlyRevenue,
        yearly_revenue: yearlyRevenue,
        churn_rate: 0, // Would need historical data to calculate
        conversion_rate: total > 0 ? (active / total) * 100 : 0
      } as SubscriptionMetrics;
    },
    enabled: !!communityId
  });

  return { metrics, isLoading };
};
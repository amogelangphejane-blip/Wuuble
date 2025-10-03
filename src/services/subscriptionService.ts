import { supabase } from '@/integrations/supabase/client';
import { 
  SubscriptionPlan, 
  MemberSubscription, 
  CreateSubscriptionPlanRequest,
  UpdateSubscriptionPlanRequest,
  CreateMemberSubscriptionRequest,
  SubscriptionStatus,
  SubscriptionMetrics,
  SubscriptionPayment
} from '@/types/subscription';
import { StripeService } from './stripeService';

export class SubscriptionService {
  /**
   * Get all subscription plans for a community
   */
  static async getSubscriptionPlans(communityId: string): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('community_subscription_plans')
      .select('*')
      .eq('community_id', communityId)
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get a specific subscription plan
   */
  static async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    const { data, error } = await supabase
      .from('community_subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      console.error('Error fetching subscription plan:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create a new subscription plan
   */
  static async createSubscriptionPlan(request: CreateSubscriptionPlanRequest): Promise<SubscriptionPlan> {
    // Create Stripe product and prices if Stripe is enabled
    let stripeProductId, stripePriceMonthly, stripePriceYearly;

    try {
      const productResult = await StripeService.createProduct(
        request.name,
        request.description
      );
      stripeProductId = productResult.productId;

      if (request.price_monthly) {
        const monthlyPriceResult = await StripeService.createPrice(
          stripeProductId,
          Math.round(request.price_monthly * 100), // Convert to cents
          'usd',
          'month'
        );
        stripePriceMonthly = monthlyPriceResult.priceId;
      }

      if (request.price_yearly) {
        const yearlyPriceResult = await StripeService.createPrice(
          stripeProductId,
          Math.round(request.price_yearly * 100), // Convert to cents
          'usd',
          'year'
        );
        stripePriceYearly = yearlyPriceResult.priceId;
      }
    } catch (error) {
      console.warn('Stripe product/price creation failed, continuing with database-only plan:', error);
    }

    const { data, error } = await supabase
      .from('community_subscription_plans')
      .insert({
        community_id: request.community_id,
        name: request.name,
        description: request.description,
        price_monthly: request.price_monthly,
        price_yearly: request.price_yearly,
        trial_days: request.trial_days || 0,
        features: request.features,
        max_members: request.max_members,
        stripe_product_id: stripeProductId,
        stripe_price_monthly: stripePriceMonthly,
        stripe_price_yearly: stripePriceYearly,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription plan:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update a subscription plan
   */
  static async updateSubscriptionPlan(planId: string, request: UpdateSubscriptionPlanRequest): Promise<SubscriptionPlan> {
    const { data, error } = await supabase
      .from('community_subscription_plans')
      .update(request)
      .eq('id', planId)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription plan:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get user's subscription for a community
   */
  static async getUserSubscription(communityId: string, userId: string): Promise<MemberSubscription | null> {
    const { data, error } = await supabase
      .from('community_member_subscriptions')
      .select(`
        *,
        plan:community_subscription_plans(*),
        coupon:subscription_coupons(*)
      `)
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No subscription found
        return null;
      }
      console.error('Error fetching user subscription:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create a new member subscription
   */
  static async createMemberSubscription(
    request: CreateMemberSubscriptionRequest,
    userId: string,
    stripeCustomerId?: string,
    couponId?: string
  ): Promise<MemberSubscription> {
    const plan = await this.getSubscriptionPlan(request.plan_id);
    if (!plan) {
      throw new Error('Subscription plan not found');
    }

    // Calculate period dates
    const now = new Date();
    const periodStart = now;
    const periodEnd = new Date(now);
    
    if (request.billing_cycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Handle trial period
    let trialStart, trialEnd, status: MemberSubscription['status'];
    if (plan.trial_days > 0) {
      trialStart = now;
      trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + plan.trial_days);
      status = 'trial';
    } else {
      status = 'active';
    }

    // Create Stripe subscription if Stripe is enabled
    let stripeSubscriptionId;
    if (stripeCustomerId && plan.stripe_price_monthly) {
      try {
        const stripePriceId = request.billing_cycle === 'monthly' 
          ? plan.stripe_price_monthly 
          : plan.stripe_price_yearly;

        if (stripePriceId) {
          const stripeResult = await StripeService.createSubscription(
            stripeCustomerId,
            stripePriceId,
            {
              community_id: request.community_id,
              plan_id: request.plan_id,
              user_id: userId,
            }
          );

          if (stripeResult.success) {
            stripeSubscriptionId = stripeResult.paymentId;
          }
        }
      } catch (error) {
        console.warn('Stripe subscription creation failed, continuing with database-only subscription:', error);
      }
    }

    const { data, error } = await supabase
      .from('community_member_subscriptions')
      .insert({
        community_id: request.community_id,
        user_id: userId,
        plan_id: request.plan_id,
        status,
        billing_cycle: request.billing_cycle,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_start: trialStart?.toISOString(),
        trial_end: trialEnd?.toISOString(),
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        coupon_id: couponId,
      })
      .select(`
        *,
        plan:community_subscription_plans(*)
      `)
      .single();

    if (error) {
      console.error('Error creating member subscription:', error);
      throw error;
    }

    // Create initial payment record if not on trial
    if (status === 'active') {
      const amount = request.billing_cycle === 'monthly' 
        ? plan.price_monthly 
        : plan.price_yearly;

      if (amount) {
        await this.createPaymentRecord({
          subscription_id: data.id,
          amount,
          currency: 'USD',
          status: 'pending',
          due_date: periodEnd.toISOString(),
          external_payment_id: stripeSubscriptionId,
        });
      }
    }

    return data;
  }

  /**
   * Cancel a member subscription
   */
  static async cancelSubscription(subscriptionId: string): Promise<void> {
    const { data: subscription, error: fetchError } = await supabase
      .from('community_member_subscriptions')
      .select('stripe_subscription_id')
      .eq('id', subscriptionId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Cancel in Stripe if it exists
    if (subscription.stripe_subscription_id) {
      try {
        await StripeService.cancelSubscription(subscription.stripe_subscription_id);
      } catch (error) {
        console.warn('Stripe cancellation failed:', error);
      }
    }

    // Update subscription status
    const { error } = await supabase
      .from('community_member_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (error) {
      throw error;
    }
  }

  /**
   * Get subscription status for a user in a community
   */
  static async getSubscriptionStatus(communityId: string, userId: string): Promise<SubscriptionStatus | null> {
    const { data, error } = await supabase.rpc('get_subscription_status', {
      p_community_id: communityId,
      p_user_id: userId,
    });

    if (error) {
      console.error('Error fetching subscription status:', error);
      return null;
    }

    return data?.[0] || null;
  }

  /**
   * Check if user has active subscription
   */
  static async hasActiveSubscription(communityId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('has_active_subscription', {
      p_community_id: communityId,
      p_user_id: userId,
    });

    if (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }

    return data === true;
  }

  /**
   * Get subscription metrics for a community
   */
  static async getSubscriptionMetrics(communityId: string): Promise<SubscriptionMetrics> {
    const { data: subscriptions, error } = await supabase
      .from('community_member_subscriptions')
      .select(`
        *,
        plan:community_subscription_plans(*)
      `)
      .eq('community_id', communityId);

    if (error) {
      throw error;
    }

    const totalSubscribers = subscriptions?.length || 0;
    const activeSubscribers = subscriptions?.filter(s => s.status === 'active').length || 0;
    const trialSubscribers = subscriptions?.filter(s => s.status === 'trial').length || 0;

    // Calculate revenue
    let monthlyRevenue = 0;
    let yearlyRevenue = 0;

    subscriptions?.forEach(sub => {
      if (sub.status === 'active' && sub.plan) {
        if (sub.billing_cycle === 'monthly' && sub.plan.price_monthly) {
          monthlyRevenue += sub.plan.price_monthly;
        } else if (sub.billing_cycle === 'yearly' && sub.plan.price_yearly) {
          yearlyRevenue += sub.plan.price_yearly;
        }
      }
    });

    return {
      total_subscribers: totalSubscribers,
      active_subscribers: activeSubscribers,
      trial_subscribers: trialSubscribers,
      monthly_revenue: monthlyRevenue,
      yearly_revenue: yearlyRevenue,
      churn_rate: 0, // TODO: Calculate based on cancellations
      conversion_rate: totalSubscribers > 0 ? (activeSubscribers / totalSubscribers) * 100 : 0,
    };
  }

  /**
   * Create a payment record
   */
  static async createPaymentRecord(payment: Partial<SubscriptionPayment>): Promise<SubscriptionPayment> {
    const { data, error } = await supabase
      .from('subscription_payments')
      .insert(payment)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(
    paymentId: string, 
    status: SubscriptionPayment['status'],
    paidAt?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('subscription_payments')
      .update({
        status,
        paid_at: paidAt || new Date().toISOString(),
      })
      .eq('id', paymentId);

    if (error) {
      throw error;
    }
  }

  /**
   * Get payment history for a subscription
   */
  static async getPaymentHistory(subscriptionId: string): Promise<SubscriptionPayment[]> {
    const { data, error } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Get all subscriptions for a community (admin view)
   */
  static async getCommunitySubscriptions(communityId: string): Promise<MemberSubscription[]> {
    const { data, error } = await supabase
      .from('community_member_subscriptions')
      .select(`
        *,
        plan:community_subscription_plans(*)
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }
}

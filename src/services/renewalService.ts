import { supabase } from '@/integrations/supabase/client';
import { StripeService } from './stripeService';

export interface RenewalResult {
  success: boolean;
  subscriptionId: string;
  error?: string;
}

export interface RenewalStats {
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{ subscriptionId: string; error: string }>;
}

export class RenewalService {
  /**
   * Process all due renewals
   * This should be called by a cron job or scheduled task
   */
  static async processRenewals(): Promise<RenewalStats> {
    console.log('Starting renewal processing...');
    
    const stats: RenewalStats = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    try {
      // Get subscriptions that are due for renewal
      const dueSubscriptions = await this.getDueRenewals();
      stats.processed = dueSubscriptions.length;

      console.log(`Found ${dueSubscriptions.length} subscriptions due for renewal`);

      // Process each subscription
      for (const subscription of dueSubscriptions) {
        try {
          const result = await this.processSubscriptionRenewal(subscription);
          
          if (result.success) {
            stats.successful++;
            console.log(`Successfully renewed subscription ${subscription.id}`);
          } else {
            stats.failed++;
            stats.errors.push({
              subscriptionId: subscription.id,
              error: result.error || 'Unknown error'
            });
            console.error(`Failed to renew subscription ${subscription.id}:`, result.error);
          }
        } catch (error) {
          stats.failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          stats.errors.push({
            subscriptionId: subscription.id,
            error: errorMessage
          });
          console.error(`Error processing renewal for subscription ${subscription.id}:`, error);
        }
      }

      // Clean up expired subscriptions
      await this.cleanupExpiredSubscriptions();

      // Generate payment reminders
      await this.generateRenewalReminders();

      console.log('Renewal processing completed:', stats);
      return stats;
    } catch (error) {
      console.error('Renewal processing failed:', error);
      throw error;
    }
  }

  /**
   * Get subscriptions that are due for renewal
   */
  private static async getDueRenewals() {
    const { data, error } = await supabase
      .from('community_member_subscriptions')
      .select(`
        *,
        plan:community_subscription_plans(*)
      `)
      .eq('status', 'active')
      .lte('current_period_end', new Date().toISOString())
      .not('stripe_subscription_id', 'is', null); // Only process Stripe subscriptions

    if (error) throw error;
    return data || [];
  }

  /**
   * Process renewal for a single subscription
   */
  private static async processSubscriptionRenewal(subscription: any): Promise<RenewalResult> {
    try {
      // For Stripe subscriptions, renewal is handled automatically by Stripe
      // We just need to ensure our database is in sync
      if (subscription.stripe_subscription_id) {
        return await this.syncStripeSubscription(subscription);
      }

      // For manual subscriptions (mock payments), process renewal manually
      return await this.processManualRenewal(subscription);
    } catch (error) {
      return {
        success: false,
        subscriptionId: subscription.id,
        error: error instanceof Error ? error.message : 'Renewal processing failed'
      };
    }
  }

  /**
   * Sync Stripe subscription status
   */
  private static async syncStripeSubscription(subscription: any): Promise<RenewalResult> {
    try {
      // In a real implementation, you would fetch the latest subscription status from Stripe
      // For now, we'll simulate this by extending the current period
      
      const now = new Date();
      const currentPeriodEnd = new Date(subscription.current_period_end);
      
      // If subscription is past due, extend the period
      if (currentPeriodEnd <= now) {
        const billingCycle = subscription.billing_cycle;
        const nextPeriodEnd = new Date(currentPeriodEnd);
        
        if (billingCycle === 'yearly') {
          nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
        } else {
          nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
        }

        const { error } = await supabase
          .from('community_member_subscriptions')
          .update({
            current_period_start: currentPeriodEnd.toISOString(),
            current_period_end: nextPeriodEnd.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', subscription.id);

        if (error) throw error;

        // Create payment record for successful renewal
        await this.createRenewalPaymentRecord(subscription, nextPeriodEnd);
      }

      return {
        success: true,
        subscriptionId: subscription.id
      };
    } catch (error) {
      return {
        success: false,
        subscriptionId: subscription.id,
        error: error instanceof Error ? error.message : 'Stripe sync failed'
      };
    }
  }

  /**
   * Process manual renewal (for mock payments)
   */
  private static async processManualRenewal(subscription: any): Promise<RenewalResult> {
    try {
      const plan = subscription.plan;
      const billingCycle = subscription.billing_cycle;
      const amount = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

      if (!amount) {
        throw new Error('No price configured for billing cycle');
      }

      // Simulate payment processing
      const paymentSuccess = Math.random() > 0.1; // 90% success rate for simulation

      if (paymentSuccess) {
        // Extend subscription period
        const currentPeriodEnd = new Date(subscription.current_period_end);
        const nextPeriodEnd = new Date(currentPeriodEnd);
        
        if (billingCycle === 'yearly') {
          nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
        } else {
          nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
        }

        const { error: updateError } = await supabase
          .from('community_member_subscriptions')
          .update({
            current_period_start: currentPeriodEnd.toISOString(),
            current_period_end: nextPeriodEnd.toISOString(),
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) throw updateError;

        // Create payment record
        await this.createRenewalPaymentRecord(subscription, nextPeriodEnd, amount);

        return {
          success: true,
          subscriptionId: subscription.id
        };
      } else {
        // Payment failed - mark as past_due
        const { error } = await supabase
          .from('community_member_subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        if (error) throw error;

        // Create failed payment record
        await this.createFailedPaymentRecord(subscription, amount);

        return {
          success: false,
          subscriptionId: subscription.id,
          error: 'Payment failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        subscriptionId: subscription.id,
        error: error instanceof Error ? error.message : 'Manual renewal failed'
      };
    }
  }

  /**
   * Create payment record for successful renewal
   */
  private static async createRenewalPaymentRecord(
    subscription: any, 
    periodEnd: Date, 
    amount?: number
  ): Promise<void> {
    try {
      const plan = subscription.plan;
      const billingCycle = subscription.billing_cycle;
      const paymentAmount = amount || (billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly);

      if (!paymentAmount) return;

      const { error } = await supabase
        .from('subscription_payments')
        .insert({
          subscription_id: subscription.id,
          amount: paymentAmount,
          currency: 'USD',
          status: 'completed',
          payment_method: subscription.stripe_subscription_id ? 'stripe' : 'mock',
          external_payment_id: subscription.stripe_subscription_id || `renewal_${Date.now()}`,
          paid_at: new Date().toISOString(),
          due_date: periodEnd.toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to create renewal payment record:', error);
    }
  }

  /**
   * Create failed payment record
   */
  private static async createFailedPaymentRecord(subscription: any, amount: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscription_payments')
        .insert({
          subscription_id: subscription.id,
          amount,
          currency: 'USD',
          status: 'failed',
          payment_method: subscription.stripe_subscription_id ? 'stripe' : 'mock',
          due_date: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to create failed payment record:', error);
    }
  }

  /**
   * Clean up expired subscriptions
   */
  private static async cleanupExpiredSubscriptions(): Promise<void> {
    try {
      // Call the database function to expire overdue subscriptions
      const { error } = await supabase.rpc('expire_overdue_subscriptions');
      
      if (error) throw error;
      
      console.log('Expired subscriptions cleaned up');
    } catch (error) {
      console.error('Failed to cleanup expired subscriptions:', error);
    }
  }

  /**
   * Generate renewal reminders
   */
  private static async generateRenewalReminders(): Promise<void> {
    try {
      // Call the database function to create payment reminders
      const { error } = await supabase.rpc('create_payment_reminders');
      
      if (error) throw error;
      
      console.log('Renewal reminders generated');
    } catch (error) {
      console.error('Failed to generate renewal reminders:', error);
    }
  }

  /**
   * Process renewals for a specific community
   */
  static async processRenewalsForCommunity(communityId: string): Promise<RenewalStats> {
    const stats: RenewalStats = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    try {
      const { data: subscriptions, error } = await supabase
        .from('community_member_subscriptions')
        .select(`
          *,
          plan:community_subscription_plans(*)
        `)
        .eq('community_id', communityId)
        .eq('status', 'active')
        .lte('current_period_end', new Date().toISOString());

      if (error) throw error;

      stats.processed = subscriptions?.length || 0;

      if (subscriptions) {
        for (const subscription of subscriptions) {
          const result = await this.processSubscriptionRenewal(subscription);
          
          if (result.success) {
            stats.successful++;
          } else {
            stats.failed++;
            stats.errors.push({
              subscriptionId: subscription.id,
              error: result.error || 'Unknown error'
            });
          }
        }
      }

      return stats;
    } catch (error) {
      console.error('Community renewal processing failed:', error);
      throw error;
    }
  }

  /**
   * Get renewal statistics
   */
  static async getRenewalStats(communityId?: string): Promise<{
    due_today: number;
    due_this_week: number;
    past_due: number;
    trial_ending_soon: number;
  }> {
    try {
      const now = new Date();
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);

      let query = supabase
        .from('community_member_subscriptions')
        .select('status, current_period_end, trial_end');

      if (communityId) {
        query = query.eq('community_id', communityId);
      }

      const { data: subscriptions, error } = await query;

      if (error) throw error;

      const stats = {
        due_today: 0,
        due_this_week: 0,
        past_due: 0,
        trial_ending_soon: 0
      };

      subscriptions?.forEach(sub => {
        const periodEnd = new Date(sub.current_period_end);
        const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;

        // Due today
        if (periodEnd <= todayEnd && periodEnd >= now) {
          stats.due_today++;
        }

        // Due this week
        if (periodEnd <= weekEnd && periodEnd > todayEnd) {
          stats.due_this_week++;
        }

        // Past due
        if (sub.status === 'past_due') {
          stats.past_due++;
        }

        // Trial ending soon
        if (sub.status === 'trial' && trialEnd && trialEnd <= weekEnd && trialEnd > now) {
          stats.trial_ending_soon++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Failed to get renewal stats:', error);
      return {
        due_today: 0,
        due_this_week: 0,
        past_due: 0,
        trial_ending_soon: 0
      };
    }
  }
}

// Export convenience functions
export const processRenewals = RenewalService.processRenewals;
export const processRenewalsForCommunity = RenewalService.processRenewalsForCommunity;
export const getRenewalStats = RenewalService.getRenewalStats;
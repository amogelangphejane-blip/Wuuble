import { supabase } from '@/integrations/supabase/client';

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

export interface SubscriptionWebhookData {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  trial_start?: number;
  trial_end?: number;
  canceled_at?: number;
  metadata: Record<string, string>;
}

export interface PaymentWebhookData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customer: string;
  subscription?: string;
  metadata: Record<string, string>;
}

export class WebhookService {
  /**
   * Process incoming Stripe webhook events
   */
  static async processStripeWebhook(event: WebhookEvent): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Processing Stripe webhook: ${event.type}`);

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdate(event.data.object as SubscriptionWebhookData);

        case 'customer.subscription.deleted':
          return await this.handleSubscriptionCancellation(event.data.object as SubscriptionWebhookData);

        case 'invoice.payment_succeeded':
          return await this.handlePaymentSuccess(event.data.object);

        case 'invoice.payment_failed':
          return await this.handlePaymentFailure(event.data.object);

        case 'customer.subscription.trial_will_end':
          return await this.handleTrialEnding(event.data.object as SubscriptionWebhookData);

        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
          return { success: true }; // Acknowledge but don't process
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed'
      };
    }
  }

  /**
   * Handle subscription creation or updates
   */
  private static async handleSubscriptionUpdate(subscription: SubscriptionWebhookData): Promise<{ success: boolean; error?: string }> {
    try {
      const subscriptionId = subscription.metadata.subscription_id;
      if (!subscriptionId) {
        throw new Error('No subscription_id in metadata');
      }

      // Map Stripe status to our status
      let status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
      switch (subscription.status) {
        case 'trialing':
          status = 'trial';
          break;
        case 'active':
          status = 'active';
          break;
        case 'past_due':
          status = 'past_due';
          break;
        case 'canceled':
        case 'cancelled':
          status = 'cancelled';
          break;
        case 'unpaid':
        case 'incomplete_expired':
          status = 'expired';
          break;
        default:
          status = 'active';
      }

      // Update subscription in database
      const { error } = await supabase
        .from('community_member_subscriptions')
        .update({
          status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      console.log(`Subscription ${subscriptionId} updated with status: ${status}`);
      return { success: true };
    } catch (error) {
      console.error('Subscription update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Subscription update failed'
      };
    }
  }

  /**
   * Handle subscription cancellation
   */
  private static async handleSubscriptionCancellation(subscription: SubscriptionWebhookData): Promise<{ success: boolean; error?: string }> {
    try {
      const subscriptionId = subscription.metadata.subscription_id;
      if (!subscriptionId) {
        throw new Error('No subscription_id in metadata');
      }

      const { error } = await supabase
        .from('community_member_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      console.log(`Subscription ${subscriptionId} cancelled`);
      return { success: true };
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Subscription cancellation failed'
      };
    }
  }

  /**
   * Handle successful payment
   */
  private static async handlePaymentSuccess(invoice: any): Promise<{ success: boolean; error?: string }> {
    try {
      const subscriptionId = invoice.subscription_metadata?.subscription_id;
      if (!subscriptionId) {
        console.log('No subscription_id in invoice metadata, skipping payment record');
        return { success: true };
      }

      // Create payment record
      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          subscription_id: subscriptionId,
          amount: invoice.amount_paid / 100, // Convert from cents
          currency: invoice.currency.toUpperCase(),
          status: 'completed',
          payment_method: 'stripe',
          external_payment_id: invoice.payment_intent,
          paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
          due_date: new Date(invoice.due_date * 1000).toISOString()
        });

      if (paymentError) throw paymentError;

      // Update subscription status to active if it was past_due
      const { error: subscriptionError } = await supabase
        .from('community_member_subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .eq('status', 'past_due');

      if (subscriptionError) throw subscriptionError;

      console.log(`Payment recorded for subscription ${subscriptionId}`);
      return { success: true };
    } catch (error) {
      console.error('Payment success handling error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment success handling failed'
      };
    }
  }

  /**
   * Handle failed payment
   */
  private static async handlePaymentFailure(invoice: any): Promise<{ success: boolean; error?: string }> {
    try {
      const subscriptionId = invoice.subscription_metadata?.subscription_id;
      if (!subscriptionId) {
        console.log('No subscription_id in invoice metadata, skipping payment record');
        return { success: true };
      }

      // Create failed payment record
      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          subscription_id: subscriptionId,
          amount: invoice.amount_due / 100, // Convert from cents
          currency: invoice.currency.toUpperCase(),
          status: 'failed',
          payment_method: 'stripe',
          external_payment_id: invoice.payment_intent,
          due_date: new Date(invoice.due_date * 1000).toISOString()
        });

      if (paymentError) throw paymentError;

      // Update subscription status to past_due
      const { error: subscriptionError } = await supabase
        .from('community_member_subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (subscriptionError) throw subscriptionError;

      // Create payment reminder
      await this.createPaymentReminder(subscriptionId, 'overdue', new Date(invoice.due_date * 1000));

      console.log(`Payment failure recorded for subscription ${subscriptionId}`);
      return { success: true };
    } catch (error) {
      console.error('Payment failure handling error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failure handling failed'
      };
    }
  }

  /**
   * Handle trial ending notification
   */
  private static async handleTrialEnding(subscription: SubscriptionWebhookData): Promise<{ success: boolean; error?: string }> {
    try {
      const subscriptionId = subscription.metadata.subscription_id;
      if (!subscriptionId) {
        throw new Error('No subscription_id in metadata');
      }

      // Create trial ending reminder
      if (subscription.trial_end) {
        await this.createPaymentReminder(
          subscriptionId, 
          'trial_ending', 
          new Date(subscription.trial_end * 1000)
        );
      }

      console.log(`Trial ending reminder created for subscription ${subscriptionId}`);
      return { success: true };
    } catch (error) {
      console.error('Trial ending handling error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Trial ending handling failed'
      };
    }
  }

  /**
   * Create a payment reminder
   */
  private static async createPaymentReminder(
    subscriptionId: string, 
    reminderType: 'upcoming' | 'overdue' | 'trial_ending',
    dueDate: Date
  ): Promise<void> {
    try {
      // Check if reminder already exists
      const { data: existingReminder } = await supabase
        .from('payment_reminders')
        .select('id')
        .eq('subscription_id', subscriptionId)
        .eq('reminder_type', reminderType)
        .eq('due_date', dueDate.toISOString())
        .single();

      if (existingReminder) {
        return; // Reminder already exists
      }

      // Create new reminder
      const { error } = await supabase
        .from('payment_reminders')
        .insert({
          subscription_id: subscriptionId,
          reminder_type: reminderType,
          due_date: dueDate.toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Create payment reminder error:', error);
      // Don't throw here as this is a secondary operation
    }
  }

  /**
   * Verify webhook signature (for production use)
   */
  static verifyWebhookSignature(
    payload: string, 
    signature: string, 
    secret: string
  ): boolean {
    try {
      // In a real implementation, you would use Stripe's signature verification
      // This is a simplified version for demonstration
      const expectedSignature = `sha256=${Buffer.from(payload + secret).toString('base64')}`;
      return signature === expectedSignature;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }
}

// Export convenience functions
export const processStripeWebhook = WebhookService.processStripeWebhook;
export const verifyWebhookSignature = WebhookService.verifyWebhookSignature;
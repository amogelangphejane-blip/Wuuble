import { supabase } from '@/integrations/supabase/client';
import { SubscriptionPayment } from '@/types/subscription';
import { StripeService } from './stripeService';
import { isStripeEnabled } from '@/lib/stripe';

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
}

export class PaymentService {
  /**
   * Process a payment for a subscription
   * This is a mock implementation that should be replaced with actual payment processor integration
   */
  static async processPayment(
    subscriptionId: string, 
    amount: number, 
    currency: string = 'USD',
    paymentMethodId?: string,
    customerId?: string
  ): Promise<PaymentResult> {
    try {
      let paymentId: string;
      let paymentMethod: string;
      
      if (isStripeEnabled() && paymentMethodId && customerId) {
        // Process real Stripe payment
        const stripeResult = await StripeService.createPaymentIntent({
          subscriptionId,
          amount: amount * 100, // Convert to cents
          currency,
          customerId,
          metadata: {
            subscription_id: subscriptionId
          }
        });
        
        if (!stripeResult.success) {
          throw new Error(stripeResult.error);
        }
        
        paymentId = stripeResult.paymentId!;
        paymentMethod = 'stripe';
      } else {
        // Mock payment for development
        paymentId = `mock_payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        paymentMethod = 'mock';
        
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate 90% success rate for mock payments
        if (Math.random() < 0.1) {
          throw new Error('Mock payment failed - insufficient funds');
        }
      }
      
      // Create payment record in database
      const { data, error } = await supabase
        .from('subscription_payments')
        .insert({
          subscription_id: subscriptionId,
          amount,
          currency,
          status: 'completed',
          payment_method: paymentMethod,
          external_payment_id: paymentId,
          paid_at: new Date().toISOString(),
          due_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update subscription status to active if it was past_due
      await supabase
        .from('community_member_subscriptions')
        .update({ 
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        .eq('id', subscriptionId);

      return {
        success: true,
        paymentId
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  /**
   * Get payment history for a subscription
   */
  static async getPaymentHistory(subscriptionId: string): Promise<SubscriptionPayment[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }

  /**
   * Create a payment intent (for future Stripe integration)
   */
  static async createPaymentIntent(
    subscriptionId: string,
    amount: number,
    currency: string = 'USD',
    customerId?: string
  ): Promise<{ clientSecret?: string; error?: string }> {
    if (isStripeEnabled() && customerId) {
      // Use real Stripe service
      const result = await StripeService.createPaymentIntent({
        subscriptionId,
        amount: amount * 100, // Convert to cents
        currency,
        customerId,
        metadata: {
          subscription_id: subscriptionId
        }
      });
      
      return {
        clientSecret: result.clientSecret,
        error: result.error
      };
    } else {
      // Return mock client secret for development
      return {
        clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`
      };
    }
  }

  /**
   * Validate payment method (for future implementation)
   */
  static async validatePaymentMethod(paymentMethodId: string): Promise<boolean> {
    // This would validate the payment method with the payment processor
    // For now, just return true for mock implementation
    return true;
  }

  /**
   * Cancel a subscription (handles payment-related cancellation logic)
   */
  static async cancelSubscription(subscriptionId: string): Promise<PaymentResult> {
    try {
      // Get subscription details
      const { data: subscription, error: fetchError } = await supabase
        .from('community_member_subscriptions')
        .select('stripe_subscription_id')
        .eq('id', subscriptionId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Cancel Stripe subscription if it exists
      if (subscription.stripe_subscription_id && isStripeEnabled()) {
        const stripeResult = await StripeService.cancelSubscription(subscription.stripe_subscription_id);
        if (!stripeResult.success) {
          console.error('Failed to cancel Stripe subscription:', stripeResult.error);
          // Continue with local cancellation even if Stripe fails
        }
      }
      
      // Update local subscription status
      const { error } = await supabase
        .from('community_member_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cancellation failed'
      };
    }
  }
}

// Export convenience functions
export const processPayment = PaymentService.processPayment;
export const getPaymentHistory = PaymentService.getPaymentHistory;
export const createPaymentIntent = PaymentService.createPaymentIntent;
export const validatePaymentMethod = PaymentService.validatePaymentMethod;
export const cancelSubscription = PaymentService.cancelSubscription;
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionPayment } from '@/types/subscription';
import { StripeService } from './stripeService';
import { PlatformStripeService } from './platformStripeService';
import { WalletService } from './walletService';
import { PayPalService } from './paypalService';
import { BankTransferService } from './bankTransferService';
import { isStripeEnabled } from '@/lib/stripe';

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  grossAmount?: number;
  platformFee?: number;
  creatorAmount?: number;
  error?: string;
}

export class PaymentService {
  /**
   * Process a payment for a subscription with platform fee handling
   * This now integrates with the wallet system and deducts platform fees
   * Supports multiple payment methods: Stripe, PayPal, Bank Transfer
   */
  static async processPayment(
    subscriptionId: string, 
    amount: number, 
    currency: string = 'USD',
    paymentMethodId?: string,
    customerId?: string,
    paymentMethodType?: 'card' | 'paypal' | 'bank_transfer'
  ): Promise<PaymentResult> {
    try {
      let externalPaymentId: string;
      let paymentMethod: string;
      
      // Determine payment method type
      const methodType = paymentMethodType || 'card';
      
      switch (methodType) {
        case 'card':
          if (isStripeEnabled() && paymentMethodId && customerId) {
            // Process payment through platform account (routes through platform first)
            const platformResult = await PlatformStripeService.createPlatformPaymentIntent({
              subscriptionId,
              amount,
              currency,
              customerId,
              metadata: {
                subscription_id: subscriptionId
              }
            });
            
            if (!platformResult.success) {
              throw new Error(platformResult.error);
            }
            
            externalPaymentId = platformResult.paymentId!;
            paymentMethod = 'platform_stripe';
          } else {
            // Mock payment for development
            externalPaymentId = `mock_payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            paymentMethod = 'mock';
            
            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simulate 90% success rate for mock payments
            if (Math.random() < 0.1) {
              throw new Error('Mock payment failed - insufficient funds');
            }
          }
          break;

        case 'paypal': {
          // Process PayPal payment
          const paypalResult = await PayPalService.createPayment({
            amount,
            currency,
            description: `Subscription payment for ${subscriptionId}`,
            returnUrl: `${window.location.origin}/payment/success`,
            cancelUrl: `${window.location.origin}/payment/cancel`,
            metadata: {
              subscription_id: subscriptionId
            }
          });
          
          if (!paypalResult.success) {
            throw new Error(paypalResult.error);
          }
          
          externalPaymentId = paypalResult.paymentId!;
          paymentMethod = 'paypal';
          
          // For PayPal, we need to redirect user to approval URL
          // This would be handled in the UI component
          break;
        }

        case 'bank_transfer':
          // For bank transfers, create a pending payment that requires manual confirmation
          externalPaymentId = `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          paymentMethod = 'bank_transfer';
          
          // Bank transfers are processed manually, so we create a pending payment
          // The actual confirmation happens through admin interface
          break;

        default:
          throw new Error(`Unsupported payment method: ${methodType}`);
      }
      
      // Process payment through wallet system with platform fee deduction
      const result = await WalletService.processSubscriptionPayment(
        subscriptionId,
        amount,
        currency,
        paymentMethod,
        externalPaymentId
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        success: true,
        paymentId: result.payment_id,
        transactionId: result.transaction_id,
        grossAmount: result.gross_amount,
        platformFee: result.platform_fee,
        creatorAmount: result.creator_amount
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
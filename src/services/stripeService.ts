import { supabase } from '@/integrations/supabase/client';
import { getStripe, isStripeEnabled } from '@/lib/stripe';

export interface StripePaymentResult {
  success: boolean;
  paymentId?: string;
  clientSecret?: string;
  error?: string;
}

export interface CreatePaymentIntentRequest {
  subscriptionId: string;
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerRequest {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export class StripeService {
  private static async callStripeAPI(endpoint: string, data: any) {
    try {
      const response = await fetch(`/api/stripe/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Stripe API call failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Stripe API error:', error);
      throw error;
    }
  }

  /**
   * Create a Stripe customer
   */
  static async createCustomer(request: CreateCustomerRequest): Promise<{ customerId: string }> {
    if (!isStripeEnabled()) {
      throw new Error('Stripe is not enabled');
    }

    return await this.callStripeAPI('create-customer', request);
  }

  /**
   * Create a payment intent for one-time payments
   */
  static async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<StripePaymentResult> {
    if (!isStripeEnabled()) {
      // Return mock payment intent for development
      return {
        success: true,
        clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`
      };
    }

    try {
      const result = await this.callStripeAPI('create-payment-intent', request);
      return {
        success: true,
        clientSecret: result.clientSecret,
        paymentId: result.paymentIntentId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment intent creation failed'
      };
    }
  }

  /**
   * Create a subscription with Stripe
   */
  static async createSubscription(customerId: string, priceId: string, metadata?: Record<string, string>): Promise<StripePaymentResult> {
    if (!isStripeEnabled()) {
      // Return mock subscription for development
      return {
        success: true,
        paymentId: `sub_mock_${Date.now()}`
      };
    }

    try {
      const result = await this.callStripeAPI('create-subscription', {
        customerId,
        priceId,
        metadata
      });

      return {
        success: true,
        paymentId: result.subscriptionId,
        clientSecret: result.clientSecret
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Subscription creation failed'
      };
    }
  }

  /**
   * Cancel a Stripe subscription
   */
  static async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    if (!isStripeEnabled()) {
      return { success: true };
    }

    try {
      await this.callStripeAPI('cancel-subscription', { subscriptionId });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Subscription cancellation failed'
      };
    }
  }

  /**
   * Create a Stripe Price for a subscription plan
   */
  static async createPrice(productId: string, amount: number, currency: string, interval: 'month' | 'year'): Promise<{ priceId: string }> {
    if (!isStripeEnabled()) {
      return { priceId: `price_mock_${Date.now()}` };
    }

    return await this.callStripeAPI('create-price', {
      productId,
      amount,
      currency,
      interval
    });
  }

  /**
   * Create a Stripe Product for a subscription plan
   */
  static async createProduct(name: string, description?: string): Promise<{ productId: string }> {
    if (!isStripeEnabled()) {
      return { productId: `prod_mock_${Date.now()}` };
    }

    return await this.callStripeAPI('create-product', {
      name,
      description
    });
  }

  /**
   * Apply a coupon to a subscription
   */
  static async applyCoupon(subscriptionId: string, couponId: string): Promise<{ success: boolean; error?: string }> {
    if (!isStripeEnabled()) {
      return { success: true };
    }

    try {
      await this.callStripeAPI('apply-coupon', { subscriptionId, couponId });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Coupon application failed'
      };
    }
  }

  /**
   * Validate a coupon code
   */
  static async validateCoupon(couponId: string): Promise<{ 
    valid: boolean; 
    coupon?: {
      id: string;
      name?: string;
      percentOff?: number;
      amountOff?: number;
      currency?: string;
      duration: string;
      durationInMonths?: number;
    };
    error?: string;
  }> {
    if (!isStripeEnabled()) {
      // Mock coupon validation for development
      const mockCoupons = ['SAVE10', 'WELCOME20', 'YEARLY50'];
      if (mockCoupons.includes(couponId.toUpperCase())) {
        return {
          valid: true,
          coupon: {
            id: couponId.toUpperCase(),
            name: `${couponId.toUpperCase()} Discount`,
            percentOff: couponId.toUpperCase() === 'SAVE10' ? 10 : couponId.toUpperCase() === 'WELCOME20' ? 20 : 50,
            duration: 'once'
          }
        };
      }
      return { valid: false, error: 'Invalid coupon code' };
    }

    try {
      const result = await this.callStripeAPI('validate-coupon', { couponId });
      return {
        valid: true,
        coupon: result.coupon
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Coupon validation failed'
      };
    }
  }
}

// Export convenience functions
export const createPaymentIntent = StripeService.createPaymentIntent;
export const createSubscription = StripeService.createSubscription;
export const cancelSubscription = StripeService.cancelSubscription;
export const createCustomer = StripeService.createCustomer;
export const validateCoupon = StripeService.validateCoupon;
export const applyCoupon = StripeService.applyCoupon;
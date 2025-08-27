import { supabase } from '@/integrations/supabase/client';
import { PlatformAccountService } from './platformAccountService';
import { isStripeEnabled } from '@/lib/stripe';

export interface PlatformPaymentResult {
  success: boolean;
  paymentId?: string;
  clientSecret?: string;
  platformFee?: number;
  creatorAmount?: number;
  error?: string;
}

export interface CreatePlatformPaymentIntentRequest {
  subscriptionId: string;
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface TransferToCreatorRequest {
  amount: number;
  currency: string;
  creatorStripeAccountId: string;
  description?: string;
  metadata?: Record<string, string>;
}

export class PlatformStripeService {
  /**
   * Create a payment intent that routes payments through the platform account
   * This ensures the platform receives the payment first, then splits with creators
   */
  static async createPlatformPaymentIntent(
    request: CreatePlatformPaymentIntentRequest
  ): Promise<PlatformPaymentResult> {
    if (!isStripeEnabled()) {
      // Return mock payment intent for development
      return {
        success: true,
        clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
        platformFee: Math.round(request.amount * 0.20 * 100) / 100, // 20% platform fee
        creatorAmount: Math.round(request.amount * 0.80 * 100) / 100 // 80% to creator
      };
    }

    try {
      // Get platform's primary Stripe Connect account
      const platformAccount = await PlatformAccountService.getPrimaryAccount();
      if (!platformAccount.success || !platformAccount.data?.stripe_account_id) {
        throw new Error('No Stripe Connect account configured for platform');
      }

      // Calculate platform fee (20% default)
      const platformFeePercentage = 20; // This could come from platform_fee_config table
      const platformFee = Math.round(request.amount * (platformFeePercentage / 100) * 100) / 100;
      const creatorAmount = request.amount - platformFee;

      // Create payment intent with platform as the recipient
      const response = await fetch('/api/stripe/platform/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          ...request,
          platform_account_id: platformAccount.data.stripe_account_id,
          platform_fee: platformFee,
          creator_amount: creatorAmount
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment intent creation failed');
      }

      const result = await response.json();
      
      return {
        success: true,
        clientSecret: result.clientSecret,
        paymentId: result.paymentIntentId,
        platformFee,
        creatorAmount
      };
    } catch (error) {
      console.error('Platform payment intent creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment intent creation failed'
      };
    }
  }

  /**
   * Transfer funds to a creator's Stripe Connect account
   * This is used for automated payouts from the platform account
   */
  static async transferToCreator(
    request: TransferToCreatorRequest
  ): Promise<{ success: boolean; transferId?: string; error?: string }> {
    if (!isStripeEnabled()) {
      // Mock transfer for development
      return {
        success: true,
        transferId: `tr_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    }

    try {
      const response = await fetch('/api/stripe/platform/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Transfer failed');
      }

      const result = await response.json();
      
      return {
        success: true,
        transferId: result.transfer_id
      };
    } catch (error) {
      console.error('Creator transfer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed'
      };
    }
  }

  /**
   * Get platform Stripe account balance
   */
  static async getPlatformBalance(): Promise<{
    success: boolean;
    available?: number;
    pending?: number;
    currency?: string;
    error?: string;
  }> {
    if (!isStripeEnabled()) {
      // Mock balance for development
      return {
        success: true,
        available: 1500.00,
        pending: 250.00,
        currency: 'USD'
      };
    }

    try {
      const response = await fetch('/api/stripe/platform/balance', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch balance');
      }

      const result = await response.json();
      
      return {
        success: true,
        available: result.available / 100, // Convert from cents
        pending: result.pending / 100,
        currency: result.currency?.toUpperCase()
      };
    } catch (error) {
      console.error('Platform balance fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance'
      };
    }
  }

  /**
   * Create a Stripe Connect Express account for a creator
   * This allows creators to receive direct payouts
   */
  static async createCreatorExpressAccount(
    creatorId: string,
    email: string,
    returnUrl?: string,
    refreshUrl?: string
  ): Promise<{
    success: boolean;
    accountId?: string;
    onboardingUrl?: string;
    error?: string;
  }> {
    if (!isStripeEnabled()) {
      // Mock account creation for development
      return {
        success: true,
        accountId: `acct_mock_${Date.now()}`,
        onboardingUrl: `https://connect.stripe.com/express/onboarding/mock_${creatorId}`
      };
    }

    try {
      const response = await fetch('/api/stripe/connect/create-creator-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          creator_id: creatorId,
          email,
          return_url: returnUrl || `${window.location.origin}/wallet?setup=success`,
          refresh_url: refreshUrl || `${window.location.origin}/wallet?setup=refresh`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Account creation failed');
      }

      const result = await response.json();
      
      // Update creator wallet with Stripe account ID
      if (result.success && result.account_id) {
        await supabase
          .from('creator_wallets')
          .update({ stripe_account_id: result.account_id })
          .eq('creator_id', creatorId);
      }
      
      return result;
    } catch (error) {
      console.error('Creator account creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Account creation failed'
      };
    }
  }

  /**
   * Process batch payouts to multiple creators
   * This is used for automated payout processing
   */
  static async processBatchPayouts(
    payouts: Array<{
      creator_id: string;
      amount: number;
      stripe_account_id: string;
      description?: string;
    }>
  ): Promise<{
    success: boolean;
    successful_payouts: number;
    failed_payouts: number;
    batch_id: string;
    errors?: Array<{ creator_id: string; error: string }>;
  }> {
    if (!isStripeEnabled()) {
      // Mock batch payout for development
      return {
        success: true,
        successful_payouts: payouts.length,
        failed_payouts: 0,
        batch_id: `batch_mock_${Date.now()}`
      };
    }

    try {
      const response = await fetch('/api/stripe/platform/batch-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ payouts })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Batch payout failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Batch payout error:', error);
      return {
        success: false,
        successful_payouts: 0,
        failed_payouts: payouts.length,
        batch_id: '',
        errors: payouts.map(p => ({
          creator_id: p.creator_id,
          error: error instanceof Error ? error.message : 'Payout failed'
        }))
      };
    }
  }
}

// Backend Implementation Template for Platform Stripe Service
export const platformStripeBackendTemplate = `
// Backend Implementation Template (Express.js)
import Stripe from 'stripe';
import { supabase } from './supabase-client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// POST /api/stripe/platform/create-payment-intent
export async function createPlatformPaymentIntent(req, res) {
  try {
    const { 
      subscriptionId, 
      amount, 
      currency, 
      customerId, 
      platform_account_id,
      platform_fee,
      creator_amount,
      metadata 
    } = req.body;

    // Create payment intent with platform as recipient
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency || 'usd',
      customer: customerId,
      on_behalf_of: platform_account_id, // Platform receives the payment
      metadata: {
        subscription_id: subscriptionId,
        platform_fee: platform_fee.toString(),
        creator_amount: creator_amount.toString(),
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating platform payment intent:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

// POST /api/stripe/platform/transfer
export async function transferToCreator(req, res) {
  try {
    const { amount, currency, creatorStripeAccountId, description, metadata } = req.body;

    // Create transfer to creator's Stripe account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency || 'usd',
      destination: creatorStripeAccountId,
      description: description || 'Creator payout',
      metadata
    });

    // Record the transfer in platform_transactions
    await supabase
      .from('platform_transactions')
      .insert({
        transaction_type: 'creator_payout',
        amount: -amount, // Negative for outgoing
        currency: currency?.toUpperCase() || 'USD',
        external_transaction_id: transfer.id,
        status: 'completed',
        description: description || 'Creator payout'
      });

    res.json({
      success: true,
      transfer_id: transfer.id
    });
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

// GET /api/stripe/platform/balance
export async function getPlatformBalance(req, res) {
  try {
    // Get platform's Stripe account ID
    const { data: platformAccount } = await supabase
      .from('platform_account_config')
      .select('stripe_account_id')
      .eq('is_primary', true)
      .eq('is_active', true)
      .single();

    if (!platformAccount?.stripe_account_id) {
      return res.status(400).json({
        error: 'No Stripe account configured'
      });
    }

    const balance = await stripe.balance.retrieve({
      stripeAccount: platformAccount.stripe_account_id
    });

    const available = balance.available.reduce((sum, bal) => sum + bal.amount, 0);
    const pending = balance.pending.reduce((sum, bal) => sum + bal.amount, 0);

    res.json({
      available,
      pending,
      currency: balance.available[0]?.currency || 'usd'
    });
  } catch (error) {
    console.error('Error fetching platform balance:', error);
    res.status(400).json({
      error: error.message
    });
  }
}

// POST /api/stripe/connect/create-creator-account
export async function createCreatorExpressAccount(req, res) {
  try {
    const { creator_id, email, return_url, refresh_url } = req.body;

    // Create Express account for creator
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // This could be dynamic based on creator's location
      email,
      capabilities: {
        transfers: { requested: true },
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refresh_url || \`\${process.env.FRONTEND_URL}/wallet?setup=refresh\`,
      return_url: return_url || \`\${process.env.FRONTEND_URL}/wallet?setup=success\`,
      type: 'account_onboarding',
    });

    res.json({
      success: true,
      account_id: account.id,
      onboarding_url: accountLink.url
    });
  } catch (error) {
    console.error('Error creating creator Express account:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}
`;

// Export convenience functions
export const createPlatformPaymentIntent = PlatformStripeService.createPlatformPaymentIntent;
export const transferToCreator = PlatformStripeService.transferToCreator;
export const getPlatformBalance = PlatformStripeService.getPlatformBalance;
export const createCreatorExpressAccount = PlatformStripeService.createCreatorExpressAccount;
export const processBatchPayouts = PlatformStripeService.processBatchPayouts;
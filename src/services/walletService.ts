import { supabase } from '@/integrations/supabase/client';
import {
  CreatorWallet,
  WalletTransaction,
  PayoutRequest,
  PlatformFeeConfig,
  WalletStats,
  PaymentProcessingResult,
  CreatePayoutRequest,
  PayoutRequestResult,
  WalletSummary,
  TransactionFilter,
  EarningsBreakdown
} from '@/types/wallet';

export class WalletService {
  /**
   * Get or create a creator's wallet
   */
  static async getOrCreateWallet(creatorId: string): Promise<CreatorWallet | null> {
    try {
      // First try to get existing wallet
      const { data: existingWallet, error: fetchError } = await supabase
        .from('creator_wallets')
        .select('*')
        .eq('creator_id', creatorId)
        .single();

      if (existingWallet && !fetchError) {
        return existingWallet;
      }

      // Create new wallet if it doesn't exist
      const { data: newWallet, error: createError } = await supabase
        .rpc('create_creator_wallet', { creator_user_id: creatorId });

      if (createError) throw createError;

      // Fetch the created wallet
      const { data: wallet, error: refetchError } = await supabase
        .from('creator_wallets')
        .select('*')
        .eq('creator_id', creatorId)
        .single();

      if (refetchError) throw refetchError;
      return wallet;
    } catch (error) {
      console.error('Error getting/creating wallet:', error);
      return null;
    }
  }

  /**
   * Get wallet by ID
   */
  static async getWalletById(walletId: string): Promise<CreatorWallet | null> {
    try {
      const { data, error } = await supabase
        .from('creator_wallets')
        .select('*')
        .eq('id', walletId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      return null;
    }
  }

  /**
   * Process subscription payment with platform fee deduction
   */
  static async processSubscriptionPayment(
    subscriptionId: string,
    grossAmount: number,
    currency: string = 'USD',
    paymentMethod: string = 'stripe',
    externalPaymentId?: string
  ): Promise<PaymentProcessingResult> {
    try {
      const { data, error } = await supabase
        .rpc('process_subscription_payment_with_fee', {
          p_subscription_id: subscriptionId,
          p_gross_amount: grossAmount,
          p_currency: currency,
          p_payment_method: paymentMethod,
          p_external_payment_id: externalPaymentId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error processing subscription payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  /**
   * Get wallet transactions with filtering
   */
  static async getWalletTransactions(
    walletId: string,
    filter?: TransactionFilter
  ): Promise<WalletTransaction[]> {
    try {
      let query = supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false });

      if (filter?.transaction_type) {
        query = query.eq('transaction_type', filter.transaction_type);
      }

      if (filter?.status) {
        query = query.eq('status', filter.status);
      }

      if (filter?.start_date) {
        query = query.gte('created_at', filter.start_date);
      }

      if (filter?.end_date) {
        query = query.lte('created_at', filter.end_date);
      }

      if (filter?.limit) {
        query = query.limit(filter.limit);
      }

      if (filter?.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      return [];
    }
  }

  /**
   * Get wallet statistics
   */
  static async getWalletStats(walletId: string): Promise<WalletStats | null> {
    try {
      const wallet = await this.getWalletById(walletId);
      if (!wallet) return null;

      // Get this month's earnings
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: thisMonthTransactions } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('wallet_id', walletId)
        .eq('transaction_type', 'subscription_payment')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      // Get last month's earnings
      const startOfLastMonth = new Date(startOfMonth);
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
      const endOfLastMonth = new Date(startOfMonth);
      endOfLastMonth.setTime(endOfLastMonth.getTime() - 1);

      const { data: lastMonthTransactions } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('wallet_id', walletId)
        .eq('transaction_type', 'subscription_payment')
        .eq('status', 'completed')
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString());

      // Get subscription count
      const { data: subscriptions } = await supabase
        .from('community_member_subscriptions')
        .select('status')
        .in('community_id', 
          await supabase
            .from('communities')
            .select('id')
            .eq('creator_id', wallet.creator_id)
            .then(res => res.data?.map(c => c.id) || [])
        );

      const thisMonthEarned = thisMonthTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const lastMonthEarned = lastMonthTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const totalSubscribers = subscriptions?.length || 0;
      const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0;

      return {
        total_balance: wallet.balance,
        pending_balance: wallet.pending_balance,
        total_earned: wallet.total_earned,
        total_withdrawn: wallet.total_withdrawn,
        this_month_earned: thisMonthEarned,
        last_month_earned: lastMonthEarned,
        average_monthly_earnings: wallet.total_earned / Math.max(1, this.getMonthsSinceCreation(wallet.created_at)),
        total_subscribers: totalSubscribers,
        active_subscriptions: activeSubscriptions
      };
    } catch (error) {
      console.error('Error fetching wallet stats:', error);
      return null;
    }
  }

  /**
   * Request a payout
   */
  static async requestPayout(request: CreatePayoutRequest): Promise<PayoutRequestResult> {
    try {
      const { data, error } = await supabase
        .rpc('request_payout', {
          p_wallet_id: request.wallet_id,
          p_amount: request.amount,
          p_payout_method: request.payout_method
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error requesting payout:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payout request failed'
      };
    }
  }

  /**
   * Get payout requests for a wallet
   */
  static async getPayoutRequests(walletId: string): Promise<PayoutRequest[]> {
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payout requests:', error);
      return [];
    }
  }

  /**
   * Get platform fee configuration
   */
  static async getPlatformFeeConfig(): Promise<PlatformFeeConfig | null> {
    try {
      const { data, error } = await supabase
        .from('platform_fee_config')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching platform fee config:', error);
      return null;
    }
  }

  /**
   * Get wallet summary for dashboard
   */
  static async getWalletSummary(walletId: string): Promise<WalletSummary | null> {
    try {
      const wallet = await this.getWalletById(walletId);
      const feeConfig = await this.getPlatformFeeConfig();
      
      if (!wallet) return null;

      // Get current month earnings
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyTransactions } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('wallet_id', walletId)
        .eq('transaction_type', 'subscription_payment')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      const currentMonthEarnings = monthlyTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

      return {
        available_balance: wallet.balance,
        pending_payouts: wallet.pending_balance,
        total_lifetime_earnings: wallet.total_earned,
        current_month_earnings: currentMonthEarnings,
        platform_fee_rate: feeConfig?.fee_percentage || 20,
        minimum_payout_amount: 25.00, // Configurable minimum
        next_payout_date: this.getNextPayoutDate()
      };
    } catch (error) {
      console.error('Error fetching wallet summary:', error);
      return null;
    }
  }

  /**
   * Get earnings breakdown for a period
   */
  static async getEarningsBreakdown(
    walletId: string,
    startDate: string,
    endDate: string
  ): Promise<EarningsBreakdown | null> {
    try {
      // Get all subscription payments in the period
      const { data: payments } = await supabase
        .from('subscription_payments')
        .select('gross_amount, platform_fee, creator_amount')
        .eq('wallet_transaction_id', 
          await supabase
            .from('wallet_transactions')
            .select('id')
            .eq('wallet_id', walletId)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .then(res => res.data?.map(t => t.id) || [])
        );

      if (!payments) return null;

      const grossRevenue = payments.reduce((sum, p) => sum + (p.gross_amount || 0), 0);
      const platformFees = payments.reduce((sum, p) => sum + (p.platform_fee || 0), 0);
      const netEarnings = payments.reduce((sum, p) => sum + (p.creator_amount || 0), 0);

      return {
        gross_revenue: grossRevenue,
        platform_fees: platformFees,
        net_earnings: netEarnings,
        subscription_count: payments.length,
        average_subscription_value: grossRevenue / Math.max(1, payments.length),
        period_start: startDate,
        period_end: endDate
      };
    } catch (error) {
      console.error('Error fetching earnings breakdown:', error);
      return null;
    }
  }

  /**
   * Update wallet payout method
   */
  static async updatePayoutMethod(walletId: string, payoutMethod: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('creator_wallets')
        .update({ 
          payout_method: payoutMethod,
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating payout method:', error);
      return false;
    }
  }

  // Helper methods
  private static getMonthsSinceCreation(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    const months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    return Math.max(1, months);
  }

  private static getNextPayoutDate(): string {
    // Assuming weekly payouts on Fridays
    const today = new Date();
    const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7; // 5 = Friday
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    return nextFriday.toISOString().split('T')[0];
  }
}

// Export convenience functions
export const getOrCreateWallet = WalletService.getOrCreateWallet;
export const processSubscriptionPayment = WalletService.processSubscriptionPayment;
export const getWalletTransactions = WalletService.getWalletTransactions;
export const getWalletStats = WalletService.getWalletStats;
export const requestPayout = WalletService.requestPayout;
export const getPayoutRequests = WalletService.getPayoutRequests;
export const getPlatformFeeConfig = WalletService.getPlatformFeeConfig;
export const getWalletSummary = WalletService.getWalletSummary;
export const getEarningsBreakdown = WalletService.getEarningsBreakdown;
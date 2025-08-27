import { supabase } from '@/integrations/supabase/client';
import {
  PlatformAccountConfig,
  PlatformTransaction,
  PlatformBalance,
  CreatePlatformAccountRequest,
  UpdatePlatformAccountRequest,
  PlatformAccountServiceResult,
  PlatformDashboardStats,
  StripeConnectAccountInfo,
  StripeConnectOnboardingResult,
  StripeConnectSetupRequest,
  BatchPayoutRequest,
  BatchPayoutResult
} from '@/types/platformAccount';

export class PlatformAccountService {
  /**
   * Get all platform accounts (admin only)
   */
  static async getPlatformAccounts(): Promise<PlatformAccountServiceResult<PlatformAccountConfig[]>> {
    try {
      const { data, error } = await supabase
        .from('platform_account_config')
        .select('*')
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error fetching platform accounts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch platform accounts'
      };
    }
  }

  /**
   * Get the primary platform account
   */
  static async getPrimaryAccount(): Promise<PlatformAccountServiceResult<PlatformAccountConfig>> {
    try {
      const { data, error } = await supabase
        .from('platform_account_config')
        .select('*')
        .eq('is_primary', true)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

      return {
        success: true,
        data: data || null
      };
    } catch (error) {
      console.error('Error fetching primary platform account:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch primary platform account'
      };
    }
  }

  /**
   * Create or update platform account
   */
  static async upsertPlatformAccount(request: CreatePlatformAccountRequest): Promise<PlatformAccountServiceResult<string>> {
    try {
      const { data, error } = await supabase.rpc('upsert_platform_account', {
        p_account_type: request.account_type,
        p_account_name: request.account_name,
        p_stripe_account_id: request.stripe_account_id || null,
        p_bank_details: request.bank_details ? {
          bank_name: request.bank_details.bank_name,
          account_holder_name: request.bank_details.account_holder_name,
          routing_number: request.bank_details.routing_number,
          account_type: request.bank_details.account_type,
          country: request.bank_details.country || 'US'
        } : null,
        p_paypal_details: request.paypal_details ? {
          email: request.paypal_details.email,
          account_id: request.paypal_details.account_id
        } : null,
        p_is_primary: request.is_primary || false
      });

      if (error) throw error;

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error upserting platform account:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create/update platform account'
      };
    }
  }

  /**
   * Update platform account settings
   */
  static async updatePlatformAccount(
    accountId: string, 
    updates: UpdatePlatformAccountRequest
  ): Promise<PlatformAccountServiceResult<PlatformAccountConfig>> {
    try {
      const updateData: any = {};
      
      if (updates.account_name) updateData.account_name = updates.account_name;
      if (updates.is_primary !== undefined) updateData.is_primary = updates.is_primary;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.auto_payout_enabled !== undefined) updateData.auto_payout_enabled = updates.auto_payout_enabled;
      if (updates.payout_schedule) updateData.payout_schedule = updates.payout_schedule;
      if (updates.payout_day !== undefined) updateData.payout_day = updates.payout_day;
      if (updates.minimum_payout_amount !== undefined) updateData.minimum_payout_amount = updates.minimum_payout_amount;

      // Handle bank details update
      if (updates.bank_details) {
        if (updates.bank_details.bank_name) updateData.bank_name = updates.bank_details.bank_name;
        if (updates.bank_details.account_holder_name) updateData.bank_account_holder_name = updates.bank_details.account_holder_name;
        if (updates.bank_details.routing_number) updateData.bank_routing_number = updates.bank_details.routing_number;
        if (updates.bank_details.account_type) updateData.bank_account_type = updates.bank_details.account_type;
      }

      // Handle PayPal details update
      if (updates.paypal_details) {
        if (updates.paypal_details.email) updateData.paypal_email = updates.paypal_details.email;
        if (updates.paypal_details.account_id) updateData.paypal_account_id = updates.paypal_details.account_id;
      }

      updateData.updated_at = new Date().toISOString();

      // If setting as primary, unset other primary accounts first
      if (updates.is_primary) {
        await supabase
          .from('platform_account_config')
          .update({ is_primary: false })
          .neq('id', accountId);
      }

      const { data, error } = await supabase
        .from('platform_account_config')
        .update(updateData)
        .eq('id', accountId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error updating platform account:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update platform account'
      };
    }
  }

  /**
   * Delete platform account
   */
  static async deletePlatformAccount(accountId: string): Promise<PlatformAccountServiceResult<void>> {
    try {
      const { error } = await supabase
        .from('platform_account_config')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting platform account:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete platform account'
      };
    }
  }

  /**
   * Get platform balance
   */
  static async getPlatformBalance(accountId?: string): Promise<PlatformAccountServiceResult<PlatformBalance>> {
    try {
      let query = supabase.from('platform_balance').select('*');
      
      if (accountId) {
        query = query.eq('account_id', accountId);
      } else {
        // Get balance for primary account
        const primaryAccount = await this.getPrimaryAccount();
        if (!primaryAccount.success || !primaryAccount.data) {
          return {
            success: false,
            error: 'No primary platform account found'
          };
        }
        query = query.eq('account_id', primaryAccount.data.id);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        success: true,
        data: data || null
      };
    } catch (error) {
      console.error('Error fetching platform balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch platform balance'
      };
    }
  }

  /**
   * Get platform transactions with filtering
   */
  static async getPlatformTransactions(
    filters?: {
      transaction_type?: string;
      creator_id?: string;
      status?: string;
      date_from?: string;
      date_to?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<PlatformAccountServiceResult<PlatformTransaction[]>> {
    try {
      let query = supabase
        .from('platform_transactions')
        .select(`
          *,
          creator:auth.users!creator_id(id, raw_user_meta_data)
        `)
        .order('created_at', { ascending: false });

      if (filters?.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      if (filters?.creator_id) {
        query = query.eq('creator_id', filters.creator_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error fetching platform transactions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch platform transactions'
      };
    }
  }

  /**
   * Get platform dashboard statistics
   */
  static async getPlatformDashboardStats(): Promise<PlatformAccountServiceResult<PlatformDashboardStats>> {
    try {
      // Get platform balance
      const balanceResult = await this.getPlatformBalance();
      if (!balanceResult.success) {
        throw new Error(balanceResult.error);
      }

      const balance = balanceResult.data;

      // Get recent transactions
      const transactionsResult = await this.getPlatformTransactions({ limit: 10 });
      const recentTransactions = transactionsResult.success ? transactionsResult.data || [] : [];

      // Get this month's fees
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: thisMonthData, error: thisMonthError } = await supabase
        .from('platform_transactions')
        .select('amount')
        .eq('transaction_type', 'fee_collection')
        .gte('created_at', startOfMonth.toISOString());

      if (thisMonthError) throw thisMonthError;

      const thisMonthFees = thisMonthData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // Get last month's fees for growth calculation
      const startOfLastMonth = new Date();
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
      startOfLastMonth.setDate(1);
      startOfLastMonth.setHours(0, 0, 0, 0);

      const endOfLastMonth = new Date(startOfMonth);
      endOfLastMonth.setTime(endOfLastMonth.getTime() - 1);

      const { data: lastMonthData, error: lastMonthError } = await supabase
        .from('platform_transactions')
        .select('amount')
        .eq('transaction_type', 'fee_collection')
        .gte('created_at', startOfLastMonth.toISOString())
        .lt('created_at', startOfMonth.toISOString());

      if (lastMonthError) throw lastMonthError;

      const lastMonthFees = lastMonthData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // Calculate growth percentage
      const growthPercentage = lastMonthFees > 0 
        ? ((thisMonthFees - lastMonthFees) / lastMonthFees) * 100 
        : thisMonthFees > 0 ? 100 : 0;

      // Get pending payouts count
      const { data: pendingPayouts, error: pendingError } = await supabase
        .from('payout_requests')
        .select('id')
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Get active creators count
      const { data: activeCreators, error: creatorsError } = await supabase
        .from('creator_wallets')
        .select('id')
        .gt('total_earned', 0);

      if (creatorsError) throw creatorsError;

      const stats: PlatformDashboardStats = {
        available_balance: balance?.available_balance || 0,
        pending_balance: balance?.pending_balance || 0,
        reserved_balance: balance?.reserved_balance || 0,
        total_fees_collected: balance?.total_fees_collected || 0,
        total_payouts_made: balance?.total_payouts_made || 0,
        net_revenue: (balance?.total_fees_collected || 0) - (balance?.total_payouts_made || 0),
        recent_transactions: recentTransactions,
        pending_payouts: pendingPayouts?.length || 0,
        active_creators: activeCreators?.length || 0,
        this_month_fees: thisMonthFees,
        last_month_fees: lastMonthFees,
        growth_percentage: Math.round(growthPercentage * 100) / 100
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error fetching platform dashboard stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats'
      };
    }
  }

  /**
   * Setup Stripe Connect account
   */
  static async setupStripeConnect(request: StripeConnectSetupRequest): Promise<StripeConnectOnboardingResult> {
    try {
      // This would call your backend API to create Stripe Connect account
      const response = await fetch('/api/stripe/connect/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Stripe Connect setup failed');
      }

      const result = await response.json();
      
      // Save Stripe account to platform config
      if (result.success && result.account_id) {
        await this.upsertPlatformAccount({
          account_type: 'stripe_connect',
          account_name: 'Stripe Connect Account',
          stripe_account_id: result.account_id,
          is_primary: true
        });
      }

      return result;
    } catch (error) {
      console.error('Error setting up Stripe Connect:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stripe Connect setup failed'
      };
    }
  }

  /**
   * Get Stripe Connect account information
   */
  static async getStripeConnectInfo(accountId: string): Promise<PlatformAccountServiceResult<StripeConnectAccountInfo>> {
    try {
      const response = await fetch(`/api/stripe/connect/account/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch Stripe account info');
      }

      const data = await response.json();

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error fetching Stripe Connect info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Stripe account info'
      };
    }
  }

  /**
   * Process batch creator payouts
   */
  static async processBatchPayouts(request: BatchPayoutRequest): Promise<BatchPayoutResult> {
    try {
      const response = await fetch('/api/platform/batch-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Batch payout failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing batch payouts:', error);
      return {
        success: false,
        total_amount: 0,
        successful_payouts: 0,
        failed_payouts: request.payouts.length,
        batch_id: '',
        errors: request.payouts.map(p => ({
          creator_id: p.creator_id,
          error: error instanceof Error ? error.message : 'Payout failed'
        }))
      };
    }
  }
}

// Export convenience functions
export const getPlatformAccounts = PlatformAccountService.getPlatformAccounts;
export const getPrimaryAccount = PlatformAccountService.getPrimaryAccount;
export const upsertPlatformAccount = PlatformAccountService.upsertPlatformAccount;
export const updatePlatformAccount = PlatformAccountService.updatePlatformAccount;
export const deletePlatformAccount = PlatformAccountService.deletePlatformAccount;
export const getPlatformBalance = PlatformAccountService.getPlatformBalance;
export const getPlatformTransactions = PlatformAccountService.getPlatformTransactions;
export const getPlatformDashboardStats = PlatformAccountService.getPlatformDashboardStats;
export const setupStripeConnect = PlatformAccountService.setupStripeConnect;
export const getStripeConnectInfo = PlatformAccountService.getStripeConnectInfo;
export const processBatchPayouts = PlatformAccountService.processBatchPayouts;
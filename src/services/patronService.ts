import { supabase } from '@/integrations/supabase/client';

export interface MembershipTier {
  id: string;
  community_id: string;
  name: string;
  description?: string;
  price_monthly: number;
  benefits: string[];
  is_highlighted: boolean;
  max_members?: number;
  current_members: number;
  color?: string;
  icon?: string;
  position: number;
  is_active: boolean;
  stripe_product_id?: string;
  stripe_price_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatorWallet {
  id: string;
  user_id: string;
  community_id: string;
  balance: number;              // Available for payout
  pending_balance: number;      // Held for 7 days
  lifetime_earnings: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface RevenueTransaction {
  id: string;
  subscription_id?: string;
  community_id: string;
  creator_id: string;
  transaction_type: 'membership_payment' | 'platform_fee' | 'creator_payout' | 'payout_request' | 'payout_completed' | 'refund' | 'chargeback';
  gross_amount: number;
  platform_fee: number;
  creator_amount: number;
  net_amount: number;
  currency: string;
  payment_method?: string;
  card_brand?: string;
  card_last4?: string;
  stripe_payment_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  description?: string;
  created_at: string;
}

export interface PayoutRequest {
  id: string;
  creator_id: string;
  wallet_id: string;
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'paypal' | 'stripe_transfer';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requested_at: string;
  processed_at?: string;
  completed_at?: string;
  notes?: string;
  failure_reason?: string;
}

export interface SavedPaymentMethod {
  id: string;
  user_id: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  card_holder_name?: string;
  billing_address?: any;
  stripe_payment_method_id: string;
  stripe_customer_id?: string;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
}

export class PatronService {
  /**
   * Get membership tiers for a community
   */
  static async getMembershipTiers(communityId: string): Promise<MembershipTier[]> {
    const { data, error } = await supabase
      .from('membership_tiers')
      .select('*')
      .eq('community_id', communityId)
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a membership tier
   */
  static async createMembershipTier(tier: Partial<MembershipTier>): Promise<MembershipTier> {
    const { data, error } = await supabase
      .from('membership_tiers')
      .insert(tier)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a membership tier
   */
  static async updateMembershipTier(tierId: string, updates: Partial<MembershipTier>): Promise<MembershipTier> {
    const { data, error } = await supabase
      .from('membership_tiers')
      .update(updates)
      .eq('id', tierId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Process membership payment with revenue split
   */
  static async processMembershipPayment(
    subscriptionId: string,
    grossAmount: number,
    paymentMethod: string,
    cardBrand?: string,
    cardLast4?: string,
    stripePaymentId?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('process_membership_payment', {
      p_subscription_id: subscriptionId,
      p_gross_amount: grossAmount,
      p_payment_method: paymentMethod,
      p_card_brand: cardBrand,
      p_card_last4: cardLast4,
      p_stripe_payment_id: stripePaymentId,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get creator wallet
   */
  static async getCreatorWallet(userId: string, communityId?: string): Promise<CreatorWallet | null> {
    let query = supabase
      .from('creator_wallets')
      .select('*')
      .eq('user_id', userId);

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  /**
   * Get all creator wallets for a user
   */
  static async getCreatorWallets(userId: string): Promise<CreatorWallet[]> {
    const { data, error } = await supabase
      .from('creator_wallets')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get revenue transactions
   */
  static async getRevenueTransactions(
    creatorId: string,
    limit = 50
  ): Promise<RevenueTransaction[]> {
    const { data, error } = await supabase
      .from('revenue_transactions')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Request payout
   */
  static async requestPayout(
    creatorId: string,
    amount: number,
    method: 'bank_transfer' | 'paypal' | 'stripe_transfer',
    bankDetails?: any
  ): Promise<string> {
    const { data, error } = await supabase.rpc('request_payout', {
      p_creator_id: creatorId,
      p_amount: amount,
      p_method: method,
      p_bank_details: bankDetails || null,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get payout requests
   */
  static async getPayoutRequests(creatorId: string): Promise<PayoutRequest[]> {
    const { data, error } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('creator_id', creatorId)
      .order('requested_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Save payment method
   */
  static async savePaymentMethod(
    userId: string,
    paymentMethodData: Partial<SavedPaymentMethod>
  ): Promise<SavedPaymentMethod> {
    // If setting as default, unset other default methods first
    if (paymentMethodData.is_default) {
      await supabase
        .from('saved_payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabase
      .from('saved_payment_methods')
      .insert({
        user_id: userId,
        ...paymentMethodData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get saved payment methods
   */
  static async getPaymentMethods(userId: string): Promise<SavedPaymentMethod[]> {
    const { data, error } = await supabase
      .from('saved_payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Delete payment method
   */
  static async deletePaymentMethod(methodId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_payment_methods')
      .delete()
      .eq('id', methodId);

    if (error) throw error;
  }

  /**
   * Set default payment method
   */
  static async setDefaultPaymentMethod(userId: string, methodId: string): Promise<void> {
    // Unset all defaults
    await supabase
      .from('saved_payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Set new default
    const { error } = await supabase
      .from('saved_payment_methods')
      .update({ is_default: true })
      .eq('id', methodId);

    if (error) throw error;
  }

  /**
   * Calculate revenue split
   */
  static calculateRevenueSplit(grossAmount: number): {
    platformFee: number;
    creatorAmount: number;
    platformPercentage: number;
    creatorPercentage: number;
  } {
    const platformPercentage = 30;
    const creatorPercentage = 70;
    const platformFee = Math.round(grossAmount * 0.30 * 100) / 100;
    const creatorAmount = Math.round(grossAmount * 0.70 * 100) / 100;

    return {
      platformFee,
      creatorAmount,
      platformPercentage,
      creatorPercentage,
    };
  }

  /**
   * Get earnings summary
   */
  static async getEarningsSummary(creatorId: string): Promise<{
    totalEarnings: number;
    availableBalance: number;
    pendingBalance: number;
    totalPayouts: number;
    thisMonthEarnings: number;
  }> {
    const wallets = await this.getCreatorWallets(creatorId);
    
    const totalEarnings = wallets.reduce((sum, w) => sum + w.lifetime_earnings, 0);
    const availableBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    const pendingBalance = wallets.reduce((sum, w) => sum + w.pending_balance, 0);

    // Get this month's earnings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyTransactions } = await supabase
      .from('revenue_transactions')
      .select('creator_amount')
      .eq('creator_id', creatorId)
      .eq('transaction_type', 'membership_payment')
      .gte('created_at', startOfMonth.toISOString());

    const thisMonthEarnings = monthlyTransactions?.reduce(
      (sum, t) => sum + t.creator_amount, 
      0
    ) || 0;

    // Get total payouts
    const { data: payouts } = await supabase
      .from('payout_requests')
      .select('amount')
      .eq('creator_id', creatorId)
      .eq('status', 'completed');

    const totalPayouts = payouts?.reduce((sum, p) => sum + p.amount, 0) || 0;

    return {
      totalEarnings,
      availableBalance,
      pendingBalance,
      totalPayouts,
      thisMonthEarnings,
    };
  }
}

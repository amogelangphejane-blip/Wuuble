export interface CreatorWallet {
  id: string;
  creator_id: string;
  balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  currency: string;
  stripe_account_id?: string;
  payout_method: PayoutMethod;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  description?: string;
  reference_id?: string;
  reference_type?: string;
  status: TransactionStatus;
  metadata: Record<string, any>;
  processed_at: string;
  created_at: string;
}

export interface PlatformFeeConfig {
  id: string;
  fee_percentage: number;
  minimum_fee: number;
  maximum_fee?: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayoutRequest {
  id: string;
  wallet_id: string;
  amount: number;
  currency: string;
  payout_method: PayoutMethod;
  status: PayoutStatus;
  external_payout_id?: string;
  failure_reason?: string;
  requested_at: string;
  processed_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PayoutMethod {
  type: 'bank_account' | 'paypal' | 'stripe_express';
  details: BankAccountDetails | PayPalDetails | StripeExpressDetails;
}

export interface BankAccountDetails {
  account_holder_name: string;
  account_number: string;
  routing_number: string;
  bank_name: string;
  account_type: 'checking' | 'savings';
}

export interface PayPalDetails {
  email: string;
}

export interface StripeExpressDetails {
  account_id: string;
}

export type TransactionType = 
  | 'subscription_payment' 
  | 'platform_fee' 
  | 'payout' 
  | 'refund' 
  | 'adjustment'
  | 'bonus'
  | 'penalty';

export type TransactionStatus = 
  | 'pending' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export type PayoutStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface WalletStats {
  total_balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  this_month_earned: number;
  last_month_earned: number;
  average_monthly_earnings: number;
  total_subscribers: number;
  active_subscriptions: number;
}

export interface PaymentProcessingResult {
  success: boolean;
  payment_id?: string;
  transaction_id?: string;
  gross_amount?: number;
  platform_fee?: number;
  creator_amount?: number;
  error?: string;
}

export interface CreatePayoutRequest {
  wallet_id: string;
  amount: number;
  payout_method: PayoutMethod;
}

export interface PayoutRequestResult {
  success: boolean;
  payout_id?: string;
  amount?: number;
  error?: string;
}

export interface WalletSummary {
  available_balance: number;
  pending_payouts: number;
  total_lifetime_earnings: number;
  current_month_earnings: number;
  platform_fee_rate: number;
  next_payout_date?: string;
  minimum_payout_amount: number;
}

export interface TransactionFilter {
  transaction_type?: TransactionType;
  status?: TransactionStatus;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface EarningsBreakdown {
  gross_revenue: number;
  platform_fees: number;
  net_earnings: number;
  subscription_count: number;
  average_subscription_value: number;
  period_start: string;
  period_end: string;
}
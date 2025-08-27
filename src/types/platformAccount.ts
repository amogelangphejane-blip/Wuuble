// Platform Account Types
// Types for managing platform payment account configuration and transactions

export interface PlatformAccountConfig {
  id: string;
  account_type: 'stripe_connect' | 'bank_account' | 'paypal';
  account_name: string;
  
  // Stripe Connect fields
  stripe_account_id?: string;
  stripe_account_status?: 'pending' | 'enabled' | 'restricted' | 'disabled';
  stripe_charges_enabled?: boolean;
  stripe_payouts_enabled?: boolean;
  stripe_details_submitted?: boolean;
  
  // Bank account fields
  bank_name?: string;
  bank_account_holder_name?: string;
  bank_account_number_encrypted?: string;
  bank_routing_number?: string;
  bank_account_type?: 'checking' | 'savings';
  bank_country?: string;
  
  // PayPal fields
  paypal_email?: string;
  paypal_account_id?: string;
  
  // Configuration
  is_active: boolean;
  is_primary: boolean;
  currency: string;
  
  // Settings
  auto_payout_enabled: boolean;
  payout_schedule: 'daily' | 'weekly' | 'monthly';
  payout_day: number;
  minimum_payout_amount: number;
  
  // Metadata
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PlatformTransaction {
  id: string;
  transaction_type: 'fee_collection' | 'creator_payout' | 'refund' | 'adjustment' | 'stripe_transfer';
  amount: number;
  currency: string;
  
  // References
  reference_id?: string;
  reference_type?: string;
  creator_id?: string;
  
  // Payment details
  platform_account_id?: string;
  external_transaction_id?: string;
  
  // Status and metadata
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  metadata: Record<string, any>;
  
  // Timestamps
  processed_at: string;
  created_at: string;
}

export interface PlatformBalance {
  id: string;
  account_id: string;
  
  // Balances
  available_balance: number;
  pending_balance: number;
  reserved_balance: number;
  
  // Totals
  total_fees_collected: number;
  total_payouts_made: number;
  
  currency: string;
  last_updated: string;
  created_at: string;
}

// Request/Response Types

export interface CreatePlatformAccountRequest {
  account_type: 'stripe_connect' | 'bank_account' | 'paypal';
  account_name: string;
  
  // Stripe Connect
  stripe_account_id?: string;
  
  // Bank account details
  bank_details?: {
    bank_name: string;
    account_holder_name: string;
    account_number: string;
    routing_number: string;
    account_type: 'checking' | 'savings';
    country?: string;
  };
  
  // PayPal details
  paypal_details?: {
    email: string;
    account_id?: string;
  };
  
  // Settings
  is_primary?: boolean;
  auto_payout_enabled?: boolean;
  payout_schedule?: 'daily' | 'weekly' | 'monthly';
  payout_day?: number;
  minimum_payout_amount?: number;
}

export interface UpdatePlatformAccountRequest {
  account_name?: string;
  
  // Bank account details (for updates)
  bank_details?: {
    bank_name?: string;
    account_holder_name?: string;
    account_number?: string;
    routing_number?: string;
    account_type?: 'checking' | 'savings';
  };
  
  // PayPal details (for updates)
  paypal_details?: {
    email?: string;
    account_id?: string;
  };
  
  // Settings
  is_primary?: boolean;
  is_active?: boolean;
  auto_payout_enabled?: boolean;
  payout_schedule?: 'daily' | 'weekly' | 'monthly';
  payout_day?: number;
  minimum_payout_amount?: number;
}

export interface PlatformAccountServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StripeConnectAccountInfo {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
  capabilities: {
    card_payments?: 'active' | 'inactive' | 'pending';
    transfers?: 'active' | 'inactive' | 'pending';
  };
}

export interface PlatformDashboardStats {
  // Current balances
  available_balance: number;
  pending_balance: number;
  reserved_balance: number;
  
  // Totals
  total_fees_collected: number;
  total_payouts_made: number;
  net_revenue: number;
  
  // Recent activity
  recent_transactions: PlatformTransaction[];
  pending_payouts: number;
  active_creators: number;
  
  // Time periods
  this_month_fees: number;
  last_month_fees: number;
  growth_percentage: number;
}

export interface CreatorPayoutRequest {
  creator_id: string;
  amount: number;
  currency: string;
  payout_method: {
    type: 'stripe_connect' | 'bank_transfer' | 'paypal';
    details: Record<string, any>;
  };
}

export interface BatchPayoutRequest {
  payouts: CreatorPayoutRequest[];
  description?: string;
  scheduled_date?: string; // ISO date string
}

export interface BatchPayoutResult {
  success: boolean;
  total_amount: number;
  successful_payouts: number;
  failed_payouts: number;
  batch_id: string;
  errors?: Array<{
    creator_id: string;
    error: string;
  }>;
}

// Stripe Connect specific types
export interface StripeConnectOnboardingResult {
  success: boolean;
  account_id?: string;
  onboarding_url?: string;
  error?: string;
}

export interface StripeConnectSetupRequest {
  business_type?: 'individual' | 'company';
  country?: string;
  email?: string;
  return_url?: string;
  refresh_url?: string;
}

// Platform configuration
export interface PlatformConfig {
  fee_percentage: number;
  minimum_payout_amount: number;
  payout_schedule: 'daily' | 'weekly' | 'monthly';
  auto_payout_enabled: boolean;
  stripe_connect_enabled: boolean;
  bank_transfer_enabled: boolean;
  paypal_enabled: boolean;
}

// Analytics types
export interface PlatformAnalytics {
  revenue_by_month: Array<{
    month: string;
    total_revenue: number;
    platform_fees: number;
    creator_payouts: number;
  }>;
  
  top_creators: Array<{
    creator_id: string;
    creator_name: string;
    total_earned: number;
    subscriber_count: number;
  }>;
  
  payment_method_breakdown: Array<{
    method: string;
    count: number;
    total_amount: number;
  }>;
  
  subscription_metrics: {
    total_active: number;
    new_this_month: number;
    churned_this_month: number;
    average_revenue_per_user: number;
  };
}
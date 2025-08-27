export interface SubscriptionPlan {
  id: string;
  community_id: string;
  name: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  trial_days: number;
  features: string[];
  is_active: boolean;
  max_members?: number;
  stripe_product_id?: string;
  stripe_price_monthly?: string;
  stripe_price_yearly?: string;
  created_at: string;
  updated_at: string;
}

export interface MemberSubscription {
  id: string;
  community_id: string;
  user_id: string;
  plan_id: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  trial_start?: string;
  trial_end?: string;
  cancelled_at?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  coupon_id?: string;
  discount_amount?: number;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
  coupon?: SubscriptionCoupon;
}

export interface SubscriptionPayment {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  external_payment_id?: string;
  paid_at?: string;
  due_date: string;
  created_at: string;
}

export interface PaymentReminder {
  id: string;
  subscription_id: string;
  reminder_type: 'upcoming' | 'overdue' | 'trial_ending';
  sent_at: string;
  due_date: string;
}

export interface SubscriptionStatus {
  subscription_id?: string;
  plan_name?: string;
  status?: string;
  billing_cycle?: string;
  current_period_end?: string;
  trial_end?: string;
  is_trial?: boolean;
}

export interface CreateSubscriptionPlanRequest {
  community_id: string;
  name: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  trial_days?: number;
  features: string[];
  max_members?: number;
}

export interface UpdateSubscriptionPlanRequest {
  name?: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  trial_days?: number;
  features?: string[];
  is_active?: boolean;
  max_members?: number;
}

export interface CreateMemberSubscriptionRequest {
  community_id: string;
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
}

export interface SubscriptionMetrics {
  total_subscribers: number;
  active_subscribers: number;
  trial_subscribers: number;
  monthly_revenue: number;
  yearly_revenue: number;
  churn_rate: number;
  conversion_rate: number;
}

export interface PricingTier {
  plan: SubscriptionPlan;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  savings?: number; // Percentage savings for yearly vs monthly
}

export interface SubscriptionFormData {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  paymentMethod: string;
  cardDetails?: {
    number: string;
    expiry: string;
    cvc: string;
    name: string;
  };
}

export interface PaymentMethodInfo {
  id: string;
  type: 'card' | 'paypal' | 'bank_transfer' | 'crypto';
  display_name: string;
  is_default: boolean;
  is_active: boolean;
  
  // Card-specific fields
  card_last4?: string;
  card_brand?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  
  // PayPal-specific fields
  paypal_email?: string;
  paypal_account_id?: string;
  
  // Bank transfer-specific fields
  bank_name?: string;
  bank_account_last4?: string;
  bank_routing_number?: string;
  bank_account_type?: 'checking' | 'savings';
  bank_account_holder_name?: string;
  
  // External payment processor IDs
  stripe_payment_method_id?: string;
  paypal_payment_method_id?: string;
  
  created_at: string;
}

export interface SubscriptionFeature {
  name: string;
  description: string;
  icon?: string;
  included: boolean;
}

export interface BillingHistory {
  payments: SubscriptionPayment[];
  total_paid: number;
  next_payment_date?: string;
  next_payment_amount?: number;
}

export interface SubscriptionCoupon {
  id: string;
  community_id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  currency: string;
  max_uses?: number;
  current_uses: number;
  valid_from: string;
  valid_until?: string;
  applies_to: 'all' | 'first_payment' | 'recurring';
  minimum_amount?: number;
  is_active: boolean;
  stripe_coupon_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string;
  subscription_id?: string;
  discount_amount: number;
  used_at: string;
  coupon?: SubscriptionCoupon;
}

export interface CreateCouponRequest {
  community_id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  currency?: string;
  max_uses?: number;
  valid_from?: string;
  valid_until?: string;
  applies_to?: 'all' | 'first_payment' | 'recurring';
  minimum_amount?: number;
}

export interface UpdateCouponRequest {
  name?: string;
  description?: string;
  discount_value?: number;
  max_uses?: number;
  valid_until?: string;
  applies_to?: 'all' | 'first_payment' | 'recurring';
  minimum_amount?: number;
  is_active?: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon_id?: string;
  discount_amount?: number;
  error_message?: string;
}

export interface CouponStats {
  total_coupons: number;
  active_coupons: number;
  total_uses: number;
  total_discount_given: number;
}

export interface PaymentMethodVerification {
  id: string;
  payment_method_id: string;
  verification_type: 'micro_deposits' | 'instant' | 'manual';
  status: 'pending' | 'verified' | 'failed' | 'expired';
  verification_code?: string;
  micro_deposit_amounts?: number[];
  verified_at?: string;
  expires_at?: string;
  attempts: number;
  max_attempts: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentInstructions {
  id: string;
  community_id: string;
  payment_type: 'bank_transfer' | 'crypto' | 'other';
  title: string;
  instructions: string;
  is_active: boolean;
  
  // Bank transfer specific
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  routing_number?: string;
  swift_code?: string;
  iban?: string;
  
  // Crypto specific
  wallet_address?: string;
  crypto_type?: string;
  network?: string;
  
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentMethodRequest {
  type: 'card' | 'paypal' | 'bank_transfer' | 'crypto';
  display_name: string;
  is_default?: boolean;
  
  // Card-specific fields
  card_last4?: string;
  card_brand?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  stripe_payment_method_id?: string;
  
  // PayPal-specific fields
  paypal_email?: string;
  paypal_account_id?: string;
  paypal_payment_method_id?: string;
  
  // Bank transfer-specific fields
  bank_name?: string;
  bank_account_last4?: string;
  bank_routing_number?: string;
  bank_account_type?: 'checking' | 'savings';
  bank_account_holder_name?: string;
}

export interface PaymentMethodValidationResult {
  is_valid: boolean;
  error_message?: string;
  requires_verification: boolean;
}

export interface SubscriptionFormDataExtended extends SubscriptionFormData {
  paymentMethodId?: string;
  newPaymentMethod?: CreatePaymentMethodRequest;
}
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
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
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
  type: 'card' | 'paypal' | 'bank_transfer';
  last4?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
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
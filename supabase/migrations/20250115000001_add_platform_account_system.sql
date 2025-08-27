-- Platform Account System Migration
-- This migration adds functionality for the platform owner to configure payment account details
-- for receiving payments and paying out creators

-- Platform Account Configuration Table
-- Stores the platform's payment account details (Stripe Connect, bank account, etc.)
CREATE TABLE IF NOT EXISTS platform_account_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_type VARCHAR(50) NOT NULL, -- 'stripe_connect', 'bank_account', 'paypal'
  account_name VARCHAR(255) NOT NULL, -- Display name for the account
  
  -- Stripe Connect fields
  stripe_account_id VARCHAR(255), -- Stripe Connect account ID
  stripe_account_status VARCHAR(50), -- 'pending', 'enabled', 'restricted', 'disabled'
  stripe_charges_enabled BOOLEAN DEFAULT false,
  stripe_payouts_enabled BOOLEAN DEFAULT false,
  stripe_details_submitted BOOLEAN DEFAULT false,
  
  -- Bank account fields (for manual setup)
  bank_name VARCHAR(255),
  bank_account_holder_name VARCHAR(255),
  bank_account_number_encrypted TEXT, -- Encrypted account number
  bank_routing_number VARCHAR(20),
  bank_account_type VARCHAR(20), -- 'checking', 'savings'
  bank_country VARCHAR(3) DEFAULT 'US',
  
  -- PayPal fields
  paypal_email VARCHAR(255),
  paypal_account_id VARCHAR(255),
  
  -- Configuration
  is_active BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false, -- Primary account for receiving payments
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Settings
  auto_payout_enabled BOOLEAN DEFAULT false, -- Automatically payout creator earnings
  payout_schedule VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  payout_day INTEGER DEFAULT 5, -- Day of week (0=Sunday) or day of month
  minimum_payout_amount DECIMAL(10,2) DEFAULT 25.00,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_account_type CHECK (account_type IN ('stripe_connect', 'bank_account', 'paypal')),
  CONSTRAINT check_payout_schedule CHECK (payout_schedule IN ('daily', 'weekly', 'monthly')),
  CONSTRAINT check_only_one_primary UNIQUE (is_primary) DEFERRABLE INITIALLY DEFERRED
);

-- Platform Transactions Table
-- Tracks all platform-level financial transactions (fees collected, payouts made)
CREATE TABLE IF NOT EXISTS platform_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type VARCHAR(50) NOT NULL, -- 'fee_collection', 'creator_payout', 'refund', 'adjustment'
  amount DECIMAL(12,2) NOT NULL, -- Positive for income, negative for outgoing
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- References
  reference_id UUID, -- Links to subscription_payment, payout_request, etc.
  reference_type VARCHAR(50), -- 'subscription_payment', 'payout_request', etc.
  creator_id UUID REFERENCES auth.users(id), -- For creator-related transactions
  
  -- Payment details
  platform_account_id UUID REFERENCES platform_account_config(id),
  external_transaction_id VARCHAR(255), -- Stripe transfer ID, bank transaction ID, etc.
  
  -- Status and metadata
  status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_transaction_type CHECK (transaction_type IN ('fee_collection', 'creator_payout', 'refund', 'adjustment', 'stripe_transfer')),
  CONSTRAINT check_status CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'))
);

-- Platform Balance Table
-- Tracks the platform's current balance and reserves
CREATE TABLE IF NOT EXISTS platform_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES platform_account_config(id),
  
  -- Balances
  available_balance DECIMAL(12,2) DEFAULT 0.00, -- Available for payouts
  pending_balance DECIMAL(12,2) DEFAULT 0.00, -- Pending transactions
  reserved_balance DECIMAL(12,2) DEFAULT 0.00, -- Reserved for creator payouts
  
  -- Totals
  total_fees_collected DECIMAL(12,2) DEFAULT 0.00, -- Lifetime platform fees
  total_payouts_made DECIMAL(12,2) DEFAULT 0.00, -- Lifetime creator payouts
  
  currency VARCHAR(3) DEFAULT 'USD',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add platform transaction reference to existing wallet transactions
ALTER TABLE wallet_transactions 
ADD COLUMN IF NOT EXISTS platform_transaction_id UUID REFERENCES platform_transactions(id);

-- Add platform fee tracking to existing subscription payments
ALTER TABLE subscription_payments 
ADD COLUMN IF NOT EXISTS platform_transaction_id UUID REFERENCES platform_transactions(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_account_config_active ON platform_account_config(is_active, is_primary);
CREATE INDEX IF NOT EXISTS idx_platform_account_config_stripe ON platform_account_config(stripe_account_id) WHERE stripe_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_platform_transactions_type ON platform_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_platform_transactions_reference ON platform_transactions(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_platform_transactions_creator ON platform_transactions(creator_id);
CREATE INDEX IF NOT EXISTS idx_platform_balance_account ON platform_balance(account_id);

-- RLS Policies (Admin only access)
ALTER TABLE platform_account_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_balance ENABLE ROW LEVEL SECURITY;

-- Create admin role for platform management
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'platform_admin') THEN
    CREATE ROLE platform_admin;
  END IF;
END
$$;

-- Platform Account Config Policies (Admin only)
CREATE POLICY "Only platform admins can access platform accounts" ON platform_account_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'platform_admin')
    )
  );

-- Platform Transactions Policies (Admin only)
CREATE POLICY "Only platform admins can access platform transactions" ON platform_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'platform_admin')
    )
  );

-- Platform Balance Policies (Admin only)
CREATE POLICY "Only platform admins can access platform balance" ON platform_balance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'platform_admin')
    )
  );

-- Functions for platform account management

-- Function to create or update platform account
CREATE OR REPLACE FUNCTION upsert_platform_account(
  p_account_type VARCHAR(50),
  p_account_name VARCHAR(255),
  p_stripe_account_id VARCHAR(255) DEFAULT NULL,
  p_bank_details JSONB DEFAULT NULL,
  p_paypal_details JSONB DEFAULT NULL,
  p_is_primary BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_account_id UUID;
  v_balance_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'platform_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- If setting as primary, unset other primary accounts
  IF p_is_primary THEN
    UPDATE platform_account_config SET is_primary = false WHERE is_primary = true;
  END IF;
  
  -- Insert or update platform account
  INSERT INTO platform_account_config (
    account_type,
    account_name,
    stripe_account_id,
    bank_name,
    bank_account_holder_name,
    bank_routing_number,
    paypal_email,
    paypal_account_id,
    is_primary,
    is_active
  ) VALUES (
    p_account_type,
    p_account_name,
    p_stripe_account_id,
    CASE WHEN p_bank_details IS NOT NULL THEN p_bank_details->>'bank_name' END,
    CASE WHEN p_bank_details IS NOT NULL THEN p_bank_details->>'account_holder_name' END,
    CASE WHEN p_bank_details IS NOT NULL THEN p_bank_details->>'routing_number' END,
    CASE WHEN p_paypal_details IS NOT NULL THEN p_paypal_details->>'email' END,
    CASE WHEN p_paypal_details IS NOT NULL THEN p_paypal_details->>'account_id' END,
    p_is_primary,
    true
  ) 
  ON CONFLICT (account_type) WHERE is_primary = true
  DO UPDATE SET
    account_name = EXCLUDED.account_name,
    stripe_account_id = EXCLUDED.stripe_account_id,
    bank_name = EXCLUDED.bank_name,
    bank_account_holder_name = EXCLUDED.bank_account_holder_name,
    bank_routing_number = EXCLUDED.bank_routing_number,
    paypal_email = EXCLUDED.paypal_email,
    paypal_account_id = EXCLUDED.paypal_account_id,
    is_active = true,
    updated_at = NOW()
  RETURNING id INTO v_account_id;
  
  -- Create platform balance record if it doesn't exist
  INSERT INTO platform_balance (account_id)
  VALUES (v_account_id)
  ON CONFLICT (account_id) DO NOTHING;
  
  RETURN v_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record platform fee collection
CREATE OR REPLACE FUNCTION record_platform_fee(
  p_subscription_payment_id UUID,
  p_fee_amount DECIMAL(10,2),
  p_currency VARCHAR(3) DEFAULT 'USD'
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_primary_account_id UUID;
BEGIN
  -- Get primary platform account
  SELECT id INTO v_primary_account_id
  FROM platform_account_config
  WHERE is_primary = true AND is_active = true
  LIMIT 1;
  
  IF v_primary_account_id IS NULL THEN
    RAISE EXCEPTION 'No active primary platform account configured';
  END IF;
  
  -- Record platform fee collection
  INSERT INTO platform_transactions (
    transaction_type,
    amount,
    currency,
    reference_id,
    reference_type,
    platform_account_id,
    description,
    status
  ) VALUES (
    'fee_collection',
    p_fee_amount,
    p_currency,
    p_subscription_payment_id,
    'subscription_payment',
    v_primary_account_id,
    'Platform fee from subscription payment',
    'completed'
  ) RETURNING id INTO v_transaction_id;
  
  -- Update platform balance
  UPDATE platform_balance
  SET 
    available_balance = available_balance + p_fee_amount,
    total_fees_collected = total_fees_collected + p_fee_amount,
    last_updated = NOW()
  WHERE account_id = v_primary_account_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing payment processing function to record platform fees
CREATE OR REPLACE FUNCTION process_subscription_payment_with_fee(
  p_subscription_id UUID,
  p_gross_amount DECIMAL(10,2),
  p_currency VARCHAR(3) DEFAULT 'USD',
  p_payment_method VARCHAR(50) DEFAULT 'stripe',
  p_external_payment_id VARCHAR(255) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_creator_id UUID;
  v_wallet_id UUID;
  v_fee_percentage DECIMAL(5,2);
  v_platform_fee DECIMAL(10,2);
  v_creator_amount DECIMAL(10,2);
  v_payment_id UUID;
  v_transaction_id UUID;
  v_platform_transaction_id UUID;
BEGIN
  -- Get creator ID from subscription
  SELECT c.creator_id INTO v_creator_id
  FROM community_member_subscriptions cms
  JOIN communities c ON c.id = cms.community_id
  WHERE cms.id = p_subscription_id;
  
  IF v_creator_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subscription not found');
  END IF;
  
  -- Get or create creator wallet
  v_wallet_id := create_creator_wallet(v_creator_id);
  
  -- Get current platform fee percentage
  SELECT fee_percentage INTO v_fee_percentage
  FROM platform_fee_config
  WHERE is_active = true AND currency = p_currency
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_fee_percentage IS NULL THEN
    v_fee_percentage := 20.00; -- Default 20%
  END IF;
  
  -- Calculate fees and creator amount
  v_platform_fee := ROUND(p_gross_amount * (v_fee_percentage / 100), 2);
  v_creator_amount := p_gross_amount - v_platform_fee;
  
  -- Create payment record
  INSERT INTO subscription_payments (
    subscription_id,
    amount,
    gross_amount,
    platform_fee,
    creator_amount,
    currency,
    status,
    payment_method,
    external_payment_id,
    paid_at,
    due_date
  ) VALUES (
    p_subscription_id,
    p_gross_amount,
    p_gross_amount,
    v_platform_fee,
    v_creator_amount,
    p_currency,
    'completed',
    p_payment_method,
    p_external_payment_id,
    NOW(),
    NOW()
  ) RETURNING id INTO v_payment_id;
  
  -- Record platform fee collection
  v_platform_transaction_id := record_platform_fee(v_payment_id, v_platform_fee, p_currency);
  
  -- Update payment record with platform transaction reference
  UPDATE subscription_payments 
  SET platform_transaction_id = v_platform_transaction_id 
  WHERE id = v_payment_id;
  
  -- Create wallet transaction for creator earnings
  INSERT INTO wallet_transactions (
    wallet_id,
    transaction_type,
    amount,
    currency,
    description,
    reference_id,
    reference_type,
    platform_transaction_id,
    status
  ) VALUES (
    v_wallet_id,
    'subscription_payment',
    v_creator_amount,
    p_currency,
    'Subscription payment (after ' || v_fee_percentage || '% platform fee)',
    v_payment_id,
    'subscription_payment',
    v_platform_transaction_id,
    'completed'
  ) RETURNING id INTO v_transaction_id;
  
  -- Update payment record with transaction reference
  UPDATE subscription_payments 
  SET wallet_transaction_id = v_transaction_id 
  WHERE id = v_payment_id;
  
  -- Update wallet balance
  UPDATE creator_wallets 
  SET 
    balance = balance + v_creator_amount,
    total_earned = total_earned + v_creator_amount,
    updated_at = NOW()
  WHERE id = v_wallet_id;
  
  -- Update subscription status to active
  UPDATE community_member_subscriptions
  SET 
    status = 'active',
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 month',
    updated_at = NOW()
  WHERE id = p_subscription_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'transaction_id', v_transaction_id,
    'platform_transaction_id', v_platform_transaction_id,
    'gross_amount', p_gross_amount,
    'platform_fee', v_platform_fee,
    'creator_amount', v_creator_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
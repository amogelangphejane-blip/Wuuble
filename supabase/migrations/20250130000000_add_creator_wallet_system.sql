-- Creator Wallet System Migration
-- This migration adds wallet functionality for creators with platform fee processing

-- Creator Wallets Table
CREATE TABLE IF NOT EXISTS creator_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  pending_balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL, -- Amount pending payout approval
  total_earned DECIMAL(10,2) DEFAULT 0.00 NOT NULL, -- Lifetime earnings
  total_withdrawn DECIMAL(10,2) DEFAULT 0.00 NOT NULL, -- Lifetime withdrawals
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  stripe_account_id VARCHAR(255), -- For Stripe Express/Connect accounts
  payout_method JSONB DEFAULT '{}', -- Store payout method details (bank, PayPal, etc.)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(creator_id)
);

-- Wallet Transactions Table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES creator_wallets(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'subscription_payment', 'platform_fee', 'payout', 'refund', 'adjustment'
  amount DECIMAL(10,2) NOT NULL, -- Positive for credits, negative for debits
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  description TEXT,
  reference_id UUID, -- Reference to subscription payment, payout request, etc.
  reference_type VARCHAR(50), -- 'subscription_payment', 'payout_request', etc.
  status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'cancelled'
  metadata JSONB DEFAULT '{}',
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform Fee Configuration Table
CREATE TABLE IF NOT EXISTS platform_fee_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_percentage DECIMAL(5,2) DEFAULT 20.00 NOT NULL, -- Default 20%
  minimum_fee DECIMAL(10,2) DEFAULT 0.00,
  maximum_fee DECIMAL(10,2), -- Optional maximum fee cap
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payout Requests Table
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES creator_wallets(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  payout_method JSONB NOT NULL, -- Bank details, PayPal, etc.
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  external_payout_id VARCHAR(255), -- Stripe transfer ID or similar
  failure_reason TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Subscription Payments Table (add platform fee tracking)
ALTER TABLE subscription_payments 
ADD COLUMN IF NOT EXISTS gross_amount DECIMAL(10,2), -- Original amount before fees
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) DEFAULT 0.00, -- Platform fee deducted
ADD COLUMN IF NOT EXISTS creator_amount DECIMAL(10,2), -- Amount credited to creator
ADD COLUMN IF NOT EXISTS wallet_transaction_id UUID REFERENCES wallet_transactions(id);

-- Insert default platform fee configuration
INSERT INTO platform_fee_config (fee_percentage, currency) 
VALUES (20.00, 'USD')
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_wallets_creator_id ON creator_wallets(creator_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_payout_requests_wallet_id ON payout_requests(wallet_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);

-- RLS Policies
ALTER TABLE creator_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fee_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Creator Wallets Policies
CREATE POLICY "Creators can view their own wallet" ON creator_wallets
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own wallet settings" ON creator_wallets
  FOR UPDATE USING (auth.uid() = creator_id);

-- Wallet Transactions Policies
CREATE POLICY "Creators can view their wallet transactions" ON wallet_transactions
  FOR SELECT USING (
    wallet_id IN (
      SELECT id FROM creator_wallets WHERE creator_id = auth.uid()
    )
  );

-- Platform Fee Config Policies (read-only for creators)
CREATE POLICY "Anyone can view platform fee config" ON platform_fee_config
  FOR SELECT TO authenticated USING (true);

-- Payout Requests Policies
CREATE POLICY "Creators can view their payout requests" ON payout_requests
  FOR SELECT USING (
    wallet_id IN (
      SELECT id FROM creator_wallets WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "Creators can create payout requests" ON payout_requests
  FOR INSERT WITH CHECK (
    wallet_id IN (
      SELECT id FROM creator_wallets WHERE creator_id = auth.uid()
    )
  );

-- Functions for wallet operations
CREATE OR REPLACE FUNCTION create_creator_wallet(creator_user_id UUID)
RETURNS UUID AS $$
DECLARE
  wallet_id UUID;
BEGIN
  INSERT INTO creator_wallets (creator_id)
  VALUES (creator_user_id)
  ON CONFLICT (creator_id) DO NOTHING
  RETURNING id INTO wallet_id;
  
  -- If no wallet was created (due to conflict), get existing wallet ID
  IF wallet_id IS NULL THEN
    SELECT id INTO wallet_id FROM creator_wallets WHERE creator_id = creator_user_id;
  END IF;
  
  RETURN wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process subscription payment with platform fee
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
  
  -- Create wallet transaction for creator earnings
  INSERT INTO wallet_transactions (
    wallet_id,
    transaction_type,
    amount,
    currency,
    description,
    reference_id,
    reference_type,
    status
  ) VALUES (
    v_wallet_id,
    'subscription_payment',
    v_creator_amount,
    p_currency,
    'Subscription payment (after ' || v_fee_percentage || '% platform fee)',
    v_payment_id,
    'subscription_payment',
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
    'gross_amount', p_gross_amount,
    'platform_fee', v_platform_fee,
    'creator_amount', v_creator_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to request payout
CREATE OR REPLACE FUNCTION request_payout(
  p_wallet_id UUID,
  p_amount DECIMAL(10,2),
  p_payout_method JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance DECIMAL(10,2);
  v_payout_id UUID;
BEGIN
  -- Check wallet balance
  SELECT balance INTO v_current_balance
  FROM creator_wallets
  WHERE id = p_wallet_id AND creator_id = auth.uid();
  
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Create payout request
  INSERT INTO payout_requests (
    wallet_id,
    amount,
    payout_method,
    status
  ) VALUES (
    p_wallet_id,
    p_amount,
    p_payout_method,
    'pending'
  ) RETURNING id INTO v_payout_id;
  
  -- Move amount from balance to pending_balance
  UPDATE creator_wallets
  SET 
    balance = balance - p_amount,
    pending_balance = pending_balance + p_amount,
    updated_at = NOW()
  WHERE id = p_wallet_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'payout_id', v_payout_id,
    'amount', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create wallet for community creators
CREATE OR REPLACE FUNCTION auto_create_creator_wallet()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_creator_wallet(NEW.creator_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_creator_wallet
  AFTER INSERT ON communities
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_creator_wallet();
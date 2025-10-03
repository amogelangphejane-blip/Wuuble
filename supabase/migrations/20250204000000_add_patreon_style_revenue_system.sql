-- Add Patreon-style revenue split and creator wallet system
-- Platform takes 30%, Creator gets 70%

-- Creator wallet balances
CREATE TABLE IF NOT EXISTS public.creator_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pending_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  lifetime_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, community_id)
);

-- Revenue transactions (tracks all money movement)
CREATE TABLE IF NOT EXISTS public.revenue_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.community_member_subscriptions(id) ON DELETE SET NULL,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'membership_payment',    -- New membership payment
    'platform_fee',         -- 30% platform fee deduction
    'creator_payout',       -- 70% creator earning
    'payout_request',       -- Creator requests withdrawal
    'payout_completed',     -- Payout sent to creator
    'refund',              -- Payment refunded
    'chargeback'           -- Payment disputed
  )),
  
  -- Amounts
  gross_amount DECIMAL(10,2) NOT NULL,           -- Total payment from patron
  platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0, -- 30% platform fee
  creator_amount DECIMAL(10,2) NOT NULL DEFAULT 0, -- 70% to creator
  net_amount DECIMAL(10,2) NOT NULL,             -- Amount after fees
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Payment details
  payment_method TEXT,
  card_brand TEXT,                                -- visa, mastercard, etc.
  card_last4 TEXT,
  stripe_payment_id TEXT,
  stripe_transfer_id TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payout requests
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.creator_wallets(id) ON DELETE CASCADE,
  
  -- Payout details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  method TEXT NOT NULL CHECK (method IN ('bank_transfer', 'paypal', 'stripe_transfer')),
  
  -- Bank details (encrypted in production)
  bank_account_holder TEXT,
  bank_account_number TEXT,
  bank_routing_number TEXT,
  paypal_email TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
  )),
  
  -- Tracking
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- External IDs
  stripe_transfer_id TEXT,
  paypal_payout_id TEXT,
  
  notes TEXT,
  failure_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Platform revenue tracking
CREATE TABLE IF NOT EXISTS public.platform_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.revenue_transactions(id) ON DELETE CASCADE,
  
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.community_member_subscriptions(id) ON DELETE SET NULL,
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Membership tiers (Patreon-style tiers)
CREATE TABLE IF NOT EXISTS public.membership_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  
  -- Tier details
  name TEXT NOT NULL,                             -- e.g., "Bronze Supporter", "Silver Patron", "Gold Member"
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  
  -- Benefits
  benefits JSONB DEFAULT '[]'::jsonb,            -- Array of benefits
  is_highlighted BOOLEAN DEFAULT false,           -- Feature this tier
  
  -- Limits
  max_members INTEGER,                            -- Limited spots
  current_members INTEGER DEFAULT 0,
  
  -- Display
  color TEXT,                                     -- Hex color for tier badge
  icon TEXT,                                      -- Icon name or emoji
  position INTEGER DEFAULT 0,                     -- Display order
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Stripe integration
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update subscriptions to reference tiers
ALTER TABLE public.community_member_subscriptions 
  ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES public.membership_tiers(id) ON DELETE SET NULL;

-- Card payment methods
CREATE TABLE IF NOT EXISTS public.saved_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Card details
  card_brand TEXT NOT NULL,                       -- visa, mastercard, amex, discover
  card_last4 TEXT NOT NULL,
  card_exp_month INTEGER NOT NULL,
  card_exp_year INTEGER NOT NULL,
  card_holder_name TEXT,
  
  -- Billing address
  billing_address JSONB,
  
  -- Stripe
  stripe_payment_method_id TEXT NOT NULL,
  stripe_customer_id TEXT,
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_creator_wallets_user_id ON public.creator_wallets(user_id);
CREATE INDEX idx_creator_wallets_community_id ON public.creator_wallets(community_id);
CREATE INDEX idx_revenue_transactions_subscription ON public.revenue_transactions(subscription_id);
CREATE INDEX idx_revenue_transactions_creator ON public.revenue_transactions(creator_id);
CREATE INDEX idx_revenue_transactions_type ON public.revenue_transactions(transaction_type);
CREATE INDEX idx_revenue_transactions_status ON public.revenue_transactions(status);
CREATE INDEX idx_payout_requests_creator ON public.payout_requests(creator_id);
CREATE INDEX idx_payout_requests_status ON public.payout_requests(status);
CREATE INDEX idx_membership_tiers_community ON public.membership_tiers(community_id);
CREATE INDEX idx_saved_payment_methods_user ON public.saved_payment_methods(user_id);

-- Enable RLS
ALTER TABLE public.creator_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creator_wallets
CREATE POLICY "Users can view their own wallets"
  ON public.creator_wallets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own wallets"
  ON public.creator_wallets FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for revenue_transactions
CREATE POLICY "Creators can view their transactions"
  ON public.revenue_transactions FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "System can manage transactions"
  ON public.revenue_transactions FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for payout_requests
CREATE POLICY "Users can view their payout requests"
  ON public.payout_requests FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Users can create payout requests"
  ON public.payout_requests FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- RLS Policies for membership_tiers
CREATE POLICY "Everyone can view active membership tiers"
  ON public.membership_tiers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Community creators can manage tiers"
  ON public.membership_tiers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.creator_id = auth.uid()
    )
  );

-- RLS Policies for saved_payment_methods
CREATE POLICY "Users can view their payment methods"
  ON public.saved_payment_methods FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their payment methods"
  ON public.saved_payment_methods FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_creator_wallets_updated_at
  BEFORE UPDATE ON public.creator_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_revenue_transactions_updated_at
  BEFORE UPDATE ON public.revenue_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payout_requests_updated_at
  BEFORE UPDATE ON public.payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_membership_tiers_updated_at
  BEFORE UPDATE ON public.membership_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to process membership payment with revenue split
CREATE OR REPLACE FUNCTION public.process_membership_payment(
  p_subscription_id UUID,
  p_gross_amount DECIMAL,
  p_payment_method TEXT,
  p_card_brand TEXT DEFAULT NULL,
  p_card_last4 TEXT DEFAULT NULL,
  p_stripe_payment_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_platform_fee DECIMAL;
  v_creator_amount DECIMAL;
  v_creator_id UUID;
  v_community_id UUID;
  v_wallet_id UUID;
BEGIN
  -- Get subscription details
  SELECT 
    cms.community_id,
    c.creator_id
  INTO v_community_id, v_creator_id
  FROM public.community_member_subscriptions cms
  JOIN public.communities c ON c.id = cms.community_id
  WHERE cms.id = p_subscription_id;

  -- Calculate splits (30% platform, 70% creator)
  v_platform_fee := ROUND(p_gross_amount * 0.30, 2);
  v_creator_amount := ROUND(p_gross_amount * 0.70, 2);

  -- Create revenue transaction
  INSERT INTO public.revenue_transactions (
    subscription_id,
    community_id,
    creator_id,
    transaction_type,
    gross_amount,
    platform_fee,
    creator_amount,
    net_amount,
    payment_method,
    card_brand,
    card_last4,
    stripe_payment_id,
    status,
    description
  ) VALUES (
    p_subscription_id,
    v_community_id,
    v_creator_id,
    'membership_payment',
    p_gross_amount,
    v_platform_fee,
    v_creator_amount,
    v_creator_amount,
    p_payment_method,
    p_card_brand,
    p_card_last4,
    p_stripe_payment_id,
    'completed',
    'Membership payment processed'
  ) RETURNING id INTO v_transaction_id;

  -- Record platform fee
  INSERT INTO public.platform_revenue (
    transaction_id,
    amount,
    fee_percentage,
    community_id,
    subscription_id,
    period_start,
    period_end
  ) VALUES (
    v_transaction_id,
    v_platform_fee,
    30.00,
    v_community_id,
    p_subscription_id,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 month'
  );

  -- Get or create creator wallet
  INSERT INTO public.creator_wallets (user_id, community_id, balance, pending_balance)
  VALUES (v_creator_id, v_community_id, 0, 0)
  ON CONFLICT (user_id, community_id) 
  DO NOTHING
  RETURNING id INTO v_wallet_id;

  IF v_wallet_id IS NULL THEN
    SELECT id INTO v_wallet_id 
    FROM public.creator_wallets 
    WHERE user_id = v_creator_id AND community_id = v_community_id;
  END IF;

  -- Add to creator's pending balance (holds for 7 days before available)
  UPDATE public.creator_wallets
  SET 
    pending_balance = pending_balance + v_creator_amount,
    lifetime_earnings = lifetime_earnings + v_creator_amount,
    updated_at = now()
  WHERE id = v_wallet_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release pending balance (call daily via cron)
CREATE OR REPLACE FUNCTION public.release_pending_balances()
RETURNS void AS $$
BEGIN
  -- Move pending balance to available balance after 7 days
  UPDATE public.creator_wallets
  SET 
    balance = balance + pending_balance,
    pending_balance = 0,
    updated_at = now()
  WHERE pending_balance > 0
  AND updated_at < now() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create payout request
CREATE OR REPLACE FUNCTION public.request_payout(
  p_creator_id UUID,
  p_amount DECIMAL,
  p_method TEXT,
  p_bank_details JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_wallet_id UUID;
  v_available_balance DECIMAL;
  v_payout_id UUID;
BEGIN
  -- Get wallet and check balance
  SELECT id, balance INTO v_wallet_id, v_available_balance
  FROM public.creator_wallets
  WHERE user_id = p_creator_id
  LIMIT 1;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_available_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Create payout request
  INSERT INTO public.payout_requests (
    creator_id,
    wallet_id,
    amount,
    method,
    bank_account_holder,
    bank_account_number,
    bank_routing_number,
    paypal_email,
    status
  ) VALUES (
    p_creator_id,
    v_wallet_id,
    p_amount,
    p_method,
    p_bank_details->>'account_holder',
    p_bank_details->>'account_number',
    p_bank_details->>'routing_number',
    p_bank_details->>'paypal_email',
    'pending'
  ) RETURNING id INTO v_payout_id;

  -- Deduct from available balance (reserve it)
  UPDATE public.creator_wallets
  SET balance = balance - p_amount
  WHERE id = v_wallet_id;

  RETURN v_payout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

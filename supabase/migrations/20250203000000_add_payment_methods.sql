-- Add payment methods support to the subscription system

-- Create payment methods table to store user's saved payment methods
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'paypal', 'bank_transfer', 'crypto')),
  display_name TEXT NOT NULL, -- User-friendly name like "Visa ****1234" or "PayPal Account"
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Card-specific fields
  card_last4 TEXT,
  card_brand TEXT, -- visa, mastercard, amex, etc.
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  
  -- PayPal-specific fields
  paypal_email TEXT,
  paypal_account_id TEXT,
  
  -- Bank transfer-specific fields
  bank_name TEXT,
  bank_account_last4 TEXT,
  bank_routing_number TEXT,
  bank_account_type TEXT CHECK (bank_account_type IN ('checking', 'savings')),
  bank_account_holder_name TEXT,
  
  -- External payment processor IDs
  stripe_payment_method_id TEXT,
  paypal_payment_method_id TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment method verification table for bank transfers
CREATE TABLE public.payment_method_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_method_id UUID NOT NULL REFERENCES public.payment_methods(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('micro_deposits', 'instant', 'manual')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'expired')),
  verification_code TEXT, -- For manual verification
  micro_deposit_amounts INTEGER[], -- For micro deposit verification
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update subscription_payments table to include payment method reference
ALTER TABLE public.subscription_payments 
ADD COLUMN payment_method_id UUID REFERENCES public.payment_methods(id),
ADD COLUMN payment_processor TEXT DEFAULT 'stripe' CHECK (payment_processor IN ('stripe', 'paypal', 'manual', 'crypto'));

-- Update community_member_subscriptions to track preferred payment method
ALTER TABLE public.community_member_subscriptions
ADD COLUMN preferred_payment_method_id UUID REFERENCES public.payment_methods(id),
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN paypal_subscription_id TEXT;

-- Create payment instructions table for manual payment methods
CREATE TABLE public.payment_instructions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('bank_transfer', 'crypto', 'other')),
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Bank transfer specific
  bank_name TEXT,
  account_name TEXT,
  account_number TEXT,
  routing_number TEXT,
  swift_code TEXT,
  iban TEXT,
  
  -- Crypto specific
  wallet_address TEXT,
  crypto_type TEXT, -- BTC, ETH, etc.
  network TEXT, -- mainnet, polygon, etc.
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_method_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_instructions ENABLE ROW LEVEL SECURITY;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_method_verifications_updated_at
  BEFORE UPDATE ON public.payment_method_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_instructions_updated_at
  BEFORE UPDATE ON public.payment_instructions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX idx_payment_methods_type ON public.payment_methods(type);
CREATE INDEX idx_payment_methods_default ON public.payment_methods(user_id, is_default) WHERE is_default = true;
CREATE INDEX idx_payment_method_verifications_payment_method ON public.payment_method_verifications(payment_method_id);
CREATE INDEX idx_payment_instructions_community ON public.payment_instructions(community_id);
CREATE INDEX idx_subscription_payments_payment_method ON public.subscription_payments(payment_method_id);

-- RLS Policies for payment methods
CREATE POLICY "Users can view their own payment methods" 
  ON public.payment_methods 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own payment methods" 
  ON public.payment_methods 
  FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for payment method verifications
CREATE POLICY "Users can view their own payment method verifications" 
  ON public.payment_method_verifications 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.payment_methods pm 
      WHERE pm.id = payment_method_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own payment method verifications" 
  ON public.payment_method_verifications 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.payment_methods pm 
      WHERE pm.id = payment_method_id AND pm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.payment_methods pm 
      WHERE pm.id = payment_method_id AND pm.user_id = auth.uid()
    )
  );

-- RLS Policies for payment instructions
CREATE POLICY "Users can view payment instructions for accessible communities" 
  ON public.payment_instructions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id 
      AND (NOT c.is_private OR c.creator_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM public.community_members cm WHERE cm.community_id = c.id AND cm.user_id = auth.uid()))
    )
  );

CREATE POLICY "Community creators can manage payment instructions" 
  ON public.payment_instructions 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.creator_id = auth.uid()
    )
  );

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Set all other payment methods for this user to non-default
    UPDATE public.payment_methods 
    SET is_default = false 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to ensure single default payment method
CREATE TRIGGER ensure_single_default_payment_method_trigger
  BEFORE INSERT OR UPDATE ON public.payment_methods
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.ensure_single_default_payment_method();

-- Function to get user's payment methods
CREATE OR REPLACE FUNCTION public.get_user_payment_methods(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  type TEXT,
  display_name TEXT,
  is_default BOOLEAN,
  is_active BOOLEAN,
  card_last4 TEXT,
  card_brand TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  paypal_email TEXT,
  bank_name TEXT,
  bank_account_last4 TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.id,
    pm.type,
    pm.display_name,
    pm.is_default,
    pm.is_active,
    pm.card_last4,
    pm.card_brand,
    pm.card_exp_month,
    pm.card_exp_year,
    pm.paypal_email,
    pm.bank_name,
    pm.bank_account_last4,
    pm.created_at
  FROM public.payment_methods pm
  WHERE pm.user_id = p_user_id AND pm.is_active = true
  ORDER BY pm.is_default DESC, pm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate payment method for subscription
CREATE OR REPLACE FUNCTION public.validate_payment_method_for_subscription(
  p_payment_method_id UUID,
  p_user_id UUID,
  p_amount DECIMAL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT,
  requires_verification BOOLEAN
) AS $$
DECLARE
  payment_method_rec RECORD;
  verification_rec RECORD;
BEGIN
  -- Get payment method details
  SELECT * INTO payment_method_rec 
  FROM public.payment_methods 
  WHERE id = p_payment_method_id AND user_id = p_user_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Payment method not found or inactive', false;
    RETURN;
  END IF;
  
  -- Check if payment method requires verification
  IF payment_method_rec.type = 'bank_transfer' THEN
    SELECT * INTO verification_rec 
    FROM public.payment_method_verifications 
    WHERE payment_method_id = p_payment_method_id 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF NOT FOUND THEN
      RETURN QUERY SELECT false, 'Bank transfer requires verification', true;
      RETURN;
    END IF;
    
    IF verification_rec.status != 'verified' THEN
      RETURN QUERY SELECT false, 'Bank transfer not verified', true;
      RETURN;
    END IF;
  END IF;
  
  -- Check card expiration
  IF payment_method_rec.type = 'card' THEN
    IF payment_method_rec.card_exp_year IS NOT NULL AND payment_method_rec.card_exp_month IS NOT NULL THEN
      IF (payment_method_rec.card_exp_year < EXTRACT(year FROM CURRENT_DATE)) OR 
         (payment_method_rec.card_exp_year = EXTRACT(year FROM CURRENT_DATE) AND 
          payment_method_rec.card_exp_month < EXTRACT(month FROM CURRENT_DATE)) THEN
        RETURN QUERY SELECT false, 'Card has expired', false;
        RETURN;
      END IF;
    END IF;
  END IF;
  
  -- All validations passed
  RETURN QUERY SELECT true, NULL::TEXT, false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
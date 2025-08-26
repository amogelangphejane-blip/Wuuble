-- Create coupons table for discount management
CREATE TABLE public.subscription_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE, -- Coupon code (e.g., 'SAVE20', 'WELCOME')
  name TEXT NOT NULL, -- Display name
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL, -- Percentage (0-100) or fixed amount
  currency TEXT DEFAULT 'USD',
  max_uses INTEGER, -- Maximum number of uses (null for unlimited)
  current_uses INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'first_payment', 'recurring')),
  minimum_amount DECIMAL(10,2), -- Minimum order amount to apply coupon
  is_active BOOLEAN NOT NULL DEFAULT true,
  stripe_coupon_id TEXT, -- Stripe coupon ID for integration
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coupon usage tracking table
CREATE TABLE public.coupon_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.subscription_coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.community_member_subscriptions(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coupon_id, user_id) -- Prevent multiple uses by same user
);

-- Add coupon fields to subscription plans
ALTER TABLE public.community_subscription_plans 
ADD COLUMN stripe_product_id TEXT,
ADD COLUMN stripe_price_monthly TEXT,
ADD COLUMN stripe_price_yearly TEXT;

-- Add coupon and Stripe fields to member subscriptions
ALTER TABLE public.community_member_subscriptions 
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN coupon_id UUID REFERENCES public.subscription_coupons(id),
ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.subscription_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_coupons_community_id ON public.subscription_coupons(community_id);
CREATE INDEX idx_coupons_code ON public.subscription_coupons(code);
CREATE INDEX idx_coupons_active ON public.subscription_coupons(is_active);
CREATE INDEX idx_coupons_valid_dates ON public.subscription_coupons(valid_from, valid_until);
CREATE INDEX idx_coupon_usage_coupon_id ON public.coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user_id ON public.coupon_usage(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.community_member_subscriptions(stripe_subscription_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.subscription_coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for coupons
CREATE POLICY "Users can view active coupons for communities they can access" 
  ON public.subscription_coupons 
  FOR SELECT 
  USING (
    is_active = true 
    AND (valid_until IS NULL OR valid_until > now())
    AND EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id 
      AND (NOT c.is_private OR c.creator_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM public.community_members cm WHERE cm.community_id = c.id AND cm.user_id = auth.uid()))
    )
  );

CREATE POLICY "Community creators can manage coupons" 
  ON public.subscription_coupons 
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

-- RLS Policies for coupon usage
CREATE POLICY "Users can view their own coupon usage" 
  ON public.coupon_usage 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create coupon usage records" 
  ON public.coupon_usage 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Community creators can view all coupon usage for their communities" 
  ON public.coupon_usage 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.subscription_coupons sc
      JOIN public.communities c ON c.id = sc.community_id
      WHERE sc.id = coupon_id AND c.creator_id = auth.uid()
    )
  );

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION public.validate_and_apply_coupon(
  p_coupon_code TEXT,
  p_user_id UUID,
  p_community_id UUID,
  p_subscription_amount DECIMAL
)
RETURNS TABLE (
  valid BOOLEAN,
  coupon_id UUID,
  discount_amount DECIMAL,
  error_message TEXT
) AS $$
DECLARE
  v_coupon public.subscription_coupons%ROWTYPE;
  v_discount_amount DECIMAL := 0;
  v_error TEXT := NULL;
BEGIN
  -- Find the coupon
  SELECT * INTO v_coupon
  FROM public.subscription_coupons
  WHERE code = UPPER(p_coupon_code)
    AND community_id = p_community_id
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until > now());

  -- Check if coupon exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Invalid or expired coupon code';
    RETURN;
  END IF;

  -- Check usage limits
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Coupon usage limit exceeded';
    RETURN;
  END IF;

  -- Check if user already used this coupon
  IF EXISTS (
    SELECT 1 FROM public.coupon_usage 
    WHERE coupon_id = v_coupon.id AND user_id = p_user_id
  ) THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Coupon already used by this user';
    RETURN;
  END IF;

  -- Check minimum amount
  IF v_coupon.minimum_amount IS NOT NULL AND p_subscription_amount < v_coupon.minimum_amount THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Minimum amount requirement not met';
    RETURN;
  END IF;

  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount_amount := (p_subscription_amount * v_coupon.discount_value / 100);
  ELSE -- fixed_amount
    v_discount_amount := v_coupon.discount_value;
  END IF;

  -- Ensure discount doesn't exceed subscription amount
  IF v_discount_amount > p_subscription_amount THEN
    v_discount_amount := p_subscription_amount;
  END IF;

  RETURN QUERY SELECT true, v_coupon.id, v_discount_amount, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record coupon usage
CREATE OR REPLACE FUNCTION public.record_coupon_usage(
  p_coupon_id UUID,
  p_user_id UUID,
  p_subscription_id UUID,
  p_discount_amount DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Insert usage record
  INSERT INTO public.coupon_usage (coupon_id, user_id, subscription_id, discount_amount)
  VALUES (p_coupon_id, p_user_id, p_subscription_id, p_discount_amount);

  -- Update coupon usage count
  UPDATE public.subscription_coupons
  SET current_uses = current_uses + 1
  WHERE id = p_coupon_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get coupon statistics
CREATE OR REPLACE FUNCTION public.get_coupon_stats(p_community_id UUID)
RETURNS TABLE (
  total_coupons INTEGER,
  active_coupons INTEGER,
  total_uses INTEGER,
  total_discount_given DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_coupons,
    COUNT(*) FILTER (WHERE is_active = true AND (valid_until IS NULL OR valid_until > now()))::INTEGER as active_coupons,
    COALESCE(SUM(current_uses), 0)::INTEGER as total_uses,
    COALESCE(SUM(cu.discount_amount), 0)::DECIMAL as total_discount_given
  FROM public.subscription_coupons sc
  LEFT JOIN public.coupon_usage cu ON cu.coupon_id = sc.id
  WHERE sc.community_id = p_community_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
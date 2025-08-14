-- Create community subscription plans table
CREATE TABLE public.community_subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Basic", "Premium", "VIP"
  description TEXT,
  price_monthly DECIMAL(10,2), -- Monthly price (can be null for free plans)
  price_yearly DECIMAL(10,2), -- Yearly price (can be null for free plans)
  trial_days INTEGER DEFAULT 0, -- Free trial period in days
  features JSONB DEFAULT '[]'::jsonb, -- Array of features included in this plan
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_members INTEGER, -- Maximum members allowed (null for unlimited)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create member subscriptions table
CREATE TABLE public.community_member_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.community_subscription_plans(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Create payment history table
CREATE TABLE public.subscription_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.community_member_subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT, -- e.g., 'card', 'paypal', 'bank_transfer'
  external_payment_id TEXT, -- ID from payment processor
  paid_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment reminders table
CREATE TABLE public.payment_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.community_member_subscriptions(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('upcoming', 'overdue', 'trial_ending')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.community_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_member_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.community_subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_member_subscriptions_updated_at
  BEFORE UPDATE ON public.community_member_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_subscription_plans_community_id ON public.community_subscription_plans(community_id);
CREATE INDEX idx_subscription_plans_active ON public.community_subscription_plans(is_active);
CREATE INDEX idx_member_subscriptions_community_user ON public.community_member_subscriptions(community_id, user_id);
CREATE INDEX idx_member_subscriptions_status ON public.community_member_subscriptions(status);
CREATE INDEX idx_member_subscriptions_period_end ON public.community_member_subscriptions(current_period_end);
CREATE INDEX idx_payments_subscription_id ON public.subscription_payments(subscription_id);
CREATE INDEX idx_payments_status ON public.subscription_payments(status);
CREATE INDEX idx_payment_reminders_subscription ON public.payment_reminders(subscription_id);

-- RLS Policies for subscription plans
CREATE POLICY "Users can view subscription plans for communities they can access" 
  ON public.community_subscription_plans 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id 
      AND (NOT c.is_private OR c.creator_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM public.community_members cm WHERE cm.community_id = c.id AND cm.user_id = auth.uid()))
    )
  );

CREATE POLICY "Community creators can manage subscription plans" 
  ON public.community_subscription_plans 
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

-- RLS Policies for member subscriptions
CREATE POLICY "Users can view their own subscriptions and community admins can view all" 
  ON public.community_member_subscriptions 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.creator_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_id AND cm.user_id = auth.uid() AND cm.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Users can manage their own subscriptions" 
  ON public.community_member_subscriptions 
  FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Community admins can manage member subscriptions" 
  ON public.community_member_subscriptions 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.creator_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_id AND cm.user_id = auth.uid() AND cm.role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.creator_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_id AND cm.user_id = auth.uid() AND cm.role IN ('admin', 'moderator')
    )
  );

-- RLS Policies for payments
CREATE POLICY "Users can view their own payment history and admins can view all" 
  ON public.subscription_payments 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.community_member_subscriptions s
      WHERE s.id = subscription_id AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.community_member_subscriptions s
      JOIN public.communities c ON c.id = s.community_id
      WHERE s.id = subscription_id AND c.creator_id = auth.uid()
    )
  );

CREATE POLICY "System can manage payments" 
  ON public.subscription_payments 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- RLS Policies for payment reminders
CREATE POLICY "Users can view their own reminders and admins can view all" 
  ON public.payment_reminders 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.community_member_subscriptions s
      WHERE s.id = subscription_id AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.community_member_subscriptions s
      JOIN public.communities c ON c.id = s.community_id
      WHERE s.id = subscription_id AND c.creator_id = auth.uid()
    )
  );

CREATE POLICY "System can manage reminders" 
  ON public.payment_reminders 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_community_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.community_member_subscriptions
    WHERE community_id = p_community_id 
    AND user_id = p_user_id 
    AND status IN ('trial', 'active')
    AND current_period_end > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's subscription status
CREATE OR REPLACE FUNCTION public.get_subscription_status(p_community_id UUID, p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_name TEXT,
  status TEXT,
  billing_cycle TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  is_trial BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    p.name,
    s.status,
    s.billing_cycle,
    s.current_period_end,
    s.trial_end,
    (s.trial_end IS NOT NULL AND s.trial_end > now()) as is_trial
  FROM public.community_member_subscriptions s
  JOIN public.community_subscription_plans p ON p.id = s.plan_id
  WHERE s.community_id = p_community_id AND s.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically expire subscriptions
CREATE OR REPLACE FUNCTION public.expire_overdue_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE public.community_member_subscriptions
  SET status = 'expired'
  WHERE status IN ('active', 'past_due')
  AND current_period_end < now() - INTERVAL '7 days'; -- Grace period of 7 days
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send payment reminders (to be called by cron job)
CREATE OR REPLACE FUNCTION public.create_payment_reminders()
RETURNS void AS $$
BEGIN
  -- Upcoming payment reminders (3 days before)
  INSERT INTO public.payment_reminders (subscription_id, reminder_type, due_date)
  SELECT 
    s.id,
    'upcoming',
    s.current_period_end
  FROM public.community_member_subscriptions s
  WHERE s.status = 'active'
  AND s.current_period_end BETWEEN now() + INTERVAL '2 days' AND now() + INTERVAL '4 days'
  AND NOT EXISTS (
    SELECT 1 FROM public.payment_reminders r
    WHERE r.subscription_id = s.id 
    AND r.reminder_type = 'upcoming'
    AND r.due_date = s.current_period_end
  );

  -- Overdue payment reminders
  INSERT INTO public.payment_reminders (subscription_id, reminder_type, due_date)
  SELECT 
    s.id,
    'overdue',
    s.current_period_end
  FROM public.community_member_subscriptions s
  WHERE s.status IN ('active', 'past_due')
  AND s.current_period_end < now()
  AND NOT EXISTS (
    SELECT 1 FROM public.payment_reminders r
    WHERE r.subscription_id = s.id 
    AND r.reminder_type = 'overdue'
    AND r.due_date = s.current_period_end
  );

  -- Trial ending reminders (2 days before trial ends)
  INSERT INTO public.payment_reminders (subscription_id, reminder_type, due_date)
  SELECT 
    s.id,
    'trial_ending',
    s.trial_end
  FROM public.community_member_subscriptions s
  WHERE s.status = 'trial'
  AND s.trial_end BETWEEN now() + INTERVAL '1 day' AND now() + INTERVAL '3 days'
  AND NOT EXISTS (
    SELECT 1 FROM public.payment_reminders r
    WHERE r.subscription_id = s.id 
    AND r.reminder_type = 'trial_ending'
    AND r.due_date = s.trial_end
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
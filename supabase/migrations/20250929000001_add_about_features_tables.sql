-- Create tables for About section features
-- This migration adds support for:
-- 1. User notification preferences
-- 2. User subscription management  
-- 3. Community exit surveys

-- User notification preferences table
CREATE TABLE public.user_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- General notification settings
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  
  -- Community activity notifications
  new_posts BOOLEAN DEFAULT true,
  new_comments BOOLEAN DEFAULT true,
  member_joins BOOLEAN DEFAULT false,
  likes_reactions BOOLEAN DEFAULT true,
  
  -- Event and achievement notifications
  event_reminders BOOLEAN DEFAULT true,
  achievements BOOLEAN DEFAULT true,
  
  -- Digest and marketing
  weekly_digest BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User subscriptions table (consolidated view)
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL DEFAULT 'free' CHECK (plan_name IN ('free', 'pro', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due')),
  amount INTEGER DEFAULT 0, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  interval TEXT DEFAULT 'month' CHECK (interval IN ('month', 'year')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- External service IDs
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one active subscription per user
  UNIQUE(user_id) DEFERRABLE INITIALLY DEFERRED
);

-- User payment methods view (using existing payment_methods table)
CREATE VIEW public.user_payment_methods AS
SELECT 
  id,
  user_id,
  CASE 
    WHEN type = 'card' THEN 'card'
    WHEN type = 'paypal' THEN 'paypal'
    ELSE 'bank_account'
  END as type,
  COALESCE(card_last4, bank_account_last4) as last_four,
  card_brand as brand,
  is_default,
  created_at
FROM public.payment_methods
WHERE is_active = true;

-- Community exit surveys table
CREATE TABLE public.community_exit_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Survey responses
  reason TEXT, -- Reason ID from predefined list
  feedback TEXT, -- Optional additional feedback
  data_retention_requested BOOLEAN DEFAULT false,
  
  -- Metadata
  left_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_exit_surveys ENABLE ROW LEVEL SECURITY;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_notification_preferences_updated_at
  BEFORE UPDATE ON public.user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_notification_preferences_user_id ON public.user_notification_preferences(user_id);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_community_exit_surveys_community_id ON public.community_exit_surveys(community_id);
CREATE INDEX idx_community_exit_surveys_user_id ON public.community_exit_surveys(user_id);

-- RLS Policies for user_notification_preferences
CREATE POLICY "Users can view their own notification preferences" 
  ON public.user_notification_preferences 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own notification preferences" 
  ON public.user_notification_preferences 
  FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
  ON public.user_subscriptions 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own subscriptions" 
  ON public.user_subscriptions 
  FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for community_exit_surveys
CREATE POLICY "Users can view their own exit surveys" 
  ON public.community_exit_surveys 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own exit surveys" 
  ON public.community_exit_surveys 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Community creators can view exit surveys for their communities" 
  ON public.community_exit_surveys 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.creator_id = auth.uid()
    )
  );

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_name TEXT,
  status TEXT,
  amount INTEGER,
  currency TEXT,
  interval TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    us.plan_name,
    us.status,
    us.amount,
    us.currency,
    us.interval,
    us.current_period_start,
    us.current_period_end,
    (us.status = 'active' AND us.current_period_end > now()) as is_active
  FROM public.user_subscriptions us
  WHERE us.user_id = p_user_id
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel user subscription
CREATE OR REPLACE FUNCTION public.cancel_user_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_record RECORD;
BEGIN
  -- Get the active subscription
  SELECT * INTO subscription_record 
  FROM public.user_subscriptions 
  WHERE user_id = p_user_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN false; -- No active subscription found
  END IF;
  
  -- Update subscription status
  UPDATE public.user_subscriptions 
  SET 
    status = 'cancelled',
    cancelled_at = now(),
    updated_at = now()
  WHERE id = subscription_record.id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update notification preferences
CREATE OR REPLACE FUNCTION public.update_notification_preferences(
  p_user_id UUID,
  p_preferences JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.user_notification_preferences (
    user_id,
    email_notifications,
    push_notifications,
    new_posts,
    new_comments,
    member_joins,
    likes_reactions,
    event_reminders,
    achievements,
    weekly_digest,
    marketing_emails,
    updated_at
  )
  VALUES (
    p_user_id,
    COALESCE((p_preferences->>'email_notifications')::boolean, true),
    COALESCE((p_preferences->>'push_notifications')::boolean, true),
    COALESCE((p_preferences->>'new_posts')::boolean, true),
    COALESCE((p_preferences->>'new_comments')::boolean, true),
    COALESCE((p_preferences->>'member_joins')::boolean, false),
    COALESCE((p_preferences->>'likes_reactions')::boolean, true),
    COALESCE((p_preferences->>'event_reminders')::boolean, true),
    COALESCE((p_preferences->>'achievements')::boolean, true),
    COALESCE((p_preferences->>'weekly_digest')::boolean, true),
    COALESCE((p_preferences->>'marketing_emails')::boolean, false),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email_notifications = COALESCE((p_preferences->>'email_notifications')::boolean, user_notification_preferences.email_notifications),
    push_notifications = COALESCE((p_preferences->>'push_notifications')::boolean, user_notification_preferences.push_notifications),
    new_posts = COALESCE((p_preferences->>'new_posts')::boolean, user_notification_preferences.new_posts),
    new_comments = COALESCE((p_preferences->>'new_comments')::boolean, user_notification_preferences.new_comments),
    member_joins = COALESCE((p_preferences->>'member_joins')::boolean, user_notification_preferences.member_joins),
    likes_reactions = COALESCE((p_preferences->>'likes_reactions')::boolean, user_notification_preferences.likes_reactions),
    event_reminders = COALESCE((p_preferences->>'event_reminders')::boolean, user_notification_preferences.event_reminders),
    achievements = COALESCE((p_preferences->>'achievements')::boolean, user_notification_preferences.achievements),
    weekly_digest = COALESCE((p_preferences->>'weekly_digest')::boolean, user_notification_preferences.weekly_digest),
    marketing_emails = COALESCE((p_preferences->>'marketing_emails')::boolean, user_notification_preferences.marketing_emails),
    updated_at = now();
    
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Fix for Subscription RLS Policy Issues
-- Run this SQL to ensure proper RLS policies for subscription functionality

-- First, let's check if the policies exist and fix any issues

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view subscription plans for communities they can access" ON public.community_subscription_plans;
DROP POLICY IF EXISTS "Community creators can manage subscription plans" ON public.community_subscription_plans;

-- Recreate subscription plans policies with better logic
CREATE POLICY "Users can view subscription plans for accessible communities" 
  ON public.community_subscription_plans 
  FOR SELECT 
  USING (
    -- Allow if community is public
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id 
      AND NOT c.is_private
    )
    OR
    -- Allow if user is community creator
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id 
      AND c.creator_id = auth.uid()
    )
    OR
    -- Allow if user is community member
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.communities c ON c.id = cm.community_id
      WHERE c.id = community_id 
      AND cm.user_id = auth.uid()
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

-- Fix member subscriptions policies
DROP POLICY IF EXISTS "Users can view their own subscriptions and community admins can view all" ON public.community_member_subscriptions;
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.community_member_subscriptions;
DROP POLICY IF EXISTS "Community admins can manage member subscriptions" ON public.community_member_subscriptions;

-- Recreate member subscription policies
CREATE POLICY "Users can view relevant subscriptions" 
  ON public.community_member_subscriptions 
  FOR SELECT 
  USING (
    -- Users can see their own subscriptions
    user_id = auth.uid() 
    OR
    -- Community creators can see all subscriptions in their communities
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.creator_id = auth.uid()
    )
    OR
    -- Community admins/moderators can see subscriptions in their communities
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_id 
      AND cm.user_id = auth.uid() 
      AND cm.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Users can create their own subscriptions" 
  ON public.community_member_subscriptions 
  FOR INSERT 
  WITH CHECK (
    user_id = auth.uid()
    AND
    -- Ensure the community exists and user has access
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id
      AND (
        NOT c.is_private 
        OR c.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.community_members cm
          WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
        )
      )
    )
    AND
    -- Ensure the plan exists and is active
    EXISTS (
      SELECT 1 FROM public.community_subscription_plans p
      WHERE p.id = plan_id AND p.is_active = true
    )
  );

CREATE POLICY "Users can update their own subscriptions" 
  ON public.community_member_subscriptions 
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Community creators can manage subscriptions in their communities" 
  ON public.community_member_subscriptions 
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

-- Fix payment policies to be more permissive for system operations
DROP POLICY IF EXISTS "Users can view their own payment history and admins can view all" ON public.subscription_payments;
DROP POLICY IF EXISTS "System can manage payments" ON public.subscription_payments;

CREATE POLICY "Users can view relevant payment history" 
  ON public.subscription_payments 
  FOR SELECT 
  USING (
    -- Users can see payments for their own subscriptions
    EXISTS (
      SELECT 1 FROM public.community_member_subscriptions s
      WHERE s.id = subscription_id AND s.user_id = auth.uid()
    )
    OR
    -- Community creators can see payments for subscriptions in their communities
    EXISTS (
      SELECT 1 FROM public.community_member_subscriptions s
      JOIN public.communities c ON c.id = s.community_id
      WHERE s.id = subscription_id AND c.creator_id = auth.uid()
    )
  );

CREATE POLICY "System and users can manage payments" 
  ON public.subscription_payments 
  FOR ALL 
  USING (
    -- Allow if it's for user's own subscription
    EXISTS (
      SELECT 1 FROM public.community_member_subscriptions s
      WHERE s.id = subscription_id AND s.user_id = auth.uid()
    )
    OR
    -- Allow if user is community creator
    EXISTS (
      SELECT 1 FROM public.community_member_subscriptions s
      JOIN public.communities c ON c.id = s.community_id
      WHERE s.id = subscription_id AND c.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Same check for inserts/updates
    EXISTS (
      SELECT 1 FROM public.community_member_subscriptions s
      WHERE s.id = subscription_id AND s.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.community_member_subscriptions s
      JOIN public.communities c ON c.id = s.community_id
      WHERE s.id = subscription_id AND c.creator_id = auth.uid()
    )
  );

-- Ensure payment reminders have proper policies
DROP POLICY IF EXISTS "Users can view their own reminders and admins can view all" ON public.payment_reminders;
DROP POLICY IF EXISTS "System can manage reminders" ON public.payment_reminders;

CREATE POLICY "Users can view relevant reminders" 
  ON public.payment_reminders 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.community_member_subscriptions s
      WHERE s.id = subscription_id AND s.user_id = auth.uid()
    )
    OR
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

-- Add a function to help debug RLS issues
CREATE OR REPLACE FUNCTION public.debug_subscription_access(p_community_id UUID)
RETURNS TABLE (
  user_id UUID,
  is_creator BOOLEAN,
  is_member BOOLEAN,
  community_private BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid(),
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = p_community_id AND c.creator_id = auth.uid()
    ) as is_creator,
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = p_community_id AND cm.user_id = auth.uid()
    ) as is_member,
    (SELECT is_private FROM public.communities WHERE id = p_community_id) as community_private;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.debug_subscription_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_status TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "Community creators can manage subscription plans" ON public.community_subscription_plans 
IS 'Allows community creators to create, update, and delete subscription plans for their communities';

COMMENT ON POLICY "Users can create their own subscriptions" ON public.community_member_subscriptions 
IS 'Allows authenticated users to subscribe to plans in communities they have access to';

COMMENT ON FUNCTION public.debug_subscription_access 
IS 'Debug function to check user access permissions for a community';
-- Fix member count issues in community feature
-- Create missing RPC function and fix member count tracking

-- Create the missing increment_community_member_count RPC function
CREATE OR REPLACE FUNCTION public.increment_community_member_count(community_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.communities 
  SET member_count = member_count + 1 
  WHERE id = community_id;
END;
$$;

-- Create decrement function as well for consistency
CREATE OR REPLACE FUNCTION public.decrement_community_member_count(community_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.communities 
  SET member_count = GREATEST(member_count - 1, 0)
  WHERE id = community_id;
END;
$$;

-- Fix the existing member count update function to handle edge cases
CREATE OR REPLACE FUNCTION public.update_community_member_count()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities 
    SET member_count = member_count + 1 
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities 
    SET member_count = GREATEST(member_count - 1, 0)
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Recalculate member counts for all communities to fix any inconsistencies
UPDATE public.communities 
SET member_count = (
  SELECT COUNT(*) 
  FROM public.community_members 
  WHERE community_id = communities.id
);

-- Create function to get accurate participant count for group calls
CREATE OR REPLACE FUNCTION public.get_active_call_participants(call_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  participant_count integer;
BEGIN
  SELECT COUNT(*) INTO participant_count
  FROM public.community_group_call_participants 
  WHERE call_id = get_active_call_participants.call_id 
    AND left_at IS NULL;
  
  RETURN COALESCE(participant_count, 0);
END;
$$;

-- Update current_participants for all active calls to fix inconsistencies
UPDATE public.community_group_calls 
SET current_participants = (
  SELECT COUNT(*) 
  FROM public.community_group_call_participants 
  WHERE call_id = community_group_calls.id 
    AND left_at IS NULL
)
WHERE status = 'active';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.increment_community_member_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_community_member_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_call_participants(uuid) TO authenticated;
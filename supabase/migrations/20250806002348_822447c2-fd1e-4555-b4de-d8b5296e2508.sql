-- Fix infinite recursion by using security definer functions
-- Drop the current problematic policies
DROP POLICY IF EXISTS "Users can view accessible communities" ON public.communities;
DROP POLICY IF EXISTS "Users can view community members" ON public.community_members;

-- Create security definer functions to break recursion
CREATE OR REPLACE FUNCTION public.user_can_view_community(community_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_members.community_id = $1 
    AND community_members.user_id = $2
  );
$$;

CREATE OR REPLACE FUNCTION public.community_is_public(community_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT NOT is_private FROM public.communities WHERE id = $1;
$$;

CREATE OR REPLACE FUNCTION public.user_created_community(community_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT creator_id = $2 FROM public.communities WHERE id = $1;
$$;

-- Create new non-recursive policies using security definer functions
CREATE POLICY "Users can view accessible communities" 
ON public.communities 
FOR SELECT 
USING (
  NOT is_private 
  OR creator_id = auth.uid() 
  OR public.user_can_view_community(id, auth.uid())
);

CREATE POLICY "Users can view community members" 
ON public.community_members 
FOR SELECT 
USING (
  public.community_is_public(community_id)
  OR public.user_created_community(community_id, auth.uid())
  OR user_id = auth.uid()
  OR public.user_can_view_community(community_id, auth.uid())
);
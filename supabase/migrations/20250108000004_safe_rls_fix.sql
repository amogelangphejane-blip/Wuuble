-- Safe RLS Policy Fix - Handles existing policies more thoroughly
-- This migration addresses infinite recursion and policy conflicts

-- Drop ALL possible existing policies with various naming patterns
-- Communities table policies
DROP POLICY IF EXISTS "Users can view accessible communities" ON public.communities;
DROP POLICY IF EXISTS "Users can view public communities" ON public.communities;
DROP POLICY IF EXISTS "Communities: Public access and member access" ON public.communities;
DROP POLICY IF EXISTS "Communities: Creators can manage" ON public.communities;
DROP POLICY IF EXISTS "Users can create communities" ON public.communities;
DROP POLICY IF EXISTS "Users can update their own communities" ON public.communities;
DROP POLICY IF EXISTS "Users can delete their own communities" ON public.communities;

-- Community members table policies
DROP POLICY IF EXISTS "Users can view community members" ON public.community_members;
DROP POLICY IF EXISTS "Users can view community members they have access to" ON public.community_members;
DROP POLICY IF EXISTS "Community members: View based on community access" ON public.community_members;
DROP POLICY IF EXISTS "Community members: Join communities" ON public.community_members;
DROP POLICY IF EXISTS "Community members: Leave communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;

-- Community posts table policies
DROP POLICY IF EXISTS "Users can view posts in accessible communities" ON public.community_posts;
DROP POLICY IF EXISTS "Users can view posts in communities they have access to" ON public.community_posts;
DROP POLICY IF EXISTS "Community posts: View based on community access" ON public.community_posts;
DROP POLICY IF EXISTS "Users can create posts in communities they belong to" ON public.community_posts;
DROP POLICY IF EXISTS "Community posts: Create in accessible communities" ON public.community_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Community posts: Update own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can delete their own posts or community admins can delete posts" ON public.community_posts;
DROP POLICY IF EXISTS "Community posts: Delete own posts or admin delete" ON public.community_posts;

-- Drop helper functions that may cause recursion
DROP FUNCTION IF EXISTS public.user_can_view_community(uuid, uuid);
DROP FUNCTION IF EXISTS public.community_is_public(uuid);
DROP FUNCTION IF EXISTS public.user_created_community(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_community_member(uuid, uuid);

-- Create simple, non-recursive helper function
CREATE OR REPLACE FUNCTION public.is_community_member(community_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members 
    WHERE community_members.community_id = $1 
    AND community_members.user_id = $2
  );
$$;

-- Create non-recursive policies for communities table
CREATE POLICY "Communities_view_policy" 
ON public.communities 
FOR SELECT 
USING (
  -- Public communities are viewable by everyone
  NOT is_private 
  -- Community creators can always view their communities
  OR creator_id = auth.uid() 
  -- Members can view private communities they belong to
  OR (
    is_private 
    AND public.is_community_member(id, auth.uid())
  )
);

CREATE POLICY "Communities_manage_policy" 
ON public.communities 
FOR ALL 
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

-- Create non-recursive policies for community_members table
CREATE POLICY "Community_members_view_policy" 
ON public.community_members 
FOR SELECT 
USING (
  -- Can view members of public communities
  EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_id 
    AND NOT communities.is_private
  )
  -- Can view members if user created the community
  OR EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_id 
    AND communities.creator_id = auth.uid()
  )
  -- Can always view own membership record
  OR user_id = auth.uid()
  -- Can view other members if user is also a member (non-recursive check)
  OR public.is_community_member(community_id, auth.uid())
);

CREATE POLICY "Community_members_join_policy" 
ON public.community_members 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Can join public communities
    EXISTS (
      SELECT 1 FROM communities 
      WHERE communities.id = community_id 
      AND NOT communities.is_private
    )
    -- Community creators can add members to their communities
    OR EXISTS (
      SELECT 1 FROM communities 
      WHERE communities.id = community_id 
      AND communities.creator_id = auth.uid()
    )
  )
);

CREATE POLICY "Community_members_leave_policy" 
ON public.community_members 
FOR DELETE 
USING (
  user_id = auth.uid()
  -- Community creators can remove members
  OR EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_id 
    AND communities.creator_id = auth.uid()
  )
);

-- Create policies for community_posts table (if it exists)
CREATE POLICY "Community_posts_view_policy" 
ON public.community_posts 
FOR SELECT 
USING (
  -- Can view posts in public communities
  EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_id 
    AND NOT communities.is_private
  )
  -- Can view posts if user created the community
  OR EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_id 
    AND communities.creator_id = auth.uid()
  )
  -- Can view posts if user is a member
  OR public.is_community_member(community_id, auth.uid())
);

CREATE POLICY "Community_posts_create_policy" 
ON public.community_posts 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Can post in public communities
    EXISTS (
      SELECT 1 FROM communities 
      WHERE communities.id = community_id 
      AND NOT communities.is_private
    )
    -- Can post if user created the community
    OR EXISTS (
      SELECT 1 FROM communities 
      WHERE communities.id = community_id 
      AND communities.creator_id = auth.uid()
    )
    -- Can post if user is a member
    OR public.is_community_member(community_id, auth.uid())
  )
);

CREATE POLICY "Community_posts_update_policy" 
ON public.community_posts 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Community_posts_delete_policy" 
ON public.community_posts 
FOR DELETE 
USING (
  user_id = auth.uid()
  -- Community creators can delete any post in their community
  OR EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_id 
    AND communities.creator_id = auth.uid()
  )
);

-- Ensure RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
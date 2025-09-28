-- Fix RLS policy infinite recursion issue
-- This migration fixes the recursive policy problem that prevents communities from loading

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view public communities" ON public.communities;
DROP POLICY IF EXISTS "Users can create communities" ON public.communities;
DROP POLICY IF EXISTS "Community creators can update their communities" ON public.communities;
DROP POLICY IF EXISTS "Community creators can delete their communities" ON public.communities;

-- Create simple, non-recursive RLS policies

-- 1. SELECT policy: Users can view public communities or ones they own/are members of
CREATE POLICY "Enable read for public communities and members"
ON public.communities
FOR SELECT
USING (
  -- Public communities are visible to everyone
  NOT is_private
  OR 
  -- Private communities are visible to owners
  creator_id = auth.uid()
  OR 
  owner_id = auth.uid()
  OR
  -- Private communities are visible to members
  EXISTS (
    SELECT 1 
    FROM public.community_members 
    WHERE community_id = communities.id 
    AND user_id = auth.uid()
  )
);

-- 2. INSERT policy: Users can create communities (simple check)
CREATE POLICY "Enable insert for authenticated users"
ON public.communities
FOR INSERT
WITH CHECK (
  -- Must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- Must be creating as themselves
  creator_id = auth.uid()
  AND
  owner_id = auth.uid()
);

-- 3. UPDATE policy: Only owners can update their communities
CREATE POLICY "Enable update for owners"
ON public.communities
FOR UPDATE
USING (
  creator_id = auth.uid() OR owner_id = auth.uid()
)
WITH CHECK (
  creator_id = auth.uid() OR owner_id = auth.uid()
);

-- 4. DELETE policy: Only owners can delete their communities
CREATE POLICY "Enable delete for owners"
ON public.communities
FOR DELETE
USING (
  creator_id = auth.uid() OR owner_id = auth.uid()
);

-- Fix community_members table policies as well
DROP POLICY IF EXISTS "Users can view community members they have access to" ON public.community_members;
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can leave communities or admins can remove members" ON public.community_members;

CREATE POLICY "Enable read for community members"
ON public.community_members
FOR SELECT
USING (
  -- Can see members of communities you're part of
  EXISTS (
    SELECT 1 
    FROM public.communities 
    WHERE id = community_id 
    AND (
      NOT is_private 
      OR creator_id = auth.uid() 
      OR owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 
        FROM public.community_members cm 
        WHERE cm.community_id = community_id 
        AND cm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Enable insert for authenticated users joining communities"
ON public.community_members
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

CREATE POLICY "Enable delete for self and community owners"
ON public.community_members
FOR DELETE
USING (
  -- Users can leave (delete their own membership)
  user_id = auth.uid()
  OR
  -- Community owners can remove members
  EXISTS (
    SELECT 1 
    FROM public.communities 
    WHERE id = community_id 
    AND (creator_id = auth.uid() OR owner_id = auth.uid())
  )
);

CREATE POLICY "Enable update for community owners"
ON public.community_members
FOR UPDATE
USING (
  -- Community owners can update member roles
  EXISTS (
    SELECT 1 
    FROM public.communities 
    WHERE id = community_id 
    AND (creator_id = auth.uid() OR owner_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.communities 
    WHERE id = community_id 
    AND (creator_id = auth.uid() OR owner_id = auth.uid())
  )
);
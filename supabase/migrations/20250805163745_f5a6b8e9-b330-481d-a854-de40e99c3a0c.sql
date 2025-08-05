-- Fix infinite recursion in RLS policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view public communities" ON public.communities;
DROP POLICY IF EXISTS "Users can view community members they have access to" ON public.community_members;

-- Create corrected policies for communities table
CREATE POLICY "Users can view public communities" 
ON public.communities 
FOR SELECT 
USING (
  (NOT is_private) 
  OR (creator_id = auth.uid()) 
  OR (EXISTS ( 
    SELECT 1
    FROM community_members
    WHERE community_members.community_id = communities.id 
    AND community_members.user_id = auth.uid()
  ))
);

-- Create corrected policy for community_members table
CREATE POLICY "Users can view community members they have access to" 
ON public.community_members 
FOR SELECT 
USING (
  EXISTS ( 
    SELECT 1
    FROM communities
    WHERE communities.id = community_members.community_id 
    AND (
      (NOT communities.is_private) 
      OR (communities.creator_id = auth.uid()) 
      OR (auth.uid() = community_members.user_id)
    )
  )
);
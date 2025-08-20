-- Fix community_members table to add status field
-- This addresses RLS policy violations in live_streams table

-- Add status column to community_members table
ALTER TABLE public.community_members 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved' 
CHECK (status IN ('pending', 'approved', 'rejected', 'banned'));

-- Update existing members to have 'approved' status
UPDATE public.community_members 
SET status = 'approved' 
WHERE status IS NULL OR status = '';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_community_members_status ON public.community_members(status);

-- Update RLS policies to be more permissive during the transition
-- Allow users to view community members regardless of status for now
DROP POLICY IF EXISTS "Users can view community members they have access to" ON public.community_members;
CREATE POLICY "Users can view community members they have access to" 
  ON public.community_members 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.communities 
      WHERE id = community_id 
      AND (NOT is_private OR creator_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM public.community_members cm WHERE cm.community_id = id AND cm.user_id = auth.uid()))
    )
  );

-- Allow users to join communities with approved status by default
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
CREATE POLICY "Users can join communities" 
  ON public.community_members 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND status = 'approved');

-- Add policy for community admins to manage member status
CREATE POLICY "Community admins can manage member status" 
  ON public.community_members 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members 
      WHERE community_id = community_members.community_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    ) OR 
    auth.uid() = user_id  -- Users can update their own membership
  );
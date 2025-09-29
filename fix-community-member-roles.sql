-- Fix Community Member Roles
-- Add 'owner' role to the CHECK constraint and update existing data

-- First, remove the old constraint
ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS community_members_role_check;

-- Add the new constraint that includes 'owner'
ALTER TABLE public.community_members ADD CONSTRAINT community_members_role_check 
  CHECK (role IN ('owner', 'admin', 'moderator', 'member'));

-- Update any existing 'admin' roles for community creators to 'owner'
UPDATE public.community_members 
SET role = 'owner'
WHERE role = 'admin' 
  AND user_id IN (
    SELECT creator_id 
    FROM public.communities 
    WHERE id = community_members.community_id
  );
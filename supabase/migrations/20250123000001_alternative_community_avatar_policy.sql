-- Alternative fix: Allow community members (not just creators) to upload avatars
-- This provides more flexibility while maintaining security

-- Drop the existing policy
DROP POLICY IF EXISTS "Authenticated users can upload community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Community creators can upload community avatars" ON storage.objects;

-- Create a policy that allows community members to upload avatars
-- This is more flexible than requiring creator ownership
CREATE POLICY "Community members can upload community avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'communities'
  AND (storage.foldername(name))[2] IS NOT NULL
  AND (
    -- Either the user is the community creator
    EXISTS (
      SELECT 1 FROM public.communities 
      WHERE id = (storage.foldername(name))[2]::uuid 
      AND creator_id = auth.uid()
    )
    OR
    -- Or the user is a member of the community
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.communities c ON c.id = cm.community_id
      WHERE c.id = (storage.foldername(name))[2]::uuid 
      AND cm.user_id = auth.uid()
    )
  )
);
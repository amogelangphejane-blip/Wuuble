-- Fix community avatar upload permissions to ensure consistent security
-- The issue is that the INSERT policy was too permissive compared to UPDATE/DELETE policies

-- Drop the existing inconsistent policy
DROP POLICY IF EXISTS "Authenticated users can upload community avatars" ON storage.objects;

-- Create a consistent policy that requires community ownership for uploads
-- This matches the existing UPDATE and DELETE policies
CREATE POLICY "Community creators can upload community avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'communities'
  AND (storage.foldername(name))[2] IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = (storage.foldername(name))[2]::uuid 
    AND creator_id = auth.uid()
  )
);

-- Ensure the SELECT policy exists for public viewing
CREATE POLICY IF NOT EXISTS "Community avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-avatars');
-- Fix community avatar upload policy to allow temp uploads
-- This solves the "new row violates row-level security policy" error

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can upload community avatars" ON storage.objects;

-- Create a more permissive policy that allows both communities/ and temp/ uploads
CREATE POLICY "Authenticated users can upload community avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-avatars' 
  AND auth.role() = 'authenticated'
  AND (
    (storage.foldername(name))[1] = 'communities'  -- For existing communities
    OR (storage.foldername(name))[1] = 'temp'      -- For temp uploads
  )
);

-- Verify the policy was updated
SELECT 
  policyname, 
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname = 'Authenticated users can upload community avatars';
-- Setup Community Avatars Storage Bucket
-- Run this script in your Supabase SQL Editor if the storage bucket is missing

-- Step 1: Create the storage bucket (if it doesn't exist)
-- Note: This might fail if the bucket already exists, which is fine
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'community-avatars',
    'community-avatars',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Step 2: Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Community avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Community creators can update their community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Community creators can delete their community avatars" ON storage.objects;

-- Step 3: Create policy for public viewing
CREATE POLICY "Community avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-avatars');

-- Step 4: Create policy for authenticated uploads
CREATE POLICY "Authenticated users can upload community avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'communities'
);

-- Step 5: Create policy for community creators to update
CREATE POLICY "Community creators can update their community avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'community-avatars'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = (storage.foldername(name))[2]::uuid 
    AND creator_id = auth.uid()
  )
);

-- Step 6: Create policy for community creators to delete
CREATE POLICY "Community creators can delete their community avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'community-avatars'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = (storage.foldername(name))[2]::uuid 
    AND creator_id = auth.uid()
  )
);

-- Step 7: Verify the setup
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'community-avatars';

-- Expected output:
-- id: community-avatars
-- name: community-avatars
-- public: true
-- file_size_limit: 5242880
-- allowed_mime_types: {image/jpeg,image/png,image/webp,image/gif}

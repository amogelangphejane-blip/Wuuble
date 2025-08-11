-- Fix storage policies for avatar uploads
-- This script applies the missing Row Level Security policies

-- Enable RLS on storage.objects (should already be enabled but let's be sure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILE PICTURES POLICIES
-- ============================================================================

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;

-- Policy to allow users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow anyone to view profile pictures (public read)
CREATE POLICY "Anyone can view profile pictures" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-pictures');

-- ============================================================================
-- COMMUNITY AVATARS POLICIES
-- ============================================================================

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Community avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Community creators can update their community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Community creators can delete their community avatars" ON storage.objects;

-- Policy for public viewing of community avatars
CREATE POLICY "Community avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-avatars');

-- Policy to allow authenticated users to upload community avatars
CREATE POLICY "Authenticated users can upload community avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'communities'
);

-- Policy to allow community creators to update their community avatars
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

-- Policy to allow community creators to delete their community avatars
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

-- ============================================================================
-- ADDITIONAL HELPFUL POLICIES (More Permissive for Testing)
-- ============================================================================

-- Temporary policy to allow any authenticated user to upload to temp folders
-- This helps with testing and troubleshooting
CREATE POLICY "Authenticated users can upload to temp folders" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id IN ('profile-pictures', 'community-avatars')
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'temp'
);

-- Policy to allow users to manage temp files
CREATE POLICY "Users can manage temp files" ON storage.objects
FOR ALL USING (
  bucket_id IN ('profile-pictures', 'community-avatars')
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'temp'
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%profile%' OR policyname LIKE '%community%' OR policyname LIKE '%avatar%'
ORDER BY policyname;
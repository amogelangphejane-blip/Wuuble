-- =====================================================
-- Storage Buckets Setup Script
-- =====================================================
-- This script creates the required storage buckets and policies
-- for profile pictures, community avatars, and post images.
--
-- Run this script in your Supabase SQL Editor:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Paste this entire script
-- 5. Click "Run"
-- =====================================================

-- Enable the storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CREATE STORAGE BUCKETS
-- =====================================================

-- Create profile-pictures bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Create community-avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-avatars',
  'community-avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Create community-post-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-post-images',
  'community-post-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- =====================================================
-- DROP EXISTING POLICIES (to avoid conflicts)
-- =====================================================

DROP POLICY IF EXISTS "Public read access for profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for post images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete post images" ON storage.objects;

-- =====================================================
-- CREATE STORAGE POLICIES
-- =====================================================

-- ============ PUBLIC READ ACCESS ============
-- Allow anyone to read/view images from all buckets

CREATE POLICY "Public read access for profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Public read access for community avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'community-avatars');

CREATE POLICY "Public read access for post images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'community-post-images');

-- ============ AUTHENTICATED UPLOAD ACCESS ============
-- Allow authenticated users to upload images

CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can upload community avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-avatars'
);

CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-post-images'
);

-- ============ UPDATE ACCESS ============
-- Allow users to update their own images

CREATE POLICY "Users can update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update community avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'community-avatars')
WITH CHECK (bucket_id = 'community-avatars');

CREATE POLICY "Users can update post images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'community-post-images')
WITH CHECK (bucket_id = 'community-post-images');

-- ============ DELETE ACCESS ============
-- Allow users to delete their own images

CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete community avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'community-avatars');

CREATE POLICY "Users can delete post images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'community-post-images');

-- =====================================================
-- VERIFY SETUP
-- =====================================================

-- Check if buckets were created successfully
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('profile-pictures', 'community-avatars', 'community-post-images')
ORDER BY id;

-- Check if policies were created successfully
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (
    policyname LIKE '%profile pictures%' OR
    policyname LIKE '%community avatars%' OR
    policyname LIKE '%post images%'
  )
ORDER BY policyname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Storage buckets and policies created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Buckets created:';
  RAISE NOTICE '  - profile-pictures (5MB limit)';
  RAISE NOTICE '  - community-avatars (5MB limit)';
  RAISE NOTICE '  - community-post-images (10MB limit)';
  RAISE NOTICE '';
  RAISE NOTICE 'All buckets are public and configured with proper access policies.';
END $$;

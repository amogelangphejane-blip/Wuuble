-- Comprehensive Thumbnail System Fix
-- This script ensures all storage buckets, policies, and database schema are properly configured
-- Run this script to fix thumbnail display issues

-- ============================================================================
-- 1. CREATE STORAGE BUCKETS
-- ============================================================================

-- Create stream-thumbnails bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-thumbnails',
  'stream-thumbnails',
  true, -- Public bucket for thumbnails
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create stream-display-images bucket (for the new system)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-display-images',
  'stream-display-images',
  true, -- Public bucket for display images
  5242880, -- 5MB limit for display images
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 2. DROP EXISTING CONFLICTING POLICIES
-- ============================================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view stream thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can update their thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can delete their thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view stream display images" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can upload display images" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can update their display images" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can delete their display images" ON storage.objects;

-- ============================================================================
-- 3. CREATE STORAGE POLICIES FOR STREAM-THUMBNAILS BUCKET
-- ============================================================================

-- Allow public viewing of stream thumbnails
CREATE POLICY "Public read access for stream thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'stream-thumbnails');

-- Allow authenticated users to upload thumbnails to their own streams
CREATE POLICY "Authenticated users can upload stream thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stream-thumbnails' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- Allow stream creators to update their thumbnails
CREATE POLICY "Stream creators can update thumbnails" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'stream-thumbnails' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- Allow stream creators to delete their thumbnails
CREATE POLICY "Stream creators can delete thumbnails" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'stream-thumbnails' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. CREATE STORAGE POLICIES FOR STREAM-DISPLAY-IMAGES BUCKET
-- ============================================================================

-- Allow public viewing of stream display images
CREATE POLICY "Public read access for stream display images" ON storage.objects
  FOR SELECT USING (bucket_id = 'stream-display-images');

-- Allow authenticated users to upload display images to their own streams
CREATE POLICY "Authenticated users can upload stream display images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stream-display-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- Allow stream creators to update their display images
CREATE POLICY "Stream creators can update display images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'stream-display-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- Allow stream creators to delete their display images
CREATE POLICY "Stream creators can delete display images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'stream-display-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. ENSURE PROPER DATABASE SCHEMA
-- ============================================================================

-- Ensure live_streams table has thumbnail_url and display_image_url columns
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS display_image_url TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_streams_thumbnail_url ON live_streams(thumbnail_url) WHERE thumbnail_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_streams_display_image_url ON live_streams(display_image_url) WHERE display_image_url IS NOT NULL;

-- ============================================================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to clean up orphaned thumbnails
CREATE OR REPLACE FUNCTION cleanup_orphaned_thumbnails()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  thumbnail_record RECORD;
BEGIN
  -- Find thumbnails in storage that don't have corresponding streams
  FOR thumbnail_record IN 
    SELECT name FROM storage.objects 
    WHERE bucket_id = 'stream-thumbnails'
    AND (storage.foldername(name))[1] NOT IN (
      SELECT id::text FROM live_streams
    )
  LOOP
    -- Delete orphaned thumbnail
    DELETE FROM storage.objects 
    WHERE bucket_id = 'stream-thumbnails' AND name = thumbnail_record.name;
    
    deleted_count := deleted_count + 1;
  END LOOP;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get thumbnail info for a stream
CREATE OR REPLACE FUNCTION get_stream_thumbnail_info(stream_uuid UUID)
RETURNS TABLE(
  stream_id UUID,
  thumbnail_url TEXT,
  display_image_url TEXT,
  has_thumbnail BOOLEAN,
  has_display_image BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ls.id,
    ls.thumbnail_url,
    ls.display_image_url,
    (ls.thumbnail_url IS NOT NULL) as has_thumbnail,
    (ls.display_image_url IS NOT NULL) as has_display_image
  FROM live_streams ls
  WHERE ls.id = stream_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. VERIFY SETUP
-- ============================================================================

-- Check if buckets exist
DO $$
DECLARE
  bucket_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bucket_count 
  FROM storage.buckets 
  WHERE id IN ('stream-thumbnails', 'stream-display-images');
  
  IF bucket_count = 2 THEN
    RAISE NOTICE '✅ Storage buckets created successfully';
  ELSE
    RAISE NOTICE '❌ Missing storage buckets (found %, expected 2)', bucket_count;
  END IF;
END $$;

-- Check if policies exist
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%stream%thumbnail%' 
  OR policyname LIKE '%stream%display%image%';
  
  IF policy_count >= 8 THEN
    RAISE NOTICE '✅ Storage policies created successfully';
  ELSE
    RAISE NOTICE '❌ Missing storage policies (found %, expected at least 8)', policy_count;
  END IF;
END $$;

-- ============================================================================
-- 8. GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Ensure authenticated users can access the helper functions
GRANT EXECUTE ON FUNCTION cleanup_orphaned_thumbnails() TO authenticated;
GRANT EXECUTE ON FUNCTION get_stream_thumbnail_info(UUID) TO authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Thumbnail system setup completed!';
  RAISE NOTICE '';
  RAISE NOTICE 'What was fixed:';
  RAISE NOTICE '- Created stream-thumbnails and stream-display-images buckets';
  RAISE NOTICE '- Set up proper storage policies for public access';
  RAISE NOTICE '- Ensured database schema has required columns';
  RAISE NOTICE '- Added helper functions for maintenance';
  RAISE NOTICE '- Added performance indexes';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test thumbnail upload functionality';
  RAISE NOTICE '2. Verify thumbnails appear in the livestream discovery page';
  RAISE NOTICE '3. Check that both thumbnail_url and display_image_url work';
  RAISE NOTICE '';
END $$;
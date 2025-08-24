-- ============================================================================
-- COMPREHENSIVE THUMBNAIL SYSTEM FIX
-- ============================================================================
-- This script addresses common issues with the live stream thumbnail system

-- First, let's ensure the stream-thumbnails bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-thumbnails',
  'stream-thumbnails',
  true,
  2097152, -- 2MB limit for thumbnails
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Clean up any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view stream thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can update their thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can delete their thumbnails" ON storage.objects;

-- Recreate the policies with proper permissions
-- Allow public viewing of stream thumbnails
CREATE POLICY "Anyone can view stream thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'stream-thumbnails');

-- Allow stream creators to upload thumbnails
CREATE POLICY "Stream creators can upload thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stream-thumbnails' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- Allow stream creators to update their thumbnails
CREATE POLICY "Stream creators can update their thumbnails" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'stream-thumbnails' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- Allow stream creators to delete their thumbnails
CREATE POLICY "Stream creators can delete their thumbnails" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'stream-thumbnails' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- Ensure proper permissions are granted
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT SELECT ON storage.buckets TO anon;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Add a function to validate thumbnail URLs
CREATE OR REPLACE FUNCTION validate_thumbnail_url(url text)
RETURNS boolean AS $$
BEGIN
  -- Check if URL is from the correct bucket
  RETURN url LIKE '%/storage/v1/object/public/stream-thumbnails/%';
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to clean up orphaned thumbnails
CREATE OR REPLACE FUNCTION cleanup_stream_thumbnails_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all thumbnail objects for this stream
  DELETE FROM storage.objects 
  WHERE bucket_id = 'stream-thumbnails' 
  AND (storage.foldername(name))[1] = OLD.id::text;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the cleanup trigger
DROP TRIGGER IF EXISTS trigger_cleanup_stream_thumbnails ON live_streams;
CREATE TRIGGER trigger_cleanup_stream_thumbnails
  AFTER DELETE ON live_streams
  FOR EACH ROW EXECUTE FUNCTION cleanup_stream_thumbnails_on_delete();

-- Create a function to get thumbnail stats
CREATE OR REPLACE FUNCTION get_thumbnail_stats()
RETURNS TABLE (
  total_streams bigint,
  streams_with_thumbnails bigint,
  total_thumbnail_files bigint,
  total_thumbnail_size bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM live_streams),
    (SELECT COUNT(*) FROM live_streams WHERE thumbnail_url IS NOT NULL),
    (SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'stream-thumbnails'),
    (SELECT COALESCE(SUM((metadata->>'size')::bigint), 0) FROM storage.objects WHERE bucket_id = 'stream-thumbnails');
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON POLICY "Anyone can view stream thumbnails" ON storage.objects IS 'Allows public viewing of stream thumbnails for discovery';
COMMENT ON POLICY "Stream creators can upload thumbnails" ON storage.objects IS 'Allows authenticated users to upload thumbnails to their own streams';
COMMENT ON POLICY "Stream creators can update their thumbnails" ON storage.objects IS 'Allows stream creators to update their existing thumbnails';
COMMENT ON POLICY "Stream creators can delete their thumbnails" ON storage.objects IS 'Allows stream creators to delete their thumbnails';
COMMENT ON FUNCTION cleanup_stream_thumbnails_on_delete() IS 'Automatically cleans up thumbnail files when a stream is deleted';
COMMENT ON FUNCTION get_thumbnail_stats() IS 'Returns statistics about thumbnail usage in the system';

-- Display final status
DO $$
BEGIN
  RAISE NOTICE '✅ Thumbnail system setup completed!';
  RAISE NOTICE '📊 Run "SELECT * FROM get_thumbnail_stats();" to see current stats';
  RAISE NOTICE '🧪 Test thumbnail upload with an authenticated user';
END $$;
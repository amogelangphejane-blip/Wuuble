-- Complete Livestream Storage Setup
-- This script creates all necessary storage buckets and applies security policies
-- Run this script as a superuser or service role

-- ============================================================================
-- CREATE STORAGE BUCKETS
-- ============================================================================

-- Create stream-images bucket for display images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-images',
  'stream-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create stream-thumbnails bucket
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

-- Create stream-segments bucket (for HLS/DASH streaming)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-segments',
  'stream-segments',
  true,
  52428800, -- 50MB for video segments
  ARRAY['video/mp4', 'application/vnd.apple.mpegurl', 'application/dash+xml', 'video/mp2t']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create stream-recordings bucket (for VOD)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-recordings',
  'stream-recordings',
  false, -- Private by default
  1073741824, -- 1GB for full recordings
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create stream-chat-attachments bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-chat-attachments',
  'stream-chat-attachments',
  true,
  10485760, -- 10MB for chat attachments
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create profile-pictures bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create community-avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-avatars',
  'community-avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- STREAM IMAGES BUCKET POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view stream images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload stream images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own stream images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own stream images" ON storage.objects;

-- Allow public viewing of stream images
CREATE POLICY "Anyone can view stream images" ON storage.objects
  FOR SELECT USING (bucket_id = 'stream-images');

-- Allow authenticated users to upload stream images
CREATE POLICY "Authenticated users can upload stream images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stream-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- Allow users to update their own stream images
CREATE POLICY "Users can update their own stream images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'stream-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- Allow users to delete their own stream images
CREATE POLICY "Users can delete their own stream images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'stream-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- ============================================================================
-- STREAM THUMBNAILS BUCKET POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view stream thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can update their thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can delete their thumbnails" ON storage.objects;

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

-- ============================================================================
-- PROFILE PICTURES BUCKET POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile picture" ON storage.objects;

-- Allow public viewing of profile pictures
CREATE POLICY "Anyone can view profile pictures" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pictures');

-- Allow users to upload their own profile picture
CREATE POLICY "Users can upload their own profile picture" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-pictures' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own profile picture
CREATE POLICY "Users can update their own profile picture" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-pictures' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own profile picture
CREATE POLICY "Users can delete their own profile picture" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-pictures' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- COMMUNITY AVATARS BUCKET POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view community avatars" ON storage.objects;
DROP POLICY IF EXISTS "Community admins can manage avatars" ON storage.objects;

-- Allow public viewing of community avatars
CREATE POLICY "Anyone can view community avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'community-avatars');

-- Allow community admins to manage avatars
CREATE POLICY "Community admins can manage avatars" ON storage.objects
  FOR ALL USING (
    bucket_id = 'community-avatars' 
    AND auth.role() = 'authenticated'
    AND (
      -- Community creator can manage avatar
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM communities WHERE creator_id = auth.uid()
      )
      OR
      -- Community admins can manage avatar
      (storage.foldername(name))[1] IN (
        SELECT community_id::text FROM community_members 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- ============================================================================
-- CLEANUP FUNCTIONS
-- ============================================================================

-- Function to clean up orphaned stream images
CREATE OR REPLACE FUNCTION cleanup_orphaned_stream_images()
RETURNS void AS $$
BEGIN
  -- Delete storage objects for streams that no longer exist
  DELETE FROM storage.objects 
  WHERE bucket_id = 'stream-images' 
  AND (storage.foldername(name))[1] NOT IN (
    SELECT id::text FROM live_streams
  );
  
  -- Delete stream_images records for deleted streams
  DELETE FROM stream_images 
  WHERE stream_id NOT IN (
    SELECT id FROM live_streams
  );
END;
$$ LANGUAGE plpgsql;

-- Function to automatically clean up images when a stream is deleted
CREATE OR REPLACE FUNCTION cleanup_stream_images_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all storage objects for this stream
  DELETE FROM storage.objects 
  WHERE bucket_id IN ('stream-images', 'stream-thumbnails')
  AND (storage.foldername(name))[1] = OLD.id::text;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS trigger_cleanup_stream_images ON live_streams;
CREATE TRIGGER trigger_cleanup_stream_images
  AFTER DELETE ON live_streams
  FOR EACH ROW EXECUTE FUNCTION cleanup_stream_images_on_delete();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO authenticated;

-- Grant execute permissions on cleanup functions to service role
GRANT EXECUTE ON FUNCTION cleanup_orphaned_stream_images() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_stream_images_on_delete() TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Anyone can view stream images" ON storage.objects IS 'Allows public viewing of stream display images';
COMMENT ON POLICY "Authenticated users can upload stream images" ON storage.objects IS 'Allows stream creators to upload images to their own stream folders';
COMMENT ON FUNCTION cleanup_orphaned_stream_images() IS 'Cleans up storage objects and database records for deleted streams';
COMMENT ON FUNCTION cleanup_stream_images_on_delete() IS 'Automatically cleans up stream images when a stream is deleted';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Livestream storage setup completed successfully!';
    RAISE NOTICE 'Created buckets: stream-images, stream-thumbnails, stream-segments, stream-recordings, stream-chat-attachments, profile-pictures, community-avatars';
    RAISE NOTICE 'Applied security policies for all buckets';
    RAISE NOTICE 'Set up cleanup functions and triggers';
END $$;
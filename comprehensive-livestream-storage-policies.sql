-- Comprehensive Storage Policies for Livestream Application
-- This file contains all recommended storage bucket policies for a secure and efficient livestreaming platform

-- ============================================================================
-- STREAM THUMBNAILS BUCKET POLICIES
-- ============================================================================

-- Create stream thumbnails bucket
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
-- STREAM SEGMENTS BUCKET POLICIES (for HLS/DASH live streaming)
-- ============================================================================

-- Create live stream segments bucket
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

-- Allow public viewing of active stream segments
CREATE POLICY "Anyone can view active stream segments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'stream-segments'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE status = 'live'
    )
  );

-- Allow stream creators to upload segments
CREATE POLICY "Stream creators can upload segments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stream-segments' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- Allow stream creators to delete old segments
CREATE POLICY "Stream creators can delete their segments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'stream-segments' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- ============================================================================
-- STREAM RECORDINGS BUCKET POLICIES (for VOD)
-- ============================================================================

-- Create stream recordings bucket
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

-- Allow viewing recordings based on stream access permissions
CREATE POLICY "Users can view recordings of accessible streams" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'stream-recordings'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams 
      WHERE 
        community_id IS NULL 
        OR community_id IN (
          SELECT id FROM communities WHERE is_private = false
        )
        OR community_id IN (
          SELECT community_id FROM community_members 
          WHERE user_id = auth.uid() AND status = 'approved'
        )
        OR creator_id = auth.uid()
    )
  );

-- Allow stream creators to upload recordings
CREATE POLICY "Stream creators can upload recordings" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stream-recordings' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- Allow stream creators to delete their recordings
CREATE POLICY "Stream creators can delete their recordings" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'stream-recordings' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- ============================================================================
-- CHAT ATTACHMENTS BUCKET POLICIES
-- ============================================================================

-- Create chat attachments bucket
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

-- Allow viewing chat attachments for accessible streams
CREATE POLICY "Users can view chat attachments for accessible streams" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'stream-chat-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams 
      WHERE 
        community_id IS NULL 
        OR community_id IN (
          SELECT id FROM communities WHERE is_private = false
        )
        OR community_id IN (
          SELECT community_id FROM community_members 
          WHERE user_id = auth.uid() AND status = 'approved'
        )
        OR creator_id = auth.uid()
    )
  );

-- Allow authenticated users to upload chat attachments
CREATE POLICY "Authenticated users can upload chat attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stream-chat-attachments' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[2]::uuid = auth.uid() -- Second folder is user ID
  );

-- Allow users to delete their own chat attachments
CREATE POLICY "Users can delete their own chat attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'stream-chat-attachments' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[2]::uuid = auth.uid()
  );

-- ============================================================================
-- AUTOMATED CLEANUP FUNCTIONS
-- ============================================================================

-- Function to cleanup expired stream segments (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_expired_stream_segments()
RETURNS void AS $$
BEGIN
  -- Delete segments older than 24 hours
  DELETE FROM storage.objects 
  WHERE bucket_id = 'stream-segments' 
  AND created_at < NOW() - INTERVAL '24 hours';
  
  -- Delete segments for ended streams older than 1 hour
  DELETE FROM storage.objects 
  WHERE bucket_id = 'stream-segments' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM live_streams 
    WHERE status = 'ended' 
    AND updated_at < NOW() - INTERVAL '1 hour'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup orphaned chat attachments (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_orphaned_chat_attachments()
RETURNS void AS $$
BEGIN
  -- Delete chat attachments for deleted streams
  DELETE FROM storage.objects 
  WHERE bucket_id = 'stream-chat-attachments' 
  AND (storage.foldername(name))[1] NOT IN (
    SELECT id::text FROM live_streams
  );
  
  -- Delete old chat attachments (30 days)
  DELETE FROM storage.objects 
  WHERE bucket_id = 'stream-chat-attachments' 
  AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old recordings based on retention policy
CREATE OR REPLACE FUNCTION cleanup_old_recordings()
RETURNS void AS $$
BEGIN
  -- Delete recordings older than 90 days for free users
  DELETE FROM storage.objects 
  WHERE bucket_id = 'stream-recordings' 
  AND created_at < NOW() - INTERVAL '90 days'
  AND (storage.foldername(name))[1] IN (
    SELECT s.id::text FROM live_streams s
    JOIN profiles p ON s.creator_id = p.user_id
    WHERE p.subscription_tier IS NULL OR p.subscription_tier = 'free'
  );
  
  -- Delete recordings older than 1 year for premium users
  DELETE FROM storage.objects 
  WHERE bucket_id = 'stream-recordings' 
  AND created_at < NOW() - INTERVAL '1 year'
  AND (storage.foldername(name))[1] IN (
    SELECT s.id::text FROM live_streams s
    JOIN profiles p ON s.creator_id = p.user_id
    WHERE p.subscription_tier = 'premium'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECURITY AND RATE LIMITING POLICIES
-- ============================================================================

-- Function to check upload rate limits
CREATE OR REPLACE FUNCTION check_upload_rate_limit(user_id UUID, bucket_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  upload_count INTEGER;
  rate_limit INTEGER;
BEGIN
  -- Get upload count in the last hour
  SELECT COUNT(*) INTO upload_count
  FROM storage.objects 
  WHERE bucket_id = bucket_name
  AND owner = user_id
  AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Set rate limits based on bucket type
  CASE bucket_name
    WHEN 'stream-segments' THEN rate_limit := 1000; -- High limit for streaming
    WHEN 'stream-thumbnails' THEN rate_limit := 10;
    WHEN 'stream-chat-attachments' THEN rate_limit := 50;
    WHEN 'stream-recordings' THEN rate_limit := 5;
    ELSE rate_limit := 20;
  END CASE;
  
  RETURN upload_count < rate_limit;
END;
$$ LANGUAGE plpgsql;

-- Enhanced upload policy with rate limiting
CREATE POLICY "Rate limited uploads for stream segments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stream-segments' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
    AND check_upload_rate_limit(auth.uid(), 'stream-segments')
  );

-- ============================================================================
-- MONITORING AND ANALYTICS POLICIES
-- ============================================================================

-- Function to log storage usage
CREATE OR REPLACE FUNCTION log_storage_usage()
RETURNS void AS $$
BEGIN
  INSERT INTO storage_usage_logs (
    bucket_id,
    total_objects,
    total_size_bytes,
    logged_at
  )
  SELECT 
    bucket_id,
    COUNT(*) as total_objects,
    SUM(metadata->>'size')::BIGINT as total_size_bytes,
    NOW()
  FROM storage.objects 
  GROUP BY bucket_id;
END;
$$ LANGUAGE plpgsql;

-- Create storage usage tracking table
CREATE TABLE IF NOT EXISTS storage_usage_logs (
  id SERIAL PRIMARY KEY,
  bucket_id TEXT NOT NULL,
  total_objects INTEGER NOT NULL,
  total_size_bytes BIGINT NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SCHEDULED CLEANUP JOBS
-- ============================================================================

-- Note: These would typically be set up as cron jobs or scheduled functions
-- In your application, you should call these functions periodically

-- Daily cleanup of expired segments
-- SELECT cleanup_expired_stream_segments();

-- Weekly cleanup of orphaned attachments
-- SELECT cleanup_orphaned_chat_attachments();

-- Monthly cleanup of old recordings
-- SELECT cleanup_old_recordings();

-- Daily storage usage logging
-- SELECT log_storage_usage();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO authenticated;

-- Grant execute permissions on cleanup functions to service role
GRANT EXECUTE ON FUNCTION cleanup_expired_stream_segments() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_chat_attachments() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_recordings() TO service_role;
GRANT EXECUTE ON FUNCTION log_storage_usage() TO service_role;

-- ============================================================================
-- HELPFUL COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Anyone can view stream thumbnails" ON storage.objects IS 'Allows public viewing of stream preview thumbnails for discovery';
COMMENT ON POLICY "Anyone can view active stream segments" ON storage.objects IS 'Allows public access to HLS/DASH segments for live streams only';
COMMENT ON POLICY "Users can view recordings of accessible streams" ON storage.objects IS 'Controls access to stream recordings based on community membership and privacy settings';
COMMENT ON FUNCTION cleanup_expired_stream_segments() IS 'Automatically removes old stream segments to save storage space';
COMMENT ON FUNCTION cleanup_orphaned_chat_attachments() IS 'Removes chat attachments for deleted streams and old attachments';
COMMENT ON FUNCTION cleanup_old_recordings() IS 'Implements retention policies for stream recordings based on user subscription tier';
COMMENT ON FUNCTION check_upload_rate_limit(UUID, TEXT) IS 'Prevents abuse by limiting upload rates per user per bucket type';
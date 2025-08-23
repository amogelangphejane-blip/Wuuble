-- Simple Storage Setup for Livestream
-- Run this in Supabase SQL Editor
-- This creates buckets and functions only (policies need to be added manually via Dashboard)

-- ============================================================================
-- CREATE STORAGE BUCKETS
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

-- ============================================================================
-- CREATE CLEANUP FUNCTIONS
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
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Storage buckets and functions created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEP: Add storage policies manually in Supabase Dashboard';
    RAISE NOTICE '   Go to: Storage → [Bucket Name] → Policies → New Policy';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 Use these policy definitions:';
    RAISE NOTICE '';
    RAISE NOTICE '📦 For stream-thumbnails bucket:';
    RAISE NOTICE '   SELECT: bucket_id = ''stream-thumbnails''';
    RAISE NOTICE '   INSERT: bucket_id = ''stream-thumbnails'' AND auth.role() = ''authenticated'' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE creator_id = auth.uid())';
    RAISE NOTICE '   UPDATE: bucket_id = ''stream-thumbnails'' AND auth.role() = ''authenticated'' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE creator_id = auth.uid())';
    RAISE NOTICE '   DELETE: bucket_id = ''stream-thumbnails'' AND auth.role() = ''authenticated'' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE creator_id = auth.uid())';
    RAISE NOTICE '';
    RAISE NOTICE '🎥 For stream-segments bucket:';
    RAISE NOTICE '   SELECT: bucket_id = ''stream-segments'' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE status = ''live'')';
    RAISE NOTICE '   INSERT: bucket_id = ''stream-segments'' AND auth.role() = ''authenticated'' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE creator_id = auth.uid())';
    RAISE NOTICE '   DELETE: bucket_id = ''stream-segments'' AND auth.role() = ''authenticated'' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE creator_id = auth.uid())';
    RAISE NOTICE '';
    RAISE NOTICE '📹 For stream-recordings bucket:';
    RAISE NOTICE '   SELECT: bucket_id = ''stream-recordings'' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE community_id IS NULL OR community_id IN (SELECT id FROM communities WHERE is_private = false) OR community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid() AND status = ''approved'') OR creator_id = auth.uid())';
    RAISE NOTICE '   INSERT: bucket_id = ''stream-recordings'' AND auth.role() = ''authenticated'' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE creator_id = auth.uid())';
    RAISE NOTICE '   DELETE: bucket_id = ''stream-recordings'' AND auth.role() = ''authenticated'' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE creator_id = auth.uid())';
    RAISE NOTICE '';
    RAISE NOTICE '💬 For stream-chat-attachments bucket:';
    RAISE NOTICE '   SELECT: bucket_id = ''stream-chat-attachments'' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE community_id IS NULL OR community_id IN (SELECT id FROM communities WHERE is_private = false) OR community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid() AND status = ''approved'') OR creator_id = auth.uid())';
    RAISE NOTICE '   INSERT: bucket_id = ''stream-chat-attachments'' AND auth.role() = ''authenticated'' AND (storage.foldername(name))[2]::uuid = auth.uid()';
    RAISE NOTICE '   DELETE: bucket_id = ''stream-chat-attachments'' AND auth.role() = ''authenticated'' AND (storage.foldername(name))[2]::uuid = auth.uid()';
END $$;
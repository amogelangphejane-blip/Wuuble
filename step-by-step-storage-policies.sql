-- Step-by-Step Storage Policies Setup
-- Run this in sections if you get permission errors

-- ============================================================================
-- STEP 1: CREATE BUCKETS FIRST (This should work)
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
-- STEP 2: DROP EXISTING POLICIES (Run this separately if needed)
-- ============================================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Anyone can view stream thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can update their thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can delete their thumbnails" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can view active stream segments" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can upload segments" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can delete their segments" ON storage.objects;

DROP POLICY IF EXISTS "Users can view recordings of accessible streams" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can upload recordings" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can delete their recordings" ON storage.objects;

DROP POLICY IF EXISTS "Users can view chat attachments for accessible streams" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat attachments" ON storage.objects;

DROP POLICY IF EXISTS "Rate limited uploads for stream segments" ON storage.objects;

-- ============================================================================
-- STEP 3: CREATE POLICIES ONE BY ONE
-- ============================================================================

-- Stream thumbnails policies
CREATE POLICY "Anyone can view stream thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'stream-thumbnails');

CREATE POLICY "Stream creators can upload thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stream-thumbnails' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "Stream creators can update their thumbnails" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'stream-thumbnails' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "Stream creators can delete their thumbnails" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'stream-thumbnails' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- Stream segments policies
CREATE POLICY "Anyone can view active stream segments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'stream-segments'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE status = 'live'
    )
  );

CREATE POLICY "Stream creators can upload segments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stream-segments' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "Stream creators can delete their segments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'stream-segments' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- Stream recordings policies
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

CREATE POLICY "Stream creators can upload recordings" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stream-recordings' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "Stream creators can delete their recordings" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'stream-recordings' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
    )
  );

-- Chat attachments policies
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

CREATE POLICY "Authenticated users can upload chat attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stream-chat-attachments' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[2]::uuid = auth.uid()
  );

CREATE POLICY "Users can delete their own chat attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'stream-chat-attachments' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[2]::uuid = auth.uid()
  );

-- ============================================================================
-- STEP 4: CREATE FUNCTIONS (This should work)
-- ============================================================================

-- Function to cleanup expired stream segments
CREATE OR REPLACE FUNCTION cleanup_expired_stream_segments()
RETURNS void AS $$
BEGIN
  DELETE FROM storage.objects 
  WHERE bucket_id = 'stream-segments' 
  AND created_at < NOW() - INTERVAL '24 hours';
  
  DELETE FROM storage.objects 
  WHERE bucket_id = 'stream-segments' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM live_streams 
    WHERE status = 'ended' 
    AND updated_at < NOW() - INTERVAL '1 hour'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup orphaned chat attachments
CREATE OR REPLACE FUNCTION cleanup_orphaned_chat_attachments()
RETURNS void AS $$
BEGIN
  DELETE FROM storage.objects 
  WHERE bucket_id = 'stream-chat-attachments' 
  AND (storage.foldername(name))[1] NOT IN (
    SELECT id::text FROM live_streams
  );
  
  DELETE FROM storage.objects 
  WHERE bucket_id = 'stream-chat-attachments' 
  AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old recordings
CREATE OR REPLACE FUNCTION cleanup_old_recordings()
RETURNS void AS $$
BEGIN
  DELETE FROM storage.objects 
  WHERE bucket_id = 'stream-recordings' 
  AND created_at < NOW() - INTERVAL '90 days'
  AND (storage.foldername(name))[1] IN (
    SELECT s.id::text FROM live_streams s
    JOIN profiles p ON s.creator_id = p.user_id
    WHERE p.subscription_tier IS NULL OR p.subscription_tier = 'free'
  );
  
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
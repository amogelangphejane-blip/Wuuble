-- Fix Thumbnail System SQL Script
-- This script addresses various issues in the thumbnail system and improves functionality
-- Run this script to fix thumbnail-related problems in your livestream application

-- ============================================================================
-- 1. ENSURE STORAGE BUCKET EXISTS AND IS PROPERLY CONFIGURED
-- ============================================================================

-- Create or update stream-thumbnails bucket with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-thumbnails',
  'stream-thumbnails',
  true,
  2097152, -- 2MB limit for thumbnails
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 2. FIX STORAGE POLICIES FOR STREAM THUMBNAILS
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view stream thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can update their thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can delete their thumbnails" ON storage.objects;

-- Create comprehensive storage policies
-- Allow public viewing of stream thumbnails
CREATE POLICY "Anyone can view stream thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'stream-thumbnails');

-- Allow stream creators to upload thumbnails to their own streams
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
-- 3. ADD MISSING COLUMNS AND IMPROVE LIVE_STREAMS TABLE
-- ============================================================================

-- Add display_image_url column if it doesn't exist (for custom stream display images)
ALTER TABLE live_streams 
ADD COLUMN IF NOT EXISTS display_image_url TEXT;

-- Add thumbnail metadata columns for better management
ALTER TABLE live_streams 
ADD COLUMN IF NOT EXISTS thumbnail_width INTEGER;

ALTER TABLE live_streams 
ADD COLUMN IF NOT EXISTS thumbnail_height INTEGER;

ALTER TABLE live_streams 
ADD COLUMN IF NOT EXISTS thumbnail_size INTEGER; -- File size in bytes

ALTER TABLE live_streams 
ADD COLUMN IF NOT EXISTS thumbnail_mime_type VARCHAR(50);

ALTER TABLE live_streams 
ADD COLUMN IF NOT EXISTS thumbnail_uploaded_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN live_streams.thumbnail_url IS 'URL of the custom thumbnail uploaded by stream creator';
COMMENT ON COLUMN live_streams.display_image_url IS 'URL of the custom display image for stream discovery';
COMMENT ON COLUMN live_streams.thumbnail_width IS 'Width of the thumbnail image in pixels';
COMMENT ON COLUMN live_streams.thumbnail_height IS 'Height of the thumbnail image in pixels';
COMMENT ON COLUMN live_streams.thumbnail_size IS 'File size of the thumbnail in bytes';
COMMENT ON COLUMN live_streams.thumbnail_mime_type IS 'MIME type of the thumbnail file';
COMMENT ON COLUMN live_streams.thumbnail_uploaded_at IS 'Timestamp when the thumbnail was last uploaded';

-- ============================================================================
-- 4. CREATE STREAM_IMAGES TABLE FOR BETTER IMAGE MANAGEMENT
-- ============================================================================

-- Create stream_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS stream_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(20) DEFAULT 'thumbnail' CHECK (image_type IN ('thumbnail', 'display', 'banner', 'preview')),
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stream_images_stream_id ON stream_images(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_images_creator_id ON stream_images(creator_id);
CREATE INDEX IF NOT EXISTS idx_stream_images_type ON stream_images(image_type);
CREATE INDEX IF NOT EXISTS idx_stream_images_active ON stream_images(is_active);

-- Enable RLS on stream_images table
ALTER TABLE stream_images ENABLE ROW LEVEL SECURITY;

-- Policies for stream_images table
CREATE POLICY "Users can view stream images for accessible streams" ON stream_images
    FOR SELECT USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE community_id IN (
                SELECT community_id FROM community_members 
                WHERE user_id = auth.uid()
            )
            OR creator_id = auth.uid()
        )
    );

CREATE POLICY "Stream creators can manage their stream images" ON stream_images
    FOR ALL USING (creator_id = auth.uid());

-- ============================================================================
-- 5. CREATE HELPER FUNCTIONS FOR THUMBNAIL MANAGEMENT
-- ============================================================================

-- Function to update thumbnail metadata when a new thumbnail is uploaded
CREATE OR REPLACE FUNCTION update_thumbnail_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the thumbnail_uploaded_at timestamp
    NEW.thumbnail_uploaded_at = NOW();
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update thumbnail metadata
DROP TRIGGER IF EXISTS update_thumbnail_metadata_trigger ON live_streams;
CREATE TRIGGER update_thumbnail_metadata_trigger
    BEFORE UPDATE OF thumbnail_url ON live_streams
    FOR EACH ROW 
    WHEN (OLD.thumbnail_url IS DISTINCT FROM NEW.thumbnail_url)
    EXECUTE FUNCTION update_thumbnail_metadata();

-- Function to clean up orphaned thumbnails
CREATE OR REPLACE FUNCTION cleanup_orphaned_thumbnails()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER := 0;
    thumbnail_record RECORD;
BEGIN
    -- Find thumbnails in storage that don't have corresponding live_streams records
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
        
        cleanup_count := cleanup_count + 1;
    END LOOP;
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get thumbnail statistics
CREATE OR REPLACE FUNCTION get_thumbnail_stats()
RETURNS TABLE (
    total_streams INTEGER,
    streams_with_thumbnails INTEGER,
    streams_without_thumbnails INTEGER,
    total_thumbnail_files INTEGER,
    total_thumbnail_size_mb NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM live_streams) as total_streams,
        (SELECT COUNT(*)::INTEGER FROM live_streams WHERE thumbnail_url IS NOT NULL) as streams_with_thumbnails,
        (SELECT COUNT(*)::INTEGER FROM live_streams WHERE thumbnail_url IS NULL) as streams_without_thumbnails,
        (SELECT COUNT(*)::INTEGER FROM storage.objects WHERE bucket_id = 'stream-thumbnails') as total_thumbnail_files,
        (SELECT COALESCE(SUM(metadata->>'size')::NUMERIC / 1024 / 1024, 0) FROM storage.objects WHERE bucket_id = 'stream-thumbnails') as total_thumbnail_size_mb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. CREATE VIEW FOR EASY THUMBNAIL ACCESS
-- ============================================================================

-- Create a view that combines stream and thumbnail information
CREATE OR REPLACE VIEW stream_thumbnails_view AS
SELECT 
    ls.id as stream_id,
    ls.title,
    ls.description,
    ls.creator_id,
    ls.community_id,
    ls.status,
    ls.thumbnail_url,
    ls.display_image_url,
    ls.thumbnail_width,
    ls.thumbnail_height,
    ls.thumbnail_size,
    ls.thumbnail_mime_type,
    ls.thumbnail_uploaded_at,
    ls.created_at as stream_created_at,
    ls.updated_at as stream_updated_at,
    p.display_name as creator_name,
    p.avatar_url as creator_avatar,
    c.name as community_name,
    CASE 
        WHEN ls.thumbnail_url IS NOT NULL THEN true 
        ELSE false 
    END as has_thumbnail,
    CASE 
        WHEN ls.display_image_url IS NOT NULL THEN true 
        ELSE false 
    END as has_display_image
FROM live_streams ls
LEFT JOIN profiles p ON ls.creator_id = p.id
LEFT JOIN communities c ON ls.community_id = c.id;

-- Grant appropriate permissions to the view
GRANT SELECT ON stream_thumbnails_view TO authenticated;

-- ============================================================================
-- 7. ADD CONSTRAINTS AND VALIDATIONS
-- ============================================================================

-- Add check constraints for thumbnail dimensions (reasonable limits)
ALTER TABLE live_streams 
ADD CONSTRAINT IF NOT EXISTS chk_thumbnail_width 
CHECK (thumbnail_width IS NULL OR (thumbnail_width > 0 AND thumbnail_width <= 4096));

ALTER TABLE live_streams 
ADD CONSTRAINT IF NOT EXISTS chk_thumbnail_height 
CHECK (thumbnail_height IS NULL OR (thumbnail_height > 0 AND thumbnail_height <= 4096));

-- Add check constraint for thumbnail file size (max 2MB)
ALTER TABLE live_streams 
ADD CONSTRAINT IF NOT EXISTS chk_thumbnail_size 
CHECK (thumbnail_size IS NULL OR (thumbnail_size > 0 AND thumbnail_size <= 2097152));

-- Ensure thumbnail MIME type is valid
ALTER TABLE live_streams 
ADD CONSTRAINT IF NOT EXISTS chk_thumbnail_mime_type 
CHECK (thumbnail_mime_type IS NULL OR thumbnail_mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif'));

-- ============================================================================
-- 8. MIGRATION SCRIPT FOR EXISTING DATA
-- ============================================================================

-- Update existing streams that have thumbnails but missing metadata
DO $$
DECLARE
    stream_record RECORD;
BEGIN
    -- Log start of migration
    RAISE NOTICE 'Starting thumbnail metadata migration...';
    
    FOR stream_record IN 
        SELECT id, thumbnail_url 
        FROM live_streams 
        WHERE thumbnail_url IS NOT NULL 
        AND thumbnail_uploaded_at IS NULL
    LOOP
        -- Update the timestamp for existing thumbnails
        UPDATE live_streams 
        SET thumbnail_uploaded_at = updated_at
        WHERE id = stream_record.id;
    END LOOP;
    
    RAISE NOTICE 'Thumbnail metadata migration completed.';
END $$;

-- ============================================================================
-- 9. PERFORMANCE OPTIMIZATIONS
-- ============================================================================

-- Add additional indexes for thumbnail queries
CREATE INDEX IF NOT EXISTS idx_live_streams_thumbnail_url ON live_streams(thumbnail_url) WHERE thumbnail_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_streams_display_image_url ON live_streams(display_image_url) WHERE display_image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_streams_thumbnail_uploaded_at ON live_streams(thumbnail_uploaded_at) WHERE thumbnail_uploaded_at IS NOT NULL;

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_live_streams_status_thumbnail ON live_streams(status, thumbnail_url) WHERE thumbnail_url IS NOT NULL;

-- ============================================================================
-- 10. FINAL VALIDATION AND CLEANUP
-- ============================================================================

-- Create a function to validate the thumbnail system
CREATE OR REPLACE FUNCTION validate_thumbnail_system()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check if bucket exists
    RETURN QUERY
    SELECT 
        'Bucket Existence'::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'stream-thumbnails') 
             THEN 'PASS'::TEXT 
             ELSE 'FAIL'::TEXT 
        END,
        'stream-thumbnails bucket'::TEXT;
    
    -- Check policies
    RETURN QUERY
    SELECT 
        'Storage Policies'::TEXT,
        CASE WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%thumbnail%') >= 4
             THEN 'PASS'::TEXT 
             ELSE 'FAIL'::TEXT 
        END,
        (SELECT COUNT(*)::TEXT || ' thumbnail policies found' FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%thumbnail%');
    
    -- Check table structure
    RETURN QUERY
    SELECT 
        'Table Structure'::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'live_streams' AND column_name = 'thumbnail_url')
             THEN 'PASS'::TEXT 
             ELSE 'FAIL'::TEXT 
        END,
        'live_streams table has thumbnail columns'::TEXT;
    
    -- Check view existence
    RETURN QUERY
    SELECT 
        'Thumbnail View'::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM information_schema.views WHERE table_name = 'stream_thumbnails_view')
             THEN 'PASS'::TEXT 
             ELSE 'FAIL'::TEXT 
        END,
        'stream_thumbnails_view exists'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run validation
SELECT * FROM validate_thumbnail_system();

-- Final notification
DO $$
BEGIN
    RAISE NOTICE '✅ Thumbnail system fix completed successfully!';
    RAISE NOTICE '📊 Run "SELECT * FROM get_thumbnail_stats();" to see system statistics';
    RAISE NOTICE '🔍 Run "SELECT * FROM validate_thumbnail_system();" to validate the fixes';
    RAISE NOTICE '🧹 Run "SELECT cleanup_orphaned_thumbnails();" to clean up orphaned files';
END $$;
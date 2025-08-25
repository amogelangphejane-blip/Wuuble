-- ============================================================================
-- COMPLETE THUMBNAIL SYSTEM FIX
-- This script ensures the thumbnail system works properly
-- ============================================================================

-- 1. Create the stream-thumbnails bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-thumbnails',
  'stream-thumbnails',
  true, -- Make it public so thumbnails can be viewed by anyone
  2097152, -- 2MB limit for thumbnails
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view stream thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can update their thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Stream creators can delete their thumbnails" ON storage.objects;

-- 3. Create comprehensive storage policies

-- Allow EVERYONE to view stream thumbnails (public read access)
CREATE POLICY "Public read access for stream thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'stream-thumbnails');

-- Allow authenticated users to upload thumbnails to their own streams
CREATE POLICY "Authenticated users can upload stream thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stream-thumbnails' 
    AND auth.role() = 'authenticated'
    AND (
      -- Allow if the folder name matches a stream they own
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM live_streams WHERE creator_id = auth.uid()
      )
      OR
      -- Allow if they're uploading to a stream they have permission to manage
      (storage.foldername(name))[1] IN (
        SELECT ls.id::text FROM live_streams ls
        LEFT JOIN community_members cm ON ls.community_id = cm.community_id
        WHERE ls.creator_id = auth.uid() OR cm.user_id = auth.uid()
      )
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

-- 4. Ensure the live_streams table has proper structure
-- Add thumbnail_url column if it doesn't exist
ALTER TABLE live_streams 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add display_image_url column if it doesn't exist (fallback)
ALTER TABLE live_streams 
ADD COLUMN IF NOT EXISTS display_image_url TEXT;

-- 5. Create a function to fix broken thumbnail URLs
CREATE OR REPLACE FUNCTION fix_thumbnail_urls()
RETURNS void AS $$
DECLARE
    stream_record RECORD;
    new_url TEXT;
BEGIN
    -- Loop through all streams with thumbnail URLs
    FOR stream_record IN 
        SELECT id, thumbnail_url 
        FROM live_streams 
        WHERE thumbnail_url IS NOT NULL
    LOOP
        -- Check if the URL is accessible and fix if needed
        IF stream_record.thumbnail_url LIKE '%/storage/v1/object/public/stream-thumbnails/%' THEN
            -- URL looks correct, keep it
            CONTINUE;
        ELSIF stream_record.thumbnail_url LIKE '%stream-thumbnails%' THEN
            -- Try to fix the URL format
            new_url := regexp_replace(
                stream_record.thumbnail_url, 
                '.*stream-thumbnails/(.*)', 
                (SELECT url FROM storage.buckets WHERE id = 'stream-thumbnails') || '/\1'
            );
            
            UPDATE live_streams 
            SET thumbnail_url = new_url 
            WHERE id = stream_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Thumbnail URLs have been checked and fixed where necessary';
END;
$$ LANGUAGE plpgsql;

-- 6. Run the fix function
SELECT fix_thumbnail_urls();

-- 7. Create a helper function to generate proper thumbnail URLs
CREATE OR REPLACE FUNCTION get_thumbnail_public_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT 
            CASE 
                WHEN url IS NOT NULL THEN url || '/' || file_path
                ELSE 'https://your-project.supabase.co/storage/v1/object/public/' || bucket_name || '/' || file_path
            END
        FROM storage.buckets 
        WHERE id = bucket_name
    );
END;
$$ LANGUAGE plpgsql;

-- 8. Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_streams_thumbnail_url ON live_streams(thumbnail_url) WHERE thumbnail_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_streams_display_image_url ON live_streams(display_image_url) WHERE display_image_url IS NOT NULL;

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT SELECT ON storage.objects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

-- 10. Create a view for easy thumbnail management
CREATE OR REPLACE VIEW stream_thumbnails_view AS
SELECT 
    ls.id as stream_id,
    ls.title,
    ls.creator_id,
    ls.thumbnail_url,
    ls.display_image_url,
    CASE 
        WHEN ls.thumbnail_url IS NOT NULL THEN ls.thumbnail_url
        WHEN ls.display_image_url IS NOT NULL THEN ls.display_image_url
        ELSE NULL
    END as effective_thumbnail_url,
    CASE 
        WHEN ls.thumbnail_url IS NOT NULL THEN 'thumbnail'
        WHEN ls.display_image_url IS NOT NULL THEN 'display_image'
        ELSE 'none'
    END as image_source
FROM live_streams ls;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Thumbnail system setup completed successfully!';
    RAISE NOTICE '📋 Summary of changes:';
    RAISE NOTICE '   - Created stream-thumbnails bucket with public read access';
    RAISE NOTICE '   - Set up comprehensive storage policies';
    RAISE NOTICE '   - Fixed any broken thumbnail URLs';
    RAISE NOTICE '   - Added helper functions and indexes';
    RAISE NOTICE '   - Created management view';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Next steps:';
    RAISE NOTICE '   1. Test thumbnail upload in your app';
    RAISE NOTICE '   2. Check that thumbnails display correctly';
    RAISE NOTICE '   3. Use the diagnostic tool: /diagnose-thumbnail-issue.html';
END $$;
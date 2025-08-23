-- Migration: Add Stream Display Images Feature
-- Date: 2025-02-02
-- Description: Adds custom display image functionality for livestream creators

-- Add display_image_url column to live_streams table
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS display_image_url TEXT;

-- Add index for better performance when filtering streams with display images
CREATE INDEX IF NOT EXISTS idx_live_streams_display_image ON live_streams(display_image_url) WHERE display_image_url IS NOT NULL;

-- Create stream_images table for managing uploaded images
CREATE TABLE IF NOT EXISTS stream_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(20) DEFAULT 'display' CHECK (image_type IN ('display', 'thumbnail', 'banner')),
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for stream_images table
CREATE INDEX IF NOT EXISTS idx_stream_images_stream_id ON stream_images(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_images_creator_id ON stream_images(creator_id);
CREATE INDEX IF NOT EXISTS idx_stream_images_type ON stream_images(stream_id, image_type, is_active);

-- Enable RLS on stream_images table
ALTER TABLE stream_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stream_images table
CREATE POLICY "Users can view images for accessible streams" ON stream_images
    FOR SELECT USING (
        stream_id IN (
            SELECT ls.id FROM live_streams ls
            WHERE ls.visibility = 'public'
            OR (
                ls.visibility = 'community_only' 
                AND ls.community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid()
                )
            )
            OR ls.creator_id = auth.uid()
        )
    );

CREATE POLICY "Stream creators can manage their stream images" ON stream_images
    FOR ALL USING (creator_id = auth.uid());

-- Function to update stream display image when a new image is uploaded
CREATE OR REPLACE FUNCTION update_stream_display_image()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the live_streams table with the new display image URL
    IF NEW.image_type = 'display' AND NEW.is_active = TRUE THEN
        UPDATE live_streams 
        SET display_image_url = NEW.image_url
        WHERE id = NEW.stream_id;
        
        -- Deactivate other display images for the same stream
        UPDATE stream_images 
        SET is_active = FALSE
        WHERE stream_id = NEW.stream_id 
        AND image_type = 'display' 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update stream display image
CREATE TRIGGER trigger_update_stream_display_image
    AFTER INSERT OR UPDATE ON stream_images
    FOR EACH ROW EXECUTE FUNCTION update_stream_display_image();

-- Function to clean up display image URL when image is deactivated
CREATE OR REPLACE FUNCTION cleanup_stream_display_image()
RETURNS TRIGGER AS $$
BEGIN
    -- If this was the active display image and it's being deactivated
    IF OLD.image_type = 'display' AND OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
        UPDATE live_streams 
        SET display_image_url = NULL
        WHERE id = OLD.stream_id AND display_image_url = OLD.image_url;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up display image URL on deactivation
CREATE TRIGGER trigger_cleanup_stream_display_image
    AFTER UPDATE ON stream_images
    FOR EACH ROW EXECUTE FUNCTION cleanup_stream_display_image();

-- Grant permissions on new table
GRANT ALL ON stream_images TO authenticated;

-- Add comment to document the display image feature
COMMENT ON COLUMN live_streams.display_image_url IS 'URL of the custom display image set by the stream creator, shown on discover page';
COMMENT ON TABLE stream_images IS 'Stores uploaded images for streams including display images, thumbnails, and banners';
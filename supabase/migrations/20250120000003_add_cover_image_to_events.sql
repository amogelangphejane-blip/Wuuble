-- Add cover image support to community events
-- This migration adds cover image URL field to existing events table

ALTER TABLE public.community_events 
ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500);

-- Add comment for documentation
COMMENT ON COLUMN public.community_events.cover_image_url IS 'URL for event cover image to make events more visually appealing';
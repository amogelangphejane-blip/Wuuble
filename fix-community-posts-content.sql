-- Fix community_posts content column to allow empty strings for image-only posts
-- This allows posts to have either text content, image content, or both

-- First, let's check if there are any existing posts with null content and fix them
UPDATE public.community_posts 
SET content = '[Image]' 
WHERE content IS NULL OR content = '';

-- The content column should remain NOT NULL but allow empty strings
-- Since it's already NOT NULL, we don't need to change the constraint
-- The application logic will handle empty strings appropriately

-- Add a check constraint to ensure posts have either content or image
ALTER TABLE public.community_posts 
ADD CONSTRAINT check_post_has_content_or_image 
CHECK (
  (content IS NOT NULL AND content != '') 
  OR 
  (image_url IS NOT NULL AND image_url != '')
);

-- Add comment for documentation
COMMENT ON CONSTRAINT check_post_has_content_or_image ON public.community_posts 
IS 'Ensures that posts have either text content or an image (or both)';
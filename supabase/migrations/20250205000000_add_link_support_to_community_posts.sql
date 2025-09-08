-- Add link support to community posts table
-- This allows users to post links to external websites with rich previews

-- Add link-related columns to community_posts table
ALTER TABLE public.community_posts 
ADD COLUMN link_url TEXT NULL,
ADD COLUMN link_title TEXT NULL,
ADD COLUMN link_description TEXT NULL,
ADD COLUMN link_image_url TEXT NULL,
ADD COLUMN link_domain TEXT NULL;

-- Create indexes for better performance when querying posts with links
CREATE INDEX idx_community_posts_link_url ON public.community_posts(link_url) WHERE link_url IS NOT NULL;
CREATE INDEX idx_community_posts_link_domain ON public.community_posts(link_domain) WHERE link_domain IS NOT NULL;

-- Add comments to explain the new columns
COMMENT ON COLUMN public.community_posts.link_url IS 'URL of the external website being shared';
COMMENT ON COLUMN public.community_posts.link_title IS 'Title of the linked webpage (fetched from meta tags)';
COMMENT ON COLUMN public.community_posts.link_description IS 'Description of the linked webpage (fetched from meta tags)';
COMMENT ON COLUMN public.community_posts.link_image_url IS 'Preview image URL for the linked webpage (fetched from meta tags)';
COMMENT ON COLUMN public.community_posts.link_domain IS 'Domain name of the linked website (for display and filtering)';
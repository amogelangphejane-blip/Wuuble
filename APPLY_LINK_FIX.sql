-- ============================================================================
-- APPLY LINK FIX TO COMMUNITY POSTS
-- This script ensures the link columns exist and the feature works properly
-- ============================================================================

-- Step 1: Check if columns already exist and add them if they don't
DO $$ 
BEGIN
    -- Add link_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'community_posts' 
        AND column_name = 'link_url'
    ) THEN
        ALTER TABLE public.community_posts ADD COLUMN link_url TEXT NULL;
        RAISE NOTICE 'Added link_url column';
    ELSE
        RAISE NOTICE 'link_url column already exists';
    END IF;

    -- Add link_title column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'community_posts' 
        AND column_name = 'link_title'
    ) THEN
        ALTER TABLE public.community_posts ADD COLUMN link_title TEXT NULL;
        RAISE NOTICE 'Added link_title column';
    ELSE
        RAISE NOTICE 'link_title column already exists';
    END IF;

    -- Add link_description column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'community_posts' 
        AND column_name = 'link_description'
    ) THEN
        ALTER TABLE public.community_posts ADD COLUMN link_description TEXT NULL;
        RAISE NOTICE 'Added link_description column';
    ELSE
        RAISE NOTICE 'link_description column already exists';
    END IF;

    -- Add link_image_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'community_posts' 
        AND column_name = 'link_image_url'
    ) THEN
        ALTER TABLE public.community_posts ADD COLUMN link_image_url TEXT NULL;
        RAISE NOTICE 'Added link_image_url column';
    ELSE
        RAISE NOTICE 'link_image_url column already exists';
    END IF;

    -- Add link_domain column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'community_posts' 
        AND column_name = 'link_domain'
    ) THEN
        ALTER TABLE public.community_posts ADD COLUMN link_domain TEXT NULL;
        RAISE NOTICE 'Added link_domain column';
    ELSE
        RAISE NOTICE 'link_domain column already exists';
    END IF;
END $$;

-- Step 2: Create indexes for better performance (if they don't exist)
DO $$ 
BEGIN
    -- Create index on link_url
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'community_posts' 
        AND indexname = 'idx_community_posts_link_url'
    ) THEN
        CREATE INDEX idx_community_posts_link_url 
        ON public.community_posts(link_url) 
        WHERE link_url IS NOT NULL;
        RAISE NOTICE 'Created index on link_url';
    ELSE
        RAISE NOTICE 'Index on link_url already exists';
    END IF;

    -- Create index on link_domain
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'community_posts' 
        AND indexname = 'idx_community_posts_link_domain'
    ) THEN
        CREATE INDEX idx_community_posts_link_domain 
        ON public.community_posts(link_domain) 
        WHERE link_domain IS NOT NULL;
        RAISE NOTICE 'Created index on link_domain';
    ELSE
        RAISE NOTICE 'Index on link_domain already exists';
    END IF;
END $$;

-- Step 3: Add comments to explain the columns
COMMENT ON COLUMN public.community_posts.link_url IS 'URL of the external website being shared';
COMMENT ON COLUMN public.community_posts.link_title IS 'Title of the linked webpage (fetched from meta tags)';
COMMENT ON COLUMN public.community_posts.link_description IS 'Description of the linked webpage (fetched from meta tags)';
COMMENT ON COLUMN public.community_posts.link_image_url IS 'Preview image URL for the linked webpage (fetched from meta tags)';
COMMENT ON COLUMN public.community_posts.link_domain IS 'Domain name of the linked website (for display and filtering)';

-- Step 4: Verify the schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'community_posts'
AND column_name LIKE 'link%'
ORDER BY column_name;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Link support has been successfully added to community_posts table!';
    RAISE NOTICE '✅ You can now post links in discussions and they will work properly.';
END $$;

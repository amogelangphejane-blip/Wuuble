-- Fix Foreign Key References for Resources Feature (Safe Version)
-- This safely adds missing foreign key constraints

-- Drop existing constraints first to avoid conflicts, then recreate them
DO $$ 
BEGIN
    -- Drop existing constraints if they exist
    BEGIN
        ALTER TABLE community_resources DROP CONSTRAINT IF EXISTS fk_community_resources_community_id;
        ALTER TABLE community_resources DROP CONSTRAINT IF EXISTS fk_community_resources_user_id;
        ALTER TABLE resource_tag_assignments DROP CONSTRAINT IF EXISTS fk_resource_tag_assignments_resource_id;
        ALTER TABLE resource_tag_assignments DROP CONSTRAINT IF EXISTS fk_resource_tag_assignments_tag_id;
        ALTER TABLE resource_ratings DROP CONSTRAINT IF EXISTS fk_resource_ratings_resource_id;
        ALTER TABLE resource_ratings DROP CONSTRAINT IF EXISTS fk_resource_ratings_user_id;
        ALTER TABLE resource_bookmarks DROP CONSTRAINT IF EXISTS fk_resource_bookmarks_resource_id;
        ALTER TABLE resource_bookmarks DROP CONSTRAINT IF EXISTS fk_resource_bookmarks_user_id;
        ALTER TABLE resource_reports DROP CONSTRAINT IF EXISTS fk_resource_reports_resource_id;
        ALTER TABLE resource_reports DROP CONSTRAINT IF EXISTS fk_resource_reports_reporter_id;
        ALTER TABLE resource_reports DROP CONSTRAINT IF EXISTS fk_resource_reports_moderator_id;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore errors if constraints don't exist
        NULL;
    END;
END $$;

-- Now add the foreign key constraints
ALTER TABLE community_resources 
ADD CONSTRAINT fk_community_resources_community_id 
FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

ALTER TABLE community_resources 
ADD CONSTRAINT fk_community_resources_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE resource_tag_assignments 
ADD CONSTRAINT fk_resource_tag_assignments_resource_id 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_tag_assignments 
ADD CONSTRAINT fk_resource_tag_assignments_tag_id 
FOREIGN KEY (tag_id) REFERENCES resource_tags(id) ON DELETE CASCADE;

ALTER TABLE resource_ratings 
ADD CONSTRAINT fk_resource_ratings_resource_id 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_ratings 
ADD CONSTRAINT fk_resource_ratings_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE resource_bookmarks 
ADD CONSTRAINT fk_resource_bookmarks_resource_id 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_bookmarks 
ADD CONSTRAINT fk_resource_bookmarks_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE resource_reports 
ADD CONSTRAINT fk_resource_reports_resource_id 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_reports 
ADD CONSTRAINT fk_resource_reports_reporter_id 
FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE resource_reports 
ADD CONSTRAINT fk_resource_reports_moderator_id 
FOREIGN KEY (moderator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add check constraints safely
DO $$ 
BEGIN
    -- Add resource type check constraint
    BEGIN
        ALTER TABLE community_resources 
        ADD CONSTRAINT chk_resource_type 
        CHECK (resource_type IN ('article', 'video', 'document', 'link', 'tool', 'service', 'event', 'course'));
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists, ignore
        NULL;
    END;

    -- Add price logic check constraint  
    BEGIN
        ALTER TABLE community_resources 
        ADD CONSTRAINT chk_price_logic 
        CHECK (
            (is_free = true AND price_amount IS NULL) OR
            (is_free = false AND price_amount IS NOT NULL AND price_amount > 0)
        );
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists, ignore
        NULL;
    END;
END $$;

-- Foreign key constraints added successfully
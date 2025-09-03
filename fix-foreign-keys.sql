-- Fix Foreign Key References for Resources Feature
-- This adds the missing foreign key constraints that might be causing the frontend query to fail

-- Add foreign key constraints that might be missing
ALTER TABLE community_resources 
ADD CONSTRAINT IF NOT EXISTS fk_community_resources_community_id 
FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

ALTER TABLE community_resources 
ADD CONSTRAINT IF NOT EXISTS fk_community_resources_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE resource_tag_assignments 
ADD CONSTRAINT IF NOT EXISTS fk_resource_tag_assignments_resource_id 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_tag_assignments 
ADD CONSTRAINT IF NOT EXISTS fk_resource_tag_assignments_tag_id 
FOREIGN KEY (tag_id) REFERENCES resource_tags(id) ON DELETE CASCADE;

ALTER TABLE resource_ratings 
ADD CONSTRAINT IF NOT EXISTS fk_resource_ratings_resource_id 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_ratings 
ADD CONSTRAINT IF NOT EXISTS fk_resource_ratings_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE resource_bookmarks 
ADD CONSTRAINT IF NOT EXISTS fk_resource_bookmarks_resource_id 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_bookmarks 
ADD CONSTRAINT IF NOT EXISTS fk_resource_bookmarks_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE resource_reports 
ADD CONSTRAINT IF NOT EXISTS fk_resource_reports_resource_id 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_reports 
ADD CONSTRAINT IF NOT EXISTS fk_resource_reports_reporter_id 
FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE resource_reports 
ADD CONSTRAINT IF NOT EXISTS fk_resource_reports_moderator_id 
FOREIGN KEY (moderator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Also add any missing check constraints
ALTER TABLE community_resources 
ADD CONSTRAINT IF NOT EXISTS chk_resource_type 
CHECK (resource_type IN ('article', 'video', 'document', 'link', 'tool', 'service', 'event', 'course'));

ALTER TABLE community_resources 
ADD CONSTRAINT IF NOT EXISTS chk_price_logic 
CHECK (
    (is_free = true AND price_amount IS NULL) OR
    (is_free = false AND price_amount IS NOT NULL AND price_amount > 0)
);

-- Foreign key constraints added successfully
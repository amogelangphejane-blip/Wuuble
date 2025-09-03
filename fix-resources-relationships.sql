-- Fix Resources Relationships with Profiles and Communities
-- This script adds the missing foreign key relationships

-- 1. First, check if the columns exist and add them if missing
ALTER TABLE community_resources 
DROP CONSTRAINT IF EXISTS community_resources_community_id_fkey,
DROP CONSTRAINT IF EXISTS community_resources_user_id_fkey,
DROP CONSTRAINT IF EXISTS community_resources_category_id_fkey;

-- 2. Add proper foreign key constraints
ALTER TABLE community_resources
ADD CONSTRAINT community_resources_community_id_fkey 
FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

ALTER TABLE community_resources
ADD CONSTRAINT community_resources_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE community_resources
ADD CONSTRAINT community_resources_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES resource_categories(id) ON DELETE SET NULL;

-- 3. Add foreign keys for other resource tables
ALTER TABLE resource_tag_assignments
DROP CONSTRAINT IF EXISTS resource_tag_assignments_resource_id_fkey,
DROP CONSTRAINT IF EXISTS resource_tag_assignments_tag_id_fkey;

ALTER TABLE resource_tag_assignments
ADD CONSTRAINT resource_tag_assignments_resource_id_fkey 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_tag_assignments
ADD CONSTRAINT resource_tag_assignments_tag_id_fkey 
FOREIGN KEY (tag_id) REFERENCES resource_tags(id) ON DELETE CASCADE;

-- 4. Add foreign keys for ratings
ALTER TABLE resource_ratings
DROP CONSTRAINT IF EXISTS resource_ratings_resource_id_fkey,
DROP CONSTRAINT IF EXISTS resource_ratings_user_id_fkey;

ALTER TABLE resource_ratings
ADD CONSTRAINT resource_ratings_resource_id_fkey 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_ratings
ADD CONSTRAINT resource_ratings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Add foreign keys for bookmarks
ALTER TABLE resource_bookmarks
DROP CONSTRAINT IF EXISTS resource_bookmarks_resource_id_fkey,
DROP CONSTRAINT IF EXISTS resource_bookmarks_user_id_fkey;

ALTER TABLE resource_bookmarks
ADD CONSTRAINT resource_bookmarks_resource_id_fkey 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_bookmarks
ADD CONSTRAINT resource_bookmarks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Add foreign keys for reports
ALTER TABLE resource_reports
DROP CONSTRAINT IF EXISTS resource_reports_resource_id_fkey,
DROP CONSTRAINT IF EXISTS resource_reports_reporter_id_fkey,
DROP CONSTRAINT IF EXISTS resource_reports_moderator_id_fkey;

ALTER TABLE resource_reports
ADD CONSTRAINT resource_reports_resource_id_fkey 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_reports
ADD CONSTRAINT resource_reports_reporter_id_fkey 
FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE resource_reports
ADD CONSTRAINT resource_reports_moderator_id_fkey 
FOREIGN KEY (moderator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 7. Create a view that joins resources with profiles for easier querying
CREATE OR REPLACE VIEW community_resources_with_profiles AS
SELECT 
    cr.*,
    p.display_name,
    p.avatar_url,
    p.bio,
    c.name as community_name,
    cat.name as category_name,
    cat.icon as category_icon,
    cat.color as category_color
FROM community_resources cr
LEFT JOIN profiles p ON cr.user_id = p.id
LEFT JOIN communities c ON cr.community_id = c.id
LEFT JOIN resource_categories cat ON cr.category_id = cat.id
WHERE cr.is_approved = true;

-- 8. Grant permissions on the view
GRANT SELECT ON community_resources_with_profiles TO anon, authenticated;

-- Done! The relationships are now properly established.
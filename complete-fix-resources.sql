-- Complete Fix for Resources Feature with Profiles Relationship
-- Run this entire script in Supabase SQL Editor

-- 1. Drop existing foreign key constraints if they exist
ALTER TABLE community_resources 
DROP CONSTRAINT IF EXISTS community_resources_community_id_fkey,
DROP CONSTRAINT IF EXISTS community_resources_user_id_fkey,
DROP CONSTRAINT IF EXISTS community_resources_category_id_fkey;

-- 2. Add proper foreign key constraints with correct names
ALTER TABLE community_resources
ADD CONSTRAINT community_resources_community_id_fkey 
FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

ALTER TABLE community_resources
ADD CONSTRAINT community_resources_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE community_resources
ADD CONSTRAINT community_resources_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES resource_categories(id) ON DELETE SET NULL;

-- 3. Fix other resource tables foreign keys
ALTER TABLE resource_tag_assignments
DROP CONSTRAINT IF EXISTS resource_tag_assignments_resource_id_fkey,
DROP CONSTRAINT IF EXISTS resource_tag_assignments_tag_id_fkey;

ALTER TABLE resource_tag_assignments
ADD CONSTRAINT resource_tag_assignments_resource_id_fkey 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_tag_assignments
ADD CONSTRAINT resource_tag_assignments_tag_id_fkey 
FOREIGN KEY (tag_id) REFERENCES resource_tags(id) ON DELETE CASCADE;

-- 4. Fix ratings foreign keys
ALTER TABLE resource_ratings
DROP CONSTRAINT IF EXISTS resource_ratings_resource_id_fkey,
DROP CONSTRAINT IF EXISTS resource_ratings_user_id_fkey;

ALTER TABLE resource_ratings
ADD CONSTRAINT resource_ratings_resource_id_fkey 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_ratings
ADD CONSTRAINT resource_ratings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5. Fix bookmarks foreign keys
ALTER TABLE resource_bookmarks
DROP CONSTRAINT IF EXISTS resource_bookmarks_resource_id_fkey,
DROP CONSTRAINT IF EXISTS resource_bookmarks_user_id_fkey;

ALTER TABLE resource_bookmarks
ADD CONSTRAINT resource_bookmarks_resource_id_fkey 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_bookmarks
ADD CONSTRAINT resource_bookmarks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 6. Fix reports foreign keys
ALTER TABLE resource_reports
DROP CONSTRAINT IF EXISTS resource_reports_resource_id_fkey,
DROP CONSTRAINT IF EXISTS resource_reports_reporter_id_fkey,
DROP CONSTRAINT IF EXISTS resource_reports_moderator_id_fkey;

ALTER TABLE resource_reports
ADD CONSTRAINT resource_reports_resource_id_fkey 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_reports
ADD CONSTRAINT resource_reports_reporter_id_fkey 
FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE resource_reports
ADD CONSTRAINT resource_reports_moderator_id_fkey 
FOREIGN KEY (moderator_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 7. Update RLS policies to use profiles instead of auth.users
DROP POLICY IF EXISTS "Authenticated users can create resources" ON community_resources;
DROP POLICY IF EXISTS "Users can update their own resources" ON community_resources;
DROP POLICY IF EXISTS "Users can delete their own resources" ON community_resources;

CREATE POLICY "Authenticated users can create resources" 
ON community_resources FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their own resources" 
ON community_resources FOR UPDATE 
USING (user_id IN (SELECT id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own resources" 
ON community_resources FOR DELETE 
USING (user_id IN (SELECT id FROM profiles WHERE id = auth.uid()));

-- 8. Update other RLS policies
DROP POLICY IF EXISTS "Authenticated users can create ratings" ON resource_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON resource_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON resource_ratings;

CREATE POLICY "Authenticated users can create ratings" 
ON resource_ratings FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their own ratings" 
ON resource_ratings FOR UPDATE 
USING (user_id IN (SELECT id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own ratings" 
ON resource_ratings FOR DELETE 
USING (user_id IN (SELECT id FROM profiles WHERE id = auth.uid()));

-- 9. Update bookmark policies
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON resource_bookmarks;
DROP POLICY IF EXISTS "Users can create bookmarks" ON resource_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON resource_bookmarks;

CREATE POLICY "Users can view their own bookmarks" 
ON resource_bookmarks FOR SELECT 
USING (user_id IN (SELECT id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create bookmarks" 
ON resource_bookmarks FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own bookmarks" 
ON resource_bookmarks FOR DELETE 
USING (user_id IN (SELECT id FROM profiles WHERE id = auth.uid()));

-- 10. Update report policies
DROP POLICY IF EXISTS "Users can create reports" ON resource_reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON resource_reports;

CREATE POLICY "Users can create reports" 
ON resource_reports FOR INSERT 
WITH CHECK (reporter_id IN (SELECT id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their own reports" 
ON resource_reports FOR SELECT 
USING (reporter_id IN (SELECT id FROM profiles WHERE id = auth.uid()));

-- Done! The relationships should now work correctly.
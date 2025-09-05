-- Fix Tags Schema Cache Issue for Community Resources
-- This resolves the "could not find the 'tags' column of 'community_resources' in the schema cache" error

-- Step 1: Ensure all tables exist and have proper structure
CREATE TABLE IF NOT EXISTS resource_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name)
);

CREATE TABLE IF NOT EXISTS resource_tag_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, tag_id)
);

-- Step 2: Fix foreign key constraints (drop and recreate to ensure they exist)
ALTER TABLE resource_tag_assignments 
DROP CONSTRAINT IF EXISTS resource_tag_assignments_resource_id_fkey,
DROP CONSTRAINT IF EXISTS resource_tag_assignments_tag_id_fkey;

ALTER TABLE resource_tag_assignments
ADD CONSTRAINT resource_tag_assignments_resource_id_fkey 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_tag_assignments
ADD CONSTRAINT resource_tag_assignments_tag_id_fkey 
FOREIGN KEY (tag_id) REFERENCES resource_tags(id) ON DELETE CASCADE;

-- Step 3: Enable RLS on tags tables if not already enabled
ALTER TABLE resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Step 4: Create or update RLS policies
DROP POLICY IF EXISTS "Anyone can view resource tags" ON resource_tags;
CREATE POLICY "Anyone can view resource tags" ON resource_tags
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create tags" ON resource_tags;
CREATE POLICY "Authenticated users can create tags" ON resource_tags
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view tag assignments for accessible resources" ON resource_tag_assignments;
CREATE POLICY "Users can view tag assignments for accessible resources" ON resource_tag_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_resources cr
            JOIN community_members cm ON cm.community_id = cr.community_id
            WHERE cr.id = resource_tag_assignments.resource_id
            AND (cm.user_id = auth.uid() OR cr.user_id = auth.uid())
            AND cr.is_approved = true
        )
    );

DROP POLICY IF EXISTS "Resource owners can manage tag assignments" ON resource_tag_assignments;
CREATE POLICY "Resource owners can manage tag assignments" ON resource_tag_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM community_resources cr
            WHERE cr.id = resource_tag_assignments.resource_id
            AND cr.user_id = auth.uid()
        )
    );

-- Step 5: Create helper function to get tags for a resource
CREATE OR REPLACE FUNCTION get_resource_tags(resource_id UUID)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', rt.id,
                'name', rt.name
            )
        ), '[]'::json)
        FROM resource_tag_assignments rta
        JOIN resource_tags rt ON rta.tag_id = rt.id
        WHERE rta.resource_id = get_resource_tags.resource_id
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Step 6: Create improved view that includes tags properly
DROP VIEW IF EXISTS community_resources_with_tags;
CREATE VIEW community_resources_with_tags AS
SELECT 
    cr.*,
    rc.name as category_name,
    rc.icon as category_icon,
    rc.color as category_color,
    p.display_name as user_display_name,
    p.avatar_url as user_avatar_url,
    get_resource_tags(cr.id) as tags
FROM community_resources cr
LEFT JOIN resource_categories rc ON cr.category_id = rc.id
LEFT JOIN profiles p ON cr.user_id = p.id;

-- Step 7: Grant necessary permissions
GRANT SELECT ON resource_tags TO anon, authenticated;
GRANT ALL ON resource_tags TO authenticated;
GRANT SELECT ON resource_tag_assignments TO anon, authenticated;
GRANT ALL ON resource_tag_assignments TO authenticated;
GRANT SELECT ON community_resources_with_tags TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_resource_tags TO anon, authenticated;

-- Step 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resource_tag_assignments_resource_id ON resource_tag_assignments(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_tag_assignments_tag_id ON resource_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_resource_tags_name ON resource_tags(name);

-- Step 9: Refresh schema cache (this forces Supabase to update its internal schema cache)
NOTIFY pgrst, 'reload schema';

-- Step 10: Add some default tags if none exist
INSERT INTO resource_tags (name) VALUES 
    ('Tutorial'),
    ('Guide'),
    ('Tool'),
    ('Resource'),
    ('Article'),
    ('Video'),
    ('Free'),
    ('Paid'),
    ('Beginner'),
    ('Advanced')
ON CONFLICT (name) DO NOTHING;

-- Final comment
COMMENT ON VIEW community_resources_with_tags IS 'Community resources with properly joined tags data - use this instead of trying to access tags column directly';
COMMENT ON FUNCTION get_resource_tags IS 'Returns tags for a resource as JSON array - use this to get tags for a specific resource';
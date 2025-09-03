-- Fix Tags Relationship for Community Resources
-- This fixes the "could not find tags column" error

-- 1. Make sure the resource_tag_assignments table has proper foreign keys
ALTER TABLE resource_tag_assignments 
DROP CONSTRAINT IF EXISTS resource_tag_assignments_resource_id_fkey,
DROP CONSTRAINT IF EXISTS resource_tag_assignments_tag_id_fkey;

ALTER TABLE resource_tag_assignments
ADD CONSTRAINT resource_tag_assignments_resource_id_fkey 
FOREIGN KEY (resource_id) REFERENCES community_resources(id) ON DELETE CASCADE;

ALTER TABLE resource_tag_assignments
ADD CONSTRAINT resource_tag_assignments_tag_id_fkey 
FOREIGN KEY (tag_id) REFERENCES resource_tags(id) ON DELETE CASCADE;

-- 2. Create a simpler view for resources with all relationships
DROP VIEW IF EXISTS community_resources_view;
CREATE VIEW community_resources_view AS
SELECT 
    cr.*,
    rc.name as category_name,
    rc.icon as category_icon,
    rc.color as category_color,
    p.display_name as user_display_name,
    p.avatar_url as user_avatar_url
FROM community_resources cr
LEFT JOIN resource_categories rc ON cr.category_id = rc.id
LEFT JOIN profiles p ON cr.user_id = p.id;

-- 3. Grant permissions
GRANT SELECT ON community_resources_view TO anon, authenticated;

-- 4. Create a function to get tags for a resource
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
$$ LANGUAGE plpgsql STABLE;

-- 5. Create a function to get resource with all data
CREATE OR REPLACE FUNCTION get_resources_with_details(community_uuid UUID)
RETURNS TABLE (
    id UUID,
    community_id UUID,
    user_id UUID,
    title VARCHAR(255),
    description TEXT,
    resource_type VARCHAR(50),
    content_url TEXT,
    file_url TEXT,
    category_id UUID,
    location VARCHAR(255),
    is_free BOOLEAN,
    price_amount DECIMAL(10,2),
    price_currency VARCHAR(3),
    is_featured BOOLEAN,
    is_approved BOOLEAN,
    view_count INTEGER,
    created_at TIMESTAMPTZ,
    category_name VARCHAR(100),
    category_icon VARCHAR(50),
    category_color VARCHAR(7),
    user_display_name TEXT,
    user_avatar_url TEXT,
    tags JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id,
        cr.community_id,
        cr.user_id,
        cr.title,
        cr.description,
        cr.resource_type,
        cr.content_url,
        cr.file_url,
        cr.category_id,
        cr.location,
        cr.is_free,
        cr.price_amount,
        cr.price_currency,
        cr.is_featured,
        cr.is_approved,
        cr.view_count,
        cr.created_at,
        rc.name as category_name,
        rc.icon as category_icon,
        rc.color as category_color,
        p.display_name as user_display_name,
        p.avatar_url as user_avatar_url,
        get_resource_tags(cr.id) as tags
    FROM community_resources cr
    LEFT JOIN resource_categories rc ON cr.category_id = rc.id
    LEFT JOIN profiles p ON cr.user_id = p.id
    WHERE cr.community_id = community_uuid
    AND cr.is_approved = true;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_resource_tags TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_resources_with_details TO anon, authenticated;

-- Done! Tags relationship is now properly set up
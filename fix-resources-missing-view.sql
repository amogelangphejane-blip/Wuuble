-- Fix for Resources Feature - Add Missing Database View
-- This SQL creates the view that SimpleCommunityResources component expects

-- Create the view that SimpleCommunityResources component expects
CREATE OR REPLACE VIEW community_resources_with_tags AS
SELECT 
    cr.id,
    cr.community_id,
    cr.user_id,
    cr.title,
    cr.description,
    cr.resource_type,
    cr.content_url,
    cr.file_url,
    cr.location,
    cr.is_free,
    cr.price_amount,
    cr.price_currency,
    cr.is_featured,
    cr.is_approved,
    cr.is_flagged,
    cr.flag_reason,
    cr.view_count,
    cr.click_count,
    cr.created_at,
    cr.updated_at,
    cr.expires_at,
    cr.category_id,
    
    -- Category information
    rc.name as category_name,
    rc.color as category_color,
    rc.icon as category_icon,
    rc.description as category_description,
    
    -- Aggregated tags as JSON
    COALESCE(
        json_agg(
            json_build_object(
                'id', rt.id,
                'name', rt.name
            )
        ) FILTER (WHERE rt.id IS NOT NULL), 
        '[]'::json
    ) as tags,
    
    -- Rating statistics
    COALESCE(AVG(rr.rating), 0) as average_rating,
    COUNT(rr.id) as rating_count,
    
    -- User-specific information (requires authentication)
    EXISTS(
        SELECT 1 FROM resource_bookmarks rb 
        WHERE rb.resource_id = cr.id 
        AND rb.user_id = auth.uid()
    ) as is_bookmarked,
    
    EXISTS(
        SELECT 1 FROM resource_ratings ur 
        WHERE ur.resource_id = cr.id 
        AND ur.user_id = auth.uid()
    ) as user_has_rated

FROM community_resources cr
LEFT JOIN resource_categories rc ON cr.category_id = rc.id
LEFT JOIN resource_tag_assignments rta ON cr.id = rta.resource_id
LEFT JOIN resource_tags rt ON rta.tag_id = rt.id
LEFT JOIN resource_ratings rr ON cr.id = rr.resource_id
GROUP BY 
    cr.id, cr.community_id, cr.user_id, cr.title, cr.description, 
    cr.resource_type, cr.content_url, cr.file_url, cr.location, 
    cr.is_free, cr.price_amount, cr.price_currency, cr.is_featured, 
    cr.is_approved, cr.is_flagged, cr.flag_reason, cr.view_count, 
    cr.click_count, cr.created_at, cr.updated_at, cr.expires_at, 
    cr.category_id, rc.name, rc.color, rc.icon, rc.description;

-- Grant permissions on the view
GRANT SELECT ON community_resources_with_tags TO authenticated;

-- Add helpful comment
COMMENT ON VIEW community_resources_with_tags IS 'Comprehensive view of community resources with category info, tags, ratings, and user-specific data';

-- Create an index on the view for better performance
CREATE INDEX IF NOT EXISTS idx_community_resources_with_tags_community_id 
ON community_resources (community_id, is_approved, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_resources_with_tags_category 
ON community_resources (category_id, is_approved);

CREATE INDEX IF NOT EXISTS idx_community_resources_with_tags_user 
ON community_resources (user_id, is_approved);
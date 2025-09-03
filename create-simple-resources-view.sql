-- Create a simplified view for resources without tags
-- This completely bypasses the tags issue

-- Drop the old view if it exists
DROP VIEW IF EXISTS simple_community_resources CASCADE;

-- Create a new simplified view
CREATE VIEW simple_community_resources AS
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
    cr.is_flagged,
    cr.flag_reason,
    cr.view_count,
    cr.click_count,
    cr.created_at,
    cr.updated_at,
    cr.expires_at,
    -- Category info
    rc.name as category_name,
    rc.icon as category_icon,
    rc.color as category_color,
    -- User info
    p.display_name as user_display_name,
    p.avatar_url as user_avatar_url
FROM community_resources cr
LEFT JOIN resource_categories rc ON cr.category_id = rc.id
LEFT JOIN profiles p ON cr.user_id = p.id
WHERE cr.is_approved = true;

-- Grant permissions
GRANT SELECT ON simple_community_resources TO anon, authenticated;

-- Create RLS policy
ALTER VIEW simple_community_resources SET (security_invoker = true);

-- Test the view
SELECT COUNT(*) as resource_count FROM simple_community_resources;
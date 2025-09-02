-- Community Resources Feature Database Schema
-- This migration adds the community resources feature with search, filtering, and user-generated content

-- Create resource_categories table
CREATE TABLE IF NOT EXISTS resource_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- Lucide icon name
    color VARCHAR(7), -- Hex color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(name)
);

-- Create community_resources table
CREATE TABLE IF NOT EXISTS community_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('article', 'video', 'document', 'link', 'tool', 'service', 'event', 'course')),
    content_url TEXT, -- External URL or file path
    file_url TEXT, -- For uploaded files
    category_id UUID REFERENCES resource_categories(id) ON DELETE SET NULL,
    location VARCHAR(255), -- For location-based resources
    is_free BOOLEAN DEFAULT true,
    price_amount DECIMAL(10,2), -- For paid resources
    price_currency VARCHAR(3) DEFAULT 'USD',
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true, -- For moderation
    is_flagged BOOLEAN DEFAULT false,
    flag_reason TEXT,
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- For time-limited resources
    
    CONSTRAINT valid_price CHECK (
        (is_free = true AND price_amount IS NULL) OR
        (is_free = false AND price_amount IS NOT NULL AND price_amount > 0)
    )
);

-- Create resource_tags table
CREATE TABLE IF NOT EXISTS resource_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(name)
);

-- Create resource_tag_assignments table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS resource_tag_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES community_resources(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES resource_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(resource_id, tag_id)
);

-- Create resource_ratings table
CREATE TABLE IF NOT EXISTS resource_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES community_resources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    is_helpful BOOLEAN, -- Upvote/downvote
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(resource_id, user_id) -- One rating per user per resource
);

-- Create resource_bookmarks table
CREATE TABLE IF NOT EXISTS resource_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES community_resources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(resource_id, user_id)
);

-- Create resource_reports table for moderation
CREATE TABLE IF NOT EXISTS resource_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES community_resources(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'outdated', 'broken_link', 'copyright', 'other')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    moderator_id UUID REFERENCES auth.users(id),
    moderator_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_resources_community_id ON community_resources(community_id);
CREATE INDEX IF NOT EXISTS idx_community_resources_user_id ON community_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_community_resources_category_id ON community_resources(category_id);
CREATE INDEX IF NOT EXISTS idx_community_resources_type ON community_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_community_resources_featured ON community_resources(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_community_resources_approved ON community_resources(is_approved) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_community_resources_created_at ON community_resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_resources_title_search ON community_resources USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_community_resources_description_search ON community_resources USING GIN(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_community_resources_location ON community_resources(location) WHERE location IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resource_ratings_resource_id ON resource_ratings(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_ratings_user_id ON resource_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_ratings_rating ON resource_ratings(rating);

CREATE INDEX IF NOT EXISTS idx_resource_bookmarks_resource_id ON resource_bookmarks(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_bookmarks_user_id ON resource_bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_resource_tag_assignments_resource_id ON resource_tag_assignments(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_tag_assignments_tag_id ON resource_tag_assignments(tag_id);

CREATE INDEX IF NOT EXISTS idx_resource_reports_resource_id ON resource_reports(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_reports_status ON resource_reports(status);

-- Enable Row Level Security (RLS)
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resource_categories (public read)
CREATE POLICY "Anyone can view resource categories" ON resource_categories
    FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can create categories" ON resource_categories
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for community_resources
CREATE POLICY "Users can view approved resources in accessible communities" ON community_resources
    FOR SELECT USING (
        is_approved = true AND
        (EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = community_resources.community_id
            AND cm.user_id = auth.uid()
        ) OR user_id = auth.uid())
    );

CREATE POLICY "Members can create resources in their communities" ON community_resources
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = community_resources.community_id
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own resources" ON community_resources
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resources" ON community_resources
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for resource_tags (public read, authenticated create)
CREATE POLICY "Anyone can view resource tags" ON resource_tags
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create tags" ON resource_tags
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for resource_tag_assignments
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

CREATE POLICY "Resource owners can manage tag assignments" ON resource_tag_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM community_resources cr
            WHERE cr.id = resource_tag_assignments.resource_id
            AND cr.user_id = auth.uid()
        )
    );

-- RLS Policies for resource_ratings
CREATE POLICY "Users can view ratings for accessible resources" ON resource_ratings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_resources cr
            JOIN community_members cm ON cm.community_id = cr.community_id
            WHERE cr.id = resource_ratings.resource_id
            AND (cm.user_id = auth.uid() OR cr.user_id = auth.uid())
            AND cr.is_approved = true
        )
    );

CREATE POLICY "Users can create ratings for accessible resources" ON resource_ratings
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM community_resources cr
            JOIN community_members cm ON cm.community_id = cr.community_id
            WHERE cr.id = resource_ratings.resource_id
            AND cm.user_id = auth.uid()
            AND cr.is_approved = true
        )
    );

CREATE POLICY "Users can update their own ratings" ON resource_ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON resource_ratings
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for resource_bookmarks
CREATE POLICY "Users can view their own bookmarks" ON resource_bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks for accessible resources" ON resource_bookmarks
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM community_resources cr
            JOIN community_members cm ON cm.community_id = cr.community_id
            WHERE cr.id = resource_bookmarks.resource_id
            AND cm.user_id = auth.uid()
            AND cr.is_approved = true
        )
    );

CREATE POLICY "Users can delete their own bookmarks" ON resource_bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for resource_reports
CREATE POLICY "Users can view their own reports" ON resource_reports
    FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports for accessible resources" ON resource_reports
    FOR INSERT WITH CHECK (
        auth.uid() = reporter_id AND
        EXISTS (
            SELECT 1 FROM community_resources cr
            JOIN community_members cm ON cm.community_id = cr.community_id
            WHERE cr.id = resource_reports.resource_id
            AND cm.user_id = auth.uid()
        )
    );

-- Functions for computed fields and triggers

-- Function to calculate average rating for a resource
CREATE OR REPLACE FUNCTION get_resource_average_rating(resource_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        SELECT ROUND(AVG(rating::decimal), 2)
        FROM resource_ratings 
        WHERE resource_id = resource_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get rating count for a resource
CREATE OR REPLACE FUNCTION get_resource_rating_count(resource_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::integer
        FROM resource_ratings 
        WHERE resource_id = resource_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update resource updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_community_resources_updated_at
    BEFORE UPDATE ON community_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_ratings_updated_at
    BEFORE UPDATE ON resource_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_resource_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE community_resources 
    SET view_count = view_count + 1 
    WHERE id = NEW.resource_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Insert default categories
INSERT INTO resource_categories (name, description, icon, color) VALUES
('Jobs', 'Job postings and career opportunities', 'briefcase', '#3b82f6'),
('Housing', 'Housing listings and real estate', 'home', '#10b981'),
('Events', 'Community events and gatherings', 'calendar', '#f59e0b'),
('Health & Wellness', 'Health resources and wellness tips', 'heart', '#ef4444'),
('Education', 'Learning resources and courses', 'graduation-cap', '#8b5cf6'),
('Local Services', 'Local businesses and services', 'map-pin', '#06b6d4'),
('Articles', 'Articles and blog posts', 'file-text', '#84cc16'),
('Videos', 'Video content and tutorials', 'play-circle', '#ec4899'),
('Tools & Software', 'Useful tools and software', 'wrench', '#f97316'),
('Community News', 'News and announcements', 'newspaper', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT ON resource_categories TO authenticated;
GRANT ALL ON community_resources TO authenticated;
GRANT ALL ON resource_tags TO authenticated;
GRANT ALL ON resource_tag_assignments TO authenticated;
GRANT ALL ON resource_ratings TO authenticated;
GRANT ALL ON resource_bookmarks TO authenticated;
GRANT ALL ON resource_reports TO authenticated;

-- Add helpful comments
COMMENT ON TABLE resource_categories IS 'Categories for organizing community resources';
COMMENT ON TABLE community_resources IS 'User-submitted resources for community members';
COMMENT ON TABLE resource_tags IS 'Tags for flexible resource organization';
COMMENT ON TABLE resource_tag_assignments IS 'Many-to-many relationship between resources and tags';
COMMENT ON TABLE resource_ratings IS 'User ratings and reviews for resources';
COMMENT ON TABLE resource_bookmarks IS 'User bookmarks for saving resources';
COMMENT ON TABLE resource_reports IS 'User reports for resource moderation';

COMMENT ON COLUMN community_resources.resource_type IS 'Type of resource: article, video, document, link, tool, service, event, course';
COMMENT ON COLUMN community_resources.is_featured IS 'Whether the resource is featured/highlighted';
COMMENT ON COLUMN community_resources.is_approved IS 'Whether the resource is approved by moderators';
COMMENT ON COLUMN community_resources.view_count IS 'Number of times the resource has been viewed';
COMMENT ON COLUMN community_resources.click_count IS 'Number of times the resource link has been clicked';
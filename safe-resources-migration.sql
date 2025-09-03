-- Safe Resources Migration Script (Handles Existing Tables/Policies)
-- This script checks for existing objects before creating them

-- 1. Create tables if they don't exist
CREATE TABLE IF NOT EXISTS resource_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    content_url TEXT,
    file_url TEXT,
    category_id UUID REFERENCES resource_categories(id) ON DELETE SET NULL,
    location VARCHAR(255),
    is_free BOOLEAN DEFAULT true,
    price_amount DECIMAL(10,2),
    price_currency VARCHAR(3) DEFAULT 'USD',
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    is_flagged BOOLEAN DEFAULT false,
    flag_reason TEXT,
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS resource_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_tag_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, tag_id)
);

CREATE TABLE IF NOT EXISTS resource_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    is_helpful BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, user_id)
);

CREATE TABLE IF NOT EXISTS resource_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, user_id)
);

CREATE TABLE IF NOT EXISTS resource_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL,
    reporter_id UUID NOT NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    moderator_id UUID,
    moderator_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create indexes (IF NOT EXISTS prevents errors)
CREATE INDEX IF NOT EXISTS idx_community_resources_community_id ON community_resources(community_id);
CREATE INDEX IF NOT EXISTS idx_community_resources_category_id ON community_resources(category_id);
CREATE INDEX IF NOT EXISTS idx_community_resources_user_id ON community_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_community_resources_type ON community_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_community_resources_approved ON community_resources(is_approved);
CREATE INDEX IF NOT EXISTS idx_community_resources_featured ON community_resources(is_featured);
CREATE INDEX IF NOT EXISTS idx_resource_tag_assignments_resource ON resource_tag_assignments(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_tag_assignments_tag ON resource_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_resource_ratings_resource ON resource_ratings(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_bookmarks_user ON resource_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_reports_resource ON resource_reports(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_reports_status ON resource_reports(status);

-- 3. Insert default categories (ON CONFLICT prevents duplicates)
INSERT INTO resource_categories (name, description, icon, color) VALUES
('Jobs & Careers', 'Employment opportunities and career development resources', 'Briefcase', '#3B82F6'),
('Housing & Accommodation', 'Housing, rentals, and accommodation options', 'Home', '#10B981'),
('Events & Meetups', 'Community events, workshops, and social gatherings', 'Calendar', '#F59E0B'),
('Education & Training', 'Educational courses, tutorials, and learning materials', 'GraduationCap', '#8B5CF6'),
('Services & Support', 'Professional services and community support', 'HeartHandshake', '#EC4899'),
('For Sale & Trade', 'Items for sale, trade, or giveaway', 'ShoppingBag', '#F97316'),
('Health & Wellness', 'Health resources and wellness programs', 'Heart', '#EF4444'),
('Legal & Financial', 'Legal advice and financial resources', 'Scale', '#6366F1'),
('Transportation', 'Transport services and vehicle-related resources', 'Car', '#06B6D4'),
('General Resources', 'Miscellaneous community resources', 'Package', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- 4. Enable RLS (safe to run multiple times)
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_reports ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Anyone can view categories" ON resource_categories;
DROP POLICY IF EXISTS "Anyone can view approved resources" ON community_resources;
DROP POLICY IF EXISTS "Authenticated users can create resources" ON community_resources;
DROP POLICY IF EXISTS "Users can update their own resources" ON community_resources;
DROP POLICY IF EXISTS "Users can delete their own resources" ON community_resources;
DROP POLICY IF EXISTS "Anyone can view tags" ON resource_tags;
DROP POLICY IF EXISTS "Authenticated users can create tags" ON resource_tags;
DROP POLICY IF EXISTS "Anyone can view tag assignments" ON resource_tag_assignments;
DROP POLICY IF EXISTS "Resource owners can manage tags" ON resource_tag_assignments;
DROP POLICY IF EXISTS "Anyone can view ratings" ON resource_ratings;
DROP POLICY IF EXISTS "Authenticated users can create ratings" ON resource_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON resource_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON resource_ratings;
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON resource_bookmarks;
DROP POLICY IF EXISTS "Users can create bookmarks" ON resource_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON resource_bookmarks;
DROP POLICY IF EXISTS "Users can create reports" ON resource_reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON resource_reports;

-- 6. Create all policies fresh
CREATE POLICY "Anyone can view categories" 
ON resource_categories FOR SELECT 
USING (true);

CREATE POLICY "Anyone can view approved resources" 
ON community_resources FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Authenticated users can create resources" 
ON community_resources FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resources" 
ON community_resources FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resources" 
ON community_resources FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view tags" 
ON resource_tags FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create tags" 
ON resource_tags FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view tag assignments" 
ON resource_tag_assignments FOR SELECT 
USING (true);

CREATE POLICY "Resource owners can manage tags" 
ON resource_tag_assignments FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM community_resources 
        WHERE id = resource_tag_assignments.resource_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Anyone can view ratings" 
ON resource_ratings FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create ratings" 
ON resource_ratings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
ON resource_ratings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" 
ON resource_ratings FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own bookmarks" 
ON resource_bookmarks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks" 
ON resource_bookmarks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
ON resource_bookmarks FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports" 
ON resource_reports FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" 
ON resource_reports FOR SELECT 
USING (auth.uid() = reporter_id);

-- Migration complete! The Resources feature should now work.
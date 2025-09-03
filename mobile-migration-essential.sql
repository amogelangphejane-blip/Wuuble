-- Essential Resources Tables for Mobile Copy
-- Run this in Supabase SQL Editor

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS resource_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create main resources table
CREATE TABLE IF NOT EXISTS community_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    content_url TEXT,
    file_url TEXT,
    category_id UUID REFERENCES resource_categories(id),
    location VARCHAR(255),
    is_free BOOLEAN DEFAULT true,
    price_amount DECIMAL(10,2),
    price_currency VARCHAR(3) DEFAULT 'USD',
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create tags table
CREATE TABLE IF NOT EXISTS resource_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create tag assignments
CREATE TABLE IF NOT EXISTS resource_tag_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES community_resources(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES resource_tags(id) ON DELETE CASCADE,
    UNIQUE(resource_id, tag_id)
);

-- 5. Create ratings table
CREATE TABLE IF NOT EXISTS resource_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES community_resources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, user_id)
);

-- 6. Create bookmarks table
CREATE TABLE IF NOT EXISTS resource_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES community_resources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, user_id)
);

-- 7. Create reports table
CREATE TABLE IF NOT EXISTS resource_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES community_resources(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Insert default categories
INSERT INTO resource_categories (name, description, icon, color) VALUES
('Jobs & Careers', 'Employment opportunities and career resources', 'Briefcase', '#3B82F6'),
('Housing & Accommodation', 'Housing, rentals, and accommodation options', 'Home', '#10B981'),
('Events & Meetups', 'Community events, workshops, and gatherings', 'Calendar', '#F59E0B'),
('Education & Training', 'Courses, tutorials, and learning resources', 'GraduationCap', '#8B5CF6'),
('Services & Support', 'Professional and community services', 'HeartHandshake', '#EC4899'),
('For Sale & Trade', 'Items for sale, trade, or giveaway', 'ShoppingBag', '#F97316'),
('Health & Wellness', 'Health resources and wellness programs', 'Heart', '#EF4444'),
('Legal & Financial', 'Legal advice and financial resources', 'Scale', '#6366F1'),
('Transportation', 'Transport services and vehicle-related resources', 'Car', '#06B6D4'),
('General Resources', 'Miscellaneous community resources', 'Package', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- 9. Enable Row Level Security
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_reports ENABLE ROW LEVEL SECURITY;

-- 10. Create basic RLS policies for viewing
CREATE POLICY "Anyone can view categories" ON resource_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view approved resources" ON community_resources FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can create resources" ON community_resources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resources" ON community_resources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resources" ON community_resources FOR DELETE USING (auth.uid() = user_id);
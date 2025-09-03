-- Create community_about table for storing customizable about page data
CREATE TABLE IF NOT EXISTS community_about (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    description TEXT,
    long_description TEXT,
    website_url TEXT,
    contact_email TEXT,
    phone_number TEXT,
    location TEXT,
    founded_date TIMESTAMP WITH TIME ZONE,
    mission_statement TEXT,
    vision_statement TEXT,
    values JSONB DEFAULT '[]'::jsonb,
    social_links JSONB DEFAULT '{}'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    achievements JSONB DEFAULT '[]'::jsonb,
    statistics JSONB DEFAULT '{}'::jsonb,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    rules JSONB DEFAULT '[]'::jsonb,
    faqs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(community_id)
);

-- Enable Row Level Security
ALTER TABLE community_about ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read about data for public communities
CREATE POLICY "Public communities about data is viewable by everyone" ON community_about
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM communities 
            WHERE communities.id = community_about.community_id 
            AND communities.is_private = false
        )
    );

-- Policy: Members can read about data for private communities they belong to
CREATE POLICY "Members can view private community about data" ON community_about
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM communities 
            WHERE communities.id = community_about.community_id 
            AND communities.is_private = true
        ) AND EXISTS (
            SELECT 1 FROM community_members 
            WHERE community_members.community_id = community_about.community_id 
            AND community_members.user_id = auth.uid()
        )
    );

-- Policy: Community creators can insert/update/delete about data
CREATE POLICY "Community creators can manage about data" ON community_about
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM communities 
            WHERE communities.id = community_about.community_id 
            AND communities.creator_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_community_about_community_id ON community_about(community_id);
CREATE INDEX idx_community_about_tags ON community_about USING GIN(tags);
CREATE INDEX idx_community_about_social_links ON community_about USING GIN(social_links);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_community_about_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_community_about_updated_at
    BEFORE UPDATE ON community_about
    FOR EACH ROW
    EXECUTE FUNCTION update_community_about_updated_at();

-- Grant permissions
GRANT SELECT ON community_about TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON community_about TO authenticated;
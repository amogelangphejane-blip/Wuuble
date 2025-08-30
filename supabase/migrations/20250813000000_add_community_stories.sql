-- Community Stories Feature Database Schema
-- This migration adds the community stories/status feature

-- Create community_stories table
CREATE TABLE IF NOT EXISTS community_stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('text', 'image', 'video')),
    content_url TEXT, -- For image/video stories
    text_content TEXT, -- For text stories
    background_color VARCHAR(7), -- Hex color for text stories
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    view_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    CONSTRAINT stories_content_check CHECK (
        (content_type = 'text' AND text_content IS NOT NULL) OR
        (content_type IN ('image', 'video') AND content_url IS NOT NULL)
    )
);

-- Create community_story_views table to track who viewed which stories
CREATE TABLE IF NOT EXISTS community_story_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES community_stories(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(story_id, viewer_id) -- Prevent duplicate views from same user
);

-- Create community_story_reactions table for likes/reactions
CREATE TABLE IF NOT EXISTS community_story_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES community_stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(story_id, user_id) -- One reaction per user per story
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_stories_community_id ON community_stories(community_id);
CREATE INDEX IF NOT EXISTS idx_community_stories_user_id ON community_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_community_stories_created_at ON community_stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_stories_expires_at ON community_stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_community_stories_active ON community_stories(is_active, expires_at) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON community_story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON community_story_views(viewer_id);

CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON community_story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user_id ON community_story_reactions(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE community_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_story_reactions ENABLE ROW LEVEL SECURITY;

-- Community Stories Policies
-- Users can view stories from communities they are members of
CREATE POLICY "Users can view community stories they have access to" ON community_stories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = community_stories.community_id
            AND cm.user_id = auth.uid()
        ) OR user_id = auth.uid()
    );

-- Users can create stories in communities they are members of
CREATE POLICY "Users can create stories in their communities" ON community_stories
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = community_stories.community_id
            AND cm.user_id = auth.uid()
        )
    );

-- Users can update their own stories
CREATE POLICY "Users can update their own stories" ON community_stories
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "Users can delete their own stories" ON community_stories
    FOR DELETE USING (auth.uid() = user_id);

-- Story Views Policies
-- Users can view story views for stories they can access
CREATE POLICY "Users can view story views for accessible stories" ON community_story_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_stories cs
            JOIN community_members cm ON cm.community_id = cs.community_id
            WHERE cs.id = community_story_views.story_id
            AND (cm.user_id = auth.uid() OR cs.user_id = auth.uid())
        )
    );

-- Users can create views for stories they can access
CREATE POLICY "Users can create story views" ON community_story_views
    FOR INSERT WITH CHECK (
        auth.uid() = viewer_id AND
        EXISTS (
            SELECT 1 FROM community_stories cs
            JOIN community_members cm ON cm.community_id = cs.community_id
            WHERE cs.id = community_story_views.story_id
            AND cm.user_id = auth.uid()
        )
    );

-- Story Reactions Policies
-- Users can view reactions for stories they can access
CREATE POLICY "Users can view story reactions for accessible stories" ON community_story_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_stories cs
            JOIN community_members cm ON cm.community_id = cs.community_id
            WHERE cs.id = community_story_reactions.story_id
            AND cm.user_id = auth.uid()
        )
    );

-- Users can create reactions for stories they can access
CREATE POLICY "Users can create story reactions" ON community_story_reactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM community_stories cs
            JOIN community_members cm ON cm.community_id = cs.community_id
            WHERE cs.id = community_story_reactions.story_id
            AND cm.user_id = auth.uid()
        )
    );

-- Users can update their own reactions
CREATE POLICY "Users can update their own story reactions" ON community_story_reactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own story reactions" ON community_story_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically clean up expired stories
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void AS $$
BEGIN
    UPDATE community_stories 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update story view count when a new view is added
CREATE OR REPLACE FUNCTION update_story_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE community_stories 
    SET view_count = view_count + 1 
    WHERE id = NEW.story_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update view count
CREATE TRIGGER trigger_update_story_view_count
    AFTER INSERT ON community_story_views
    FOR EACH ROW
    EXECUTE FUNCTION update_story_view_count();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON community_stories TO authenticated;
GRANT SELECT, INSERT ON community_story_views TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON community_story_reactions TO authenticated;

-- Add helpful comments
COMMENT ON TABLE community_stories IS 'Stores community stories/status updates that expire after 24 hours';
COMMENT ON TABLE community_story_views IS 'Tracks which users have viewed which stories';
COMMENT ON TABLE community_story_reactions IS 'Stores user reactions (likes, etc.) to stories';

COMMENT ON COLUMN community_stories.content_type IS 'Type of story content: text, image, or video';
COMMENT ON COLUMN community_stories.expires_at IS 'When the story expires (typically 24 hours from creation)';
COMMENT ON COLUMN community_stories.view_count IS 'Number of times the story has been viewed';
COMMENT ON COLUMN community_stories.is_active IS 'Whether the story is currently active (not expired)';
-- Community Links Feature Migration
-- This migration adds tables for community link sharing functionality

-- Create community_links table
CREATE TABLE IF NOT EXISTS community_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  domain TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_url CHECK (url ~* '^https?://'),
  CONSTRAINT title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  CONSTRAINT description_length CHECK (char_length(description) <= 500)
);

-- Create community_link_likes table
CREATE TABLE IF NOT EXISTS community_link_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES community_links(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure user can only like a link once
  UNIQUE(link_id, user_id)
);

-- Create community_link_bookmarks table
CREATE TABLE IF NOT EXISTS community_link_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES community_links(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure user can only bookmark a link once
  UNIQUE(link_id, user_id)
);

-- Create community_link_comments table
CREATE TABLE IF NOT EXISTS community_link_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES community_links(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT comment_length CHECK (char_length(content) >= 1 AND char_length(content) <= 1000)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_links_community_id ON community_links(community_id);
CREATE INDEX IF NOT EXISTS idx_community_links_user_id ON community_links(user_id);
CREATE INDEX IF NOT EXISTS idx_community_links_created_at ON community_links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_links_domain ON community_links(domain);

CREATE INDEX IF NOT EXISTS idx_community_link_likes_link_id ON community_link_likes(link_id);
CREATE INDEX IF NOT EXISTS idx_community_link_likes_user_id ON community_link_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_community_link_bookmarks_link_id ON community_link_bookmarks(link_id);
CREATE INDEX IF NOT EXISTS idx_community_link_bookmarks_user_id ON community_link_bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_community_link_comments_link_id ON community_link_comments(link_id);
CREATE INDEX IF NOT EXISTS idx_community_link_comments_user_id ON community_link_comments(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE community_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_link_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_link_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_link_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_links
CREATE POLICY "Users can view links in communities they're members of" ON community_links
  FOR SELECT USING (
    community_id IN (
      SELECT community_id 
      FROM community_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert links in communities they're members of" ON community_links
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    community_id IN (
      SELECT community_id 
      FROM community_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own links" ON community_links
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links" ON community_links
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for community_link_likes
CREATE POLICY "Users can view all likes on links they can see" ON community_link_likes
  FOR SELECT USING (
    link_id IN (
      SELECT id FROM community_links
      WHERE community_id IN (
        SELECT community_id 
        FROM community_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can like links" ON community_link_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" ON community_link_likes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for community_link_bookmarks
CREATE POLICY "Users can view their own bookmarks" ON community_link_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can bookmark links" ON community_link_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own bookmarks" ON community_link_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for community_link_comments
CREATE POLICY "Users can view comments on links they can see" ON community_link_comments
  FOR SELECT USING (
    link_id IN (
      SELECT id FROM community_links
      WHERE community_id IN (
        SELECT community_id 
        FROM community_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can comment on links" ON community_link_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON community_link_comments
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON community_link_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_community_links_updated_at 
  BEFORE UPDATE ON community_links 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_link_comments_updated_at 
  BEFORE UPDATE ON community_link_comments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for links with aggregated data
CREATE OR REPLACE VIEW community_links_with_stats AS
SELECT 
  cl.*,
  COALESCE(likes.count, 0) as likes_count,
  COALESCE(comments.count, 0) as comments_count,
  p.display_name as user_display_name,
  p.avatar_url as user_avatar_url
FROM community_links cl
LEFT JOIN (
  SELECT link_id, COUNT(*) as count
  FROM community_link_likes
  GROUP BY link_id
) likes ON cl.id = likes.link_id
LEFT JOIN (
  SELECT link_id, COUNT(*) as count
  FROM community_link_comments
  GROUP BY link_id
) comments ON cl.id = comments.link_id
LEFT JOIN profiles p ON cl.user_id = p.user_id;

-- Grant permissions
GRANT SELECT ON community_links_with_stats TO authenticated;

-- Insert sample data (optional - remove in production)
-- INSERT INTO community_links (url, title, description, domain, user_id, community_id)
-- VALUES 
--   ('https://github.com/supabase/supabase', 'Supabase - Open Source Firebase Alternative', 'Build production-ready apps with a Postgres database, Authentication, Realtime, and more.', 'github.com', 'sample-user-id', 'sample-community-id'),
--   ('https://tailwindcss.com', 'Tailwind CSS', 'A utility-first CSS framework packed with classes that can be composed to build any design.', 'tailwindcss.com', 'sample-user-id', 'sample-community-id');

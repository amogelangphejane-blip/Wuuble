-- ==========================================
-- COMPREHENSIVE DISCUSSION FEATURE SCHEMA
-- ==========================================
-- This schema provides rich discussion features including:
-- - Rich Posts (title, content, categories, tags)
-- - Engagement (likes, comments, nested replies)
-- - Organization (pinning, categorization)
-- - Discovery (search, filtering, sorting)
-- - Personalization (bookmarks, view tracking)
-- - Moderation (owner controls, post locking)
-- - Performance (optimized queries, automatic counts)
-- - Security (proper access control)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ==========================================
-- ENHANCED COMMUNITY POSTS TABLE
-- ==========================================

-- Add new columns to existing community_posts table for rich post features
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'link', 'image', 'video', 'event', 'poll')),
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS meta_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;

-- Create unique index for slugs within communities
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_posts_slug 
ON community_posts(community_id, slug) WHERE slug IS NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_title_search 
ON community_posts USING gin(title gin_trgm_ops) WHERE title IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_community_posts_content_search 
ON community_posts USING gin(content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_community_posts_type_category 
ON community_posts(community_id, post_type, category);

CREATE INDEX IF NOT EXISTS idx_community_posts_view_count 
ON community_posts(community_id, view_count DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_like_count 
ON community_posts(community_id, like_count DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_featured 
ON community_posts(community_id, featured_until) WHERE featured_until IS NOT NULL;

-- ==========================================
-- POST TAGS SYSTEM
-- ==========================================

-- Create tags table
CREATE TABLE IF NOT EXISTS post_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, name)
);

-- Create post-tags junction table
CREATE TABLE IF NOT EXISTS community_post_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES post_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, tag_id)
);

-- ==========================================
-- POST BOOKMARKS
-- ==========================================

CREATE TABLE IF NOT EXISTS community_post_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- ==========================================
-- POST VIEWS TRACKING
-- ==========================================

CREATE TABLE IF NOT EXISTS community_post_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_seconds INTEGER DEFAULT 0
);

-- Create unique index for one view per user per post per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_post_views_unique_daily 
ON community_post_views(post_id, user_id, DATE(viewed_at));

-- ==========================================
-- ENHANCED COMMENTS WITH REACTIONS
-- ==========================================

-- Add reaction support to existing comments
ALTER TABLE community_post_comments 
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_solution BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS marked_solution_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS marked_solution_at TIMESTAMP WITH TIME ZONE;

-- Create comment reactions table
CREATE TABLE IF NOT EXISTS community_comment_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES community_post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'laugh', 'angry', 'sad', 'wow')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id, reaction_type)
);

-- ==========================================
-- POST REACTIONS (EXTENDED ENGAGEMENT)
-- ==========================================

CREATE TABLE IF NOT EXISTS community_post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'laugh', 'angry', 'sad', 'wow', 'helpful', 'insightful')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- ==========================================
-- MODERATION LOGS
-- ==========================================

CREATE TABLE IF NOT EXISTS community_moderation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES community_post_comments(id) ON DELETE SET NULL,
  moderator_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('pin', 'unpin', 'lock', 'unlock', 'delete', 'hide', 'feature', 'unfeature', 'mark_solution')),
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==========================================
-- SEARCH AND DISCOVERY VIEWS
-- ==========================================

-- Create a comprehensive posts view for easy querying
CREATE OR REPLACE VIEW community_posts_enhanced AS
SELECT 
  p.*,
  pr.username as author_username,
  pr.avatar_url as author_avatar,
  COALESCE(p.like_count, 0) as total_likes,
  COALESCE(p.comment_count, 0) as total_comments,
  COALESCE(p.view_count, 0) as total_views,
  
  -- Engagement score calculation
  (
    COALESCE(p.like_count, 0) * 2 + 
    COALESCE(p.comment_count, 0) * 3 + 
    COALESCE(p.view_count, 0) * 0.1 +
    CASE WHEN p.is_pinned THEN 100 ELSE 0 END +
    CASE WHEN p.featured_until > now() THEN 50 ELSE 0 END
  ) as engagement_score,
  
  -- Time-based scoring for trending
  EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600 as hours_old,
  
  -- Tags array
  COALESCE(
    (SELECT array_agg(pt.name ORDER BY pt.name) 
     FROM community_post_tags cpt 
     JOIN post_tags pt ON cpt.tag_id = pt.id 
     WHERE cpt.post_id = p.id), 
    ARRAY[]::text[]
  ) as tags,
  
  -- Community info
  c.name as community_name,
  c.is_private as community_is_private,
  c.creator_id as community_creator_id

FROM community_posts p
JOIN profiles pr ON p.user_id = pr.user_id
JOIN communities c ON p.community_id = c.id;

-- ==========================================
-- TRIGGERS FOR AUTOMATIC COUNTS
-- ==========================================

-- Function to update post counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update like count
  IF TG_TABLE_NAME = 'community_post_likes' OR TG_TABLE_NAME = 'community_post_reactions' THEN
    UPDATE community_posts 
    SET like_count = (
      SELECT COUNT(*) FROM community_post_likes WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
    ) + (
      SELECT COUNT(*) FROM community_post_reactions WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
    )
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  END IF;
  
  -- Update comment count
  IF TG_TABLE_NAME = 'community_post_comments' THEN
    UPDATE community_posts 
    SET comment_count = (
      SELECT COUNT(*) FROM community_post_comments WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
    )
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic count updates
DROP TRIGGER IF EXISTS trigger_update_like_count ON community_post_likes;
CREATE TRIGGER trigger_update_like_count
  AFTER INSERT OR DELETE ON community_post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

DROP TRIGGER IF EXISTS trigger_update_reaction_count ON community_post_reactions;
CREATE TRIGGER trigger_update_reaction_count
  AFTER INSERT OR DELETE ON community_post_reactions
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

DROP TRIGGER IF EXISTS trigger_update_comment_count ON community_post_comments;
CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON community_post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- Function to update comment like counts
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_post_comments 
  SET like_count = (
    SELECT COUNT(*) FROM community_comment_reactions 
    WHERE comment_id = COALESCE(NEW.comment_id, OLD.comment_id)
  )
  WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_like_count ON community_comment_reactions;
CREATE TRIGGER trigger_update_comment_like_count
  AFTER INSERT OR DELETE ON community_comment_reactions
  FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

-- ==========================================
-- VIEW TRACKING FUNCTIONS
-- ==========================================

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_post_view(post_uuid UUID, user_uuid UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  -- Insert view record
  INSERT INTO community_post_views (post_id, user_id, viewed_at)
  VALUES (post_uuid, user_uuid, now())
  ON CONFLICT (post_id, user_id, DATE(viewed_at)) 
  DO UPDATE SET viewed_at = now();
  
  -- Update post view count
  UPDATE community_posts 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on new tables
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_moderation_logs ENABLE ROW LEVEL SECURITY;

-- Post tags policies
CREATE POLICY "Users can view tags in accessible communities"
ON post_tags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM communities c
    WHERE c.id = community_id
    AND (
      NOT c.is_private 
      OR c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Community creators and moderators can manage tags"
ON post_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM communities c
    WHERE c.id = community_id AND c.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM communities c
    WHERE c.id = community_id AND c.creator_id = auth.uid()
  )
);

-- Post-tags junction policies
CREATE POLICY "Users can view post tags in accessible communities"
ON community_post_tags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_posts cp
    JOIN communities c ON c.id = cp.community_id
    WHERE cp.id = post_id
    AND (
      NOT c.is_private 
      OR c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Post authors can manage their post tags"
ON community_post_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM community_posts cp
    WHERE cp.id = post_id AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM community_posts cp
    WHERE cp.id = post_id AND cp.user_id = auth.uid()
  )
);

-- Bookmark policies
CREATE POLICY "Users can manage their own bookmarks"
ON community_post_bookmarks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- View tracking policies
CREATE POLICY "Users can view their own view history"
ON community_post_views FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can track views"
ON community_post_views FOR INSERT
WITH CHECK (true);

-- Post reactions policies
CREATE POLICY "Users can view reactions on accessible posts"
ON community_post_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_posts cp
    JOIN communities c ON c.id = cp.community_id
    WHERE cp.id = post_id
    AND (
      NOT c.is_private 
      OR c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can manage their own post reactions"
ON community_post_reactions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Comment reactions policies  
CREATE POLICY "Users can view comment reactions on accessible posts"
ON community_comment_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_post_comments cpc
    JOIN community_posts cp ON cp.id = cpc.post_id
    JOIN communities c ON c.id = cp.community_id
    WHERE cpc.id = comment_id
    AND (
      NOT c.is_private 
      OR c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can manage their own comment reactions"
ON community_comment_reactions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Moderation logs policies
CREATE POLICY "Community creators can view moderation logs"
ON community_moderation_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM communities c
    WHERE c.id = community_id AND c.creator_id = auth.uid()
  )
);

CREATE POLICY "Community creators can create moderation logs"
ON community_moderation_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM communities c
    WHERE c.id = community_id AND c.creator_id = auth.uid()
  )
  AND auth.uid() = moderator_id
);

-- ==========================================
-- HELPER FUNCTIONS FOR COMMON OPERATIONS
-- ==========================================

-- Function to toggle post pin status
CREATE OR REPLACE FUNCTION toggle_post_pin(post_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_pinned BOOLEAN;
  community_owner UUID;
  post_community UUID;
BEGIN
  -- Get current pin status and community info
  SELECT cp.is_pinned, cp.community_id, c.creator_id 
  INTO is_pinned, post_community, community_owner
  FROM community_posts cp
  JOIN communities c ON c.id = cp.community_id
  WHERE cp.id = post_uuid;
  
  -- Check if user is community owner
  IF community_owner != auth.uid() THEN
    RAISE EXCEPTION 'Only community owners can pin/unpin posts';
  END IF;
  
  -- Toggle pin status
  UPDATE community_posts 
  SET is_pinned = NOT is_pinned
  WHERE id = post_uuid;
  
  -- Log the action
  INSERT INTO community_moderation_logs (community_id, post_id, moderator_id, action_type, created_at)
  VALUES (post_community, post_uuid, auth.uid(), 
          CASE WHEN is_pinned THEN 'unpin' ELSE 'pin' END, 
          now());
  
  RETURN NOT is_pinned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle post lock status
CREATE OR REPLACE FUNCTION toggle_post_lock(post_uuid UUID, lock_reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  is_locked BOOLEAN;
  community_owner UUID;
  post_community UUID;
BEGIN
  -- Get current lock status and community info
  SELECT cp.is_locked, cp.community_id, c.creator_id 
  INTO is_locked, post_community, community_owner
  FROM community_posts cp
  JOIN communities c ON c.id = cp.community_id
  WHERE cp.id = post_uuid;
  
  -- Check if user is community owner
  IF community_owner != auth.uid() THEN
    RAISE EXCEPTION 'Only community owners can lock/unlock posts';
  END IF;
  
  -- Toggle lock status
  UPDATE community_posts 
  SET 
    is_locked = NOT is_locked,
    locked_by = CASE WHEN NOT is_locked THEN auth.uid() ELSE NULL END,
    locked_at = CASE WHEN NOT is_locked THEN now() ELSE NULL END
  WHERE id = post_uuid;
  
  -- Log the action
  INSERT INTO community_moderation_logs (community_id, post_id, moderator_id, action_type, reason, created_at)
  VALUES (post_community, post_uuid, auth.uid(), 
          CASE WHEN is_locked THEN 'unlock' ELSE 'lock' END,
          lock_reason,
          now());
  
  RETURN NOT is_locked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search posts
CREATE OR REPLACE FUNCTION search_community_posts(
  search_query TEXT,
  community_uuid UUID DEFAULT NULL,
  post_category TEXT DEFAULT NULL,
  tag_names TEXT[] DEFAULT NULL,
  sort_by TEXT DEFAULT 'recent',
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  post_id UUID,
  title TEXT,
  content TEXT,
  author_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  like_count INTEGER,
  comment_count INTEGER,
  view_count INTEGER,
  engagement_score NUMERIC,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.id,
    pe.title,
    pe.content,
    pe.author_username,
    pe.created_at,
    pe.total_likes::INTEGER,
    pe.total_comments::INTEGER,
    pe.total_views::INTEGER,
    pe.engagement_score,
    pe.tags
  FROM community_posts_enhanced pe
  WHERE 
    (community_uuid IS NULL OR pe.community_id = community_uuid)
    AND (post_category IS NULL OR pe.category = post_category)
    AND (search_query IS NULL OR 
         pe.title ILIKE '%' || search_query || '%' OR 
         pe.content ILIKE '%' || search_query || '%')
    AND (tag_names IS NULL OR pe.tags && tag_names)
    -- Access control
    AND (
      NOT pe.community_is_private 
      OR pe.community_creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM community_members cm 
        WHERE cm.community_id = pe.community_id AND cm.user_id = auth.uid()
      )
    )
  ORDER BY 
    CASE 
      WHEN sort_by = 'recent' THEN pe.created_at
      WHEN sort_by = 'popular' THEN NULL
      ELSE pe.created_at
    END DESC,
    CASE 
      WHEN sort_by = 'popular' THEN pe.engagement_score
      ELSE 0
    END DESC,
    CASE 
      WHEN sort_by = 'views' THEN pe.total_views
      ELSE 0
    END DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- INDEXES FOR OPTIMAL PERFORMANCE
-- ==========================================

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_post_tags_community_name 
ON post_tags(community_id, name);

CREATE INDEX IF NOT EXISTS idx_community_post_tags_post 
ON community_post_tags(post_id);

CREATE INDEX IF NOT EXISTS idx_community_post_tags_tag 
ON community_post_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_community_post_bookmarks_user 
ON community_post_bookmarks(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_post_views_post_date 
ON community_post_views(post_id, DATE(viewed_at));

CREATE INDEX IF NOT EXISTS idx_community_post_reactions_post 
ON community_post_reactions(post_id, reaction_type);

CREATE INDEX IF NOT EXISTS idx_community_comment_reactions_comment 
ON community_comment_reactions(comment_id, reaction_type);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_community_date 
ON community_moderation_logs(community_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_engagement_score 
ON community_posts(community_id, 
  ((COALESCE(like_count, 0) * 2 + COALESCE(comment_count, 0) * 3 + COALESCE(view_count, 0) * 0.1)) DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_posts_community_category_created 
ON community_posts(community_id, category, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_community_pinned_created 
ON community_posts(community_id, is_pinned DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_user_created 
ON community_posts(user_id, created_at DESC);

-- ==========================================
-- GRANTS AND PERMISSIONS
-- ==========================================

-- Grant permissions to authenticated users
GRANT ALL ON post_tags TO authenticated, service_role;
GRANT ALL ON community_post_tags TO authenticated, service_role;
GRANT ALL ON community_post_bookmarks TO authenticated, service_role;
GRANT ALL ON community_post_views TO authenticated, service_role;
GRANT ALL ON community_post_reactions TO authenticated, service_role;
GRANT ALL ON community_comment_reactions TO authenticated, service_role;
GRANT ALL ON community_moderation_logs TO authenticated, service_role;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION increment_post_view(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION toggle_post_pin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_post_lock(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_community_posts(TEXT, UUID, TEXT, TEXT[], TEXT, INTEGER, INTEGER) TO authenticated, anon;

-- ==========================================
-- REALTIME SUBSCRIPTIONS
-- ==========================================

-- Enable realtime for new tables
ALTER TABLE post_tags REPLICA IDENTITY FULL;
ALTER TABLE community_post_tags REPLICA IDENTITY FULL;
ALTER TABLE community_post_bookmarks REPLICA IDENTITY FULL;
ALTER TABLE community_post_reactions REPLICA IDENTITY FULL;
ALTER TABLE community_comment_reactions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER publication supabase_realtime ADD TABLE post_tags;
ALTER publication supabase_realtime ADD TABLE community_post_tags;
ALTER publication supabase_realtime ADD TABLE community_post_bookmarks;
ALTER publication supabase_realtime ADD TABLE community_post_reactions;
ALTER publication supabase_realtime ADD TABLE community_comment_reactions;

-- ==========================================
-- INITIAL DATA AND CLEANUP
-- ==========================================

-- Update existing posts to have proper counts
UPDATE community_posts 
SET 
  like_count = COALESCE((SELECT COUNT(*) FROM community_post_likes WHERE post_id = community_posts.id), 0),
  comment_count = COALESCE((SELECT COUNT(*) FROM community_post_comments WHERE post_id = community_posts.id), 0),
  view_count = COALESCE(view_count, 0);

-- Create default categories for existing communities
INSERT INTO post_tags (community_id, name, color, description, created_by)
SELECT DISTINCT 
  c.id,
  unnest(ARRAY['General', 'Question', 'Announcement', 'Resource', 'Showcase', 'Event']) as name,
  CASE 
    WHEN unnest(ARRAY['General', 'Question', 'Announcement', 'Resource', 'Showcase', 'Event']) = 'General' THEN '#6366f1'
    WHEN unnest(ARRAY['General', 'Question', 'Announcement', 'Resource', 'Showcase', 'Event']) = 'Question' THEN '#f59e0b'
    WHEN unnest(ARRAY['General', 'Question', 'Announcement', 'Resource', 'Showcase', 'Event']) = 'Announcement' THEN '#ef4444'
    WHEN unnest(ARRAY['General', 'Question', 'Announcement', 'Resource', 'Showcase', 'Event']) = 'Resource' THEN '#10b981'
    WHEN unnest(ARRAY['General', 'Question', 'Announcement', 'Resource', 'Showcase', 'Event']) = 'Showcase' THEN '#8b5cf6'
    ELSE '#06b6d4'
  END as color,
  CASE 
    WHEN unnest(ARRAY['General', 'Question', 'Announcement', 'Resource', 'Showcase', 'Event']) = 'General' THEN 'General discussions and conversations'
    WHEN unnest(ARRAY['General', 'Question', 'Announcement', 'Resource', 'Showcase', 'Event']) = 'Question' THEN 'Questions seeking help or clarification'
    WHEN unnest(ARRAY['General', 'Question', 'Announcement', 'Resource', 'Showcase', 'Event']) = 'Announcement' THEN 'Important announcements and updates'
    WHEN unnest(ARRAY['General', 'Question', 'Announcement', 'Resource', 'Showcase', 'Event']) = 'Resource' THEN 'Helpful resources and materials'
    WHEN unnest(ARRAY['General', 'Question', 'Announcement', 'Resource', 'Showcase', 'Event']) = 'Showcase' THEN 'Show off your work and achievements'
    ELSE 'Community events and meetups'
  END as description,
  c.creator_id
FROM communities c
ON CONFLICT (community_id, name) DO NOTHING;

-- Add comments for schema documentation
COMMENT ON TABLE post_tags IS 'Tags that can be applied to community posts for better categorization';
COMMENT ON TABLE community_post_tags IS 'Junction table linking posts to their tags';
COMMENT ON TABLE community_post_bookmarks IS 'User bookmarks for posts they want to save';
COMMENT ON TABLE community_post_views IS 'Tracks post views for analytics and personalization';
COMMENT ON TABLE community_post_reactions IS 'Extended reactions beyond simple likes (love, laugh, etc.)';
COMMENT ON TABLE community_comment_reactions IS 'Reactions on individual comments';
COMMENT ON TABLE community_moderation_logs IS 'Audit trail for all moderation actions';

COMMENT ON COLUMN community_posts.title IS 'Post title for rich content posts';
COMMENT ON COLUMN community_posts.post_type IS 'Type of post: text, link, image, video, event, poll';
COMMENT ON COLUMN community_posts.is_locked IS 'Whether the post is locked from further comments';
COMMENT ON COLUMN community_posts.slug IS 'URL-friendly identifier for the post';
COMMENT ON COLUMN community_posts.meta_data IS 'Additional metadata stored as JSON';
COMMENT ON COLUMN community_posts.featured_until IS 'When the post should stop being featured';
COMMENT ON COLUMN community_posts.like_count IS 'Cached count of likes and reactions';
COMMENT ON COLUMN community_posts.comment_count IS 'Cached count of comments';
COMMENT ON COLUMN community_posts.view_count IS 'Cached count of views';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Discussion feature schema has been successfully applied!';
  RAISE NOTICE '📝 Features enabled:';
  RAISE NOTICE '   • Rich Posts with titles, categories, and tags';
  RAISE NOTICE '   • Extended engagement with reactions and nested comments';
  RAISE NOTICE '   • Post organization with pinning and categorization';  
  RAISE NOTICE '   • Advanced search and discovery';
  RAISE NOTICE '   • Personal bookmarks and view tracking';
  RAISE NOTICE '   • Comprehensive moderation tools';
  RAISE NOTICE '   • Optimized performance with automatic counts';
  RAISE NOTICE '   • Secure access control for private communities';
  RAISE NOTICE '🚀 Ready to build amazing discussion features!';
END $$;
-- Fix Live Streams RLS Policies
-- Remove invalid 'status = approved' condition from community_members checks
-- Date: 2025-01-29

-- Drop and recreate the problematic policies from the enhanced live streams migration

-- Stream Questions Policies
DROP POLICY IF EXISTS "Users can view questions in accessible streams" ON stream_questions;
CREATE POLICY "Users can view questions in accessible streams" ON stream_questions
  FOR SELECT USING (
    stream_id IN (
      SELECT ls.id FROM live_streams ls
      JOIN community_members cm ON ls.community_id = cm.community_id
      WHERE cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can submit questions in accessible streams" ON stream_questions;
CREATE POLICY "Users can submit questions in accessible streams" ON stream_questions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    stream_id IN (
      SELECT ls.id FROM live_streams ls
      JOIN community_members cm ON ls.community_id = cm.community_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- Stream Polls Policies
DROP POLICY IF EXISTS "Users can view polls in accessible streams" ON stream_polls;
CREATE POLICY "Users can view polls in accessible streams" ON stream_polls
  FOR SELECT USING (
    stream_id IN (
      SELECT ls.id FROM live_streams ls
      JOIN community_members cm ON ls.community_id = cm.community_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- Stream Poll Votes Policies
DROP POLICY IF EXISTS "Users can view poll votes in accessible streams" ON stream_poll_votes;
CREATE POLICY "Users can view poll votes in accessible streams" ON stream_poll_votes
  FOR SELECT USING (
    poll_id IN (
      SELECT sp.id FROM stream_polls sp
      JOIN live_streams ls ON sp.stream_id = ls.id
      JOIN community_members cm ON ls.community_id = cm.community_id
      WHERE cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can vote in accessible polls" ON stream_poll_votes;
CREATE POLICY "Users can vote in accessible polls" ON stream_poll_votes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    poll_id IN (
      SELECT sp.id FROM stream_polls sp
      JOIN live_streams ls ON sp.stream_id = ls.id
      JOIN community_members cm ON ls.community_id = cm.community_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- Stream Highlights Policies
DROP POLICY IF EXISTS "Users can view highlights in accessible streams" ON stream_highlights;
CREATE POLICY "Users can view highlights in accessible streams" ON stream_highlights
  FOR SELECT USING (
    stream_id IN (
      SELECT ls.id FROM live_streams ls
      JOIN community_members cm ON ls.community_id = cm.community_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- Stream Moderators Policies
DROP POLICY IF EXISTS "Users can view moderators in accessible streams" ON stream_moderators;
CREATE POLICY "Users can view moderators in accessible streams" ON stream_moderators
  FOR SELECT USING (
    stream_id IN (
      SELECT ls.id FROM live_streams ls
      JOIN community_members cm ON ls.community_id = cm.community_id
      WHERE cm.user_id = auth.uid()
    )
  );
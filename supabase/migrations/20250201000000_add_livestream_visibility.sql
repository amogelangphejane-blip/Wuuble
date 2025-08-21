-- Migration: Add Livestream Visibility Feature
-- Date: 2025-02-01
-- Description: Adds visibility control to live streams (public vs community-only)

-- Add visibility column to live_streams table
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'community_only' 
  CHECK (visibility IN ('public', 'community_only'));

-- Add index for better performance when filtering by visibility
CREATE INDEX IF NOT EXISTS idx_live_streams_visibility ON live_streams(visibility);

-- Update existing RLS policies to handle public streams

-- Drop existing policies that we need to modify
DROP POLICY IF EXISTS "Users can view streams in communities they're members of" ON live_streams;
DROP POLICY IF EXISTS "Users can view stream viewers for streams they can access" ON stream_viewers;
DROP POLICY IF EXISTS "Users can join streams as viewers" ON stream_viewers;
DROP POLICY IF EXISTS "Users can view chat for streams they can access" ON stream_chat;
DROP POLICY IF EXISTS "Users can send chat messages to streams they can access" ON stream_chat;
DROP POLICY IF EXISTS "Users can view reactions for streams they can access" ON stream_reactions;
DROP POLICY IF EXISTS "Users can react to streams they can access" ON stream_reactions;

-- Create new policies that handle both public and community-only streams

-- Live streams policies
CREATE POLICY "Users can view public streams or streams in communities they're members of" ON live_streams
    FOR SELECT USING (
        visibility = 'public'
        OR 
        (
            visibility = 'community_only' 
            AND (
                community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid()
                )
                OR creator_id = auth.uid()
            )
        )
    );

-- Stream viewers policies
CREATE POLICY "Users can view stream viewers for accessible streams" ON stream_viewers
    FOR SELECT USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE visibility = 'public'
            OR (
                visibility = 'community_only' 
                AND community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can join accessible streams as viewers" ON stream_viewers
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND stream_id IN (
            SELECT id FROM live_streams 
            WHERE visibility = 'public'
            OR (
                visibility = 'community_only' 
                AND community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Stream chat policies
CREATE POLICY "Users can view chat for accessible streams" ON stream_chat
    FOR SELECT USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE visibility = 'public'
            OR (
                visibility = 'community_only' 
                AND community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can send chat messages to accessible streams" ON stream_chat
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND stream_id IN (
            SELECT id FROM live_streams 
            WHERE visibility = 'public'
            OR (
                visibility = 'community_only' 
                AND community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Stream reactions policies
CREATE POLICY "Users can view reactions for accessible streams" ON stream_reactions
    FOR SELECT USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE visibility = 'public'
            OR (
                visibility = 'community_only' 
                AND community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can react to accessible streams" ON stream_reactions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND stream_id IN (
            SELECT id FROM live_streams 
            WHERE visibility = 'public'
            OR (
                visibility = 'community_only' 
                AND community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Update enhanced tables policies (from the enhance_live_streams migration)

-- Drop and recreate stream_questions policies
DROP POLICY IF EXISTS "Users can view questions in accessible streams" ON stream_questions;
DROP POLICY IF EXISTS "Users can submit questions in accessible streams" ON stream_questions;

CREATE POLICY "Users can view questions in accessible streams" ON stream_questions
    FOR SELECT USING (
        stream_id IN (
            SELECT ls.id FROM live_streams ls
            WHERE ls.visibility = 'public'
            OR (
                ls.visibility = 'community_only' 
                AND ls.community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can submit questions in accessible streams" ON stream_questions
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        stream_id IN (
            SELECT ls.id FROM live_streams ls
            WHERE ls.visibility = 'public'
            OR (
                ls.visibility = 'community_only' 
                AND ls.community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Drop and recreate stream_polls policies
DROP POLICY IF EXISTS "Users can view polls in accessible streams" ON stream_polls;

CREATE POLICY "Users can view polls in accessible streams" ON stream_polls
    FOR SELECT USING (
        stream_id IN (
            SELECT ls.id FROM live_streams ls
            WHERE ls.visibility = 'public'
            OR (
                ls.visibility = 'community_only' 
                AND ls.community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Drop and recreate stream_poll_votes policies
DROP POLICY IF EXISTS "Users can view poll votes in accessible streams" ON stream_poll_votes;
DROP POLICY IF EXISTS "Users can vote in accessible polls" ON stream_poll_votes;

CREATE POLICY "Users can view poll votes in accessible streams" ON stream_poll_votes
    FOR SELECT USING (
        poll_id IN (
            SELECT sp.id FROM stream_polls sp
            JOIN live_streams ls ON sp.stream_id = ls.id
            WHERE ls.visibility = 'public'
            OR (
                ls.visibility = 'community_only' 
                AND ls.community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can vote in accessible polls" ON stream_poll_votes
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        poll_id IN (
            SELECT sp.id FROM stream_polls sp
            JOIN live_streams ls ON sp.stream_id = ls.id
            WHERE ls.visibility = 'public'
            OR (
                ls.visibility = 'community_only' 
                AND ls.community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Drop and recreate stream_highlights policies
DROP POLICY IF EXISTS "Users can view highlights in accessible streams" ON stream_highlights;

CREATE POLICY "Users can view highlights in accessible streams" ON stream_highlights
    FOR SELECT USING (
        is_public = true
        OR stream_id IN (
            SELECT ls.id FROM live_streams ls
            WHERE ls.visibility = 'public'
            OR (
                ls.visibility = 'community_only' 
                AND ls.community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Drop and recreate stream_moderators policies
DROP POLICY IF EXISTS "Users can view moderators in accessible streams" ON stream_moderators;

CREATE POLICY "Users can view moderators in accessible streams" ON stream_moderators
    FOR SELECT USING (
        stream_id IN (
            SELECT ls.id FROM live_streams ls
            WHERE ls.visibility = 'public'
            OR (
                ls.visibility = 'community_only' 
                AND ls.community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Add a comment to document the visibility feature
COMMENT ON COLUMN live_streams.visibility IS 'Controls who can view the stream: public (anyone) or community_only (community members only)';
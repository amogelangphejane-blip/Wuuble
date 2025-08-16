-- Fix missing livestream tables
-- This script adds the stream_questions and stream_polls tables that are missing

-- Create stream_questions table (for Q&A feature)
CREATE TABLE IF NOT EXISTS stream_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_answered BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMPTZ,
  answered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  answer_text TEXT,
  likes INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stream_polls table (for live polls)
CREATE TABLE IF NOT EXISTS stream_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  votes JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  ends_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stream_questions_stream_id ON stream_questions(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_questions_user_id ON stream_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_questions_is_answered ON stream_questions(is_answered);
CREATE INDEX IF NOT EXISTS idx_stream_questions_likes ON stream_questions(likes DESC);
CREATE INDEX IF NOT EXISTS idx_stream_questions_created_at ON stream_questions(created_at);

CREATE INDEX IF NOT EXISTS idx_stream_polls_stream_id ON stream_polls(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_polls_creator_id ON stream_polls(creator_id);
CREATE INDEX IF NOT EXISTS idx_stream_polls_is_active ON stream_polls(is_active);
CREATE INDEX IF NOT EXISTS idx_stream_polls_created_at ON stream_polls(created_at);

-- Add updated_at triggers
CREATE TRIGGER update_stream_questions_updated_at BEFORE UPDATE ON stream_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stream_polls_updated_at BEFORE UPDATE ON stream_polls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE stream_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_polls ENABLE ROW LEVEL SECURITY;

-- Policies for stream_questions
CREATE POLICY "Users can view questions for streams they can access" ON stream_questions
    FOR SELECT USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE community_id IN (
                SELECT community_id FROM community_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can submit questions to streams they can access" ON stream_questions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND stream_id IN (
            SELECT id FROM live_streams 
            WHERE community_id IN (
                SELECT community_id FROM community_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own questions" ON stream_questions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Stream creators can answer questions" ON stream_questions
    FOR UPDATE USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE creator_id = auth.uid()
        )
    );

-- Policies for stream_polls
CREATE POLICY "Users can view polls for streams they can access" ON stream_polls
    FOR SELECT USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE community_id IN (
                SELECT community_id FROM community_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Stream creators can create polls" ON stream_polls
    FOR INSERT WITH CHECK (
        creator_id = auth.uid()
        AND stream_id IN (
            SELECT id FROM live_streams 
            WHERE creator_id = auth.uid()
        )
    );

CREATE POLICY "Stream creators can update their polls" ON stream_polls
    FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Stream creators can delete their polls" ON stream_polls
    FOR DELETE USING (creator_id = auth.uid());

-- Add enhanced columns to stream_chat table if they don't exist
ALTER TABLE stream_chat ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE stream_chat ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES stream_chat(id) ON DELETE SET NULL;

-- Update message_type constraint to include 'question'
ALTER TABLE stream_chat DROP CONSTRAINT IF EXISTS stream_chat_message_type_check;
ALTER TABLE stream_chat ADD CONSTRAINT stream_chat_message_type_check 
  CHECK (message_type IN ('text', 'emoji', 'system', 'question'));

-- Success message
SELECT 'Missing livestream tables created successfully!' as message;
# Fix: "Failed to Create Stream" Error

## Problem
You're getting a "failed to create stream" error because the `live_streams` table and related tables don't exist in your Supabase database.

## Root Cause
The live streaming feature requires several database tables that haven't been created yet:
- `live_streams` - Main table for stream data
- `stream_viewers` - Track active viewers
- `stream_chat` - Live chat messages
- `stream_reactions` - Live reactions

## Solution

### Option 1: Manual SQL Execution (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Navigate to your project: `tgmflbglhmnrliredlbn`
   - Go to SQL Editor

2. **Execute the Following SQL**

```sql
-- Live Streams Schema
-- Create live_streams table
CREATE TABLE IF NOT EXISTS live_streams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    scheduled_start_time TIMESTAMPTZ,
    actual_start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    stream_key VARCHAR(255) UNIQUE,
    rtmp_url TEXT,
    hls_url TEXT,
    viewer_count INTEGER DEFAULT 0,
    max_viewers INTEGER DEFAULT 1000,
    is_recorded BOOLEAN DEFAULT false,
    recording_url TEXT,
    thumbnail_url TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stream_viewers table
CREATE TABLE IF NOT EXISTS stream_viewers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(stream_id, user_id)
);

-- Create stream_chat table
CREATE TABLE IF NOT EXISTS stream_chat (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'emoji', 'system')),
    is_moderator_message BOOLEAN DEFAULT false,
    reply_to_id UUID REFERENCES stream_chat(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stream_reactions table
CREATE TABLE IF NOT EXISTS stream_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'wow', 'laugh', 'clap', 'fire')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stream_id, user_id, reaction_type)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_streams_community_id ON live_streams(community_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_creator_id ON live_streams(creator_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_scheduled_start ON live_streams(scheduled_start_time);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_stream_id ON stream_viewers(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_user_id ON stream_viewers(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_active ON stream_viewers(is_active);
CREATE INDEX IF NOT EXISTS idx_stream_chat_stream_id ON stream_chat(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_chat_created_at ON stream_chat(created_at);
CREATE INDEX IF NOT EXISTS idx_stream_reactions_stream_id ON stream_reactions(stream_id);

-- Add updated_at trigger for live_streams
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_live_streams_updated_at BEFORE UPDATE ON live_streams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_reactions ENABLE ROW LEVEL SECURITY;

-- Policies for live_streams
CREATE POLICY "Users can view streams in communities they're members of" ON live_streams
    FOR SELECT USING (
        community_id IN (
            SELECT community_id FROM community_members 
            WHERE user_id = auth.uid()
        )
        OR 
        creator_id = auth.uid()
    );

CREATE POLICY "Community members can create streams" ON live_streams
    FOR INSERT WITH CHECK (
        community_id IN (
            SELECT community_id FROM community_members 
            WHERE user_id = auth.uid()
        )
        AND creator_id = auth.uid()
    );

CREATE POLICY "Stream creators can update their streams" ON live_streams
    FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Stream creators can delete their streams" ON live_streams
    FOR DELETE USING (creator_id = auth.uid());

-- Policies for stream_viewers
CREATE POLICY "Users can view stream viewers for streams they can access" ON stream_viewers
    FOR SELECT USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE community_id IN (
                SELECT community_id FROM community_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can join streams as viewers" ON stream_viewers
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

CREATE POLICY "Users can update their viewer status" ON stream_viewers
    FOR UPDATE USING (user_id = auth.uid());

-- Policies for stream_chat
CREATE POLICY "Users can view chat for streams they can access" ON stream_chat
    FOR SELECT USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE community_id IN (
                SELECT community_id FROM community_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can send chat messages to streams they can access" ON stream_chat
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

-- Policies for stream_reactions
CREATE POLICY "Users can view reactions for streams they can access" ON stream_reactions
    FOR SELECT USING (
        stream_id IN (
            SELECT id FROM live_streams 
            WHERE community_id IN (
                SELECT community_id FROM community_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can react to streams they can access" ON stream_reactions
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

CREATE POLICY "Users can update their reactions" ON stream_reactions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their reactions" ON stream_reactions
    FOR DELETE USING (user_id = auth.uid());

-- Function to update viewer count
CREATE OR REPLACE FUNCTION update_stream_viewer_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE live_streams 
    SET viewer_count = (
        SELECT COUNT(*) FROM stream_viewers 
        WHERE stream_id = COALESCE(NEW.stream_id, OLD.stream_id) 
        AND is_active = true
    )
    WHERE id = COALESCE(NEW.stream_id, OLD.stream_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update viewer count
CREATE TRIGGER update_viewer_count_on_insert
    AFTER INSERT ON stream_viewers
    FOR EACH ROW EXECUTE FUNCTION update_stream_viewer_count();

CREATE TRIGGER update_viewer_count_on_update
    AFTER UPDATE ON stream_viewers
    FOR EACH ROW EXECUTE FUNCTION update_stream_viewer_count();

CREATE TRIGGER update_viewer_count_on_delete
    AFTER DELETE ON stream_viewers
    FOR EACH ROW EXECUTE FUNCTION update_stream_viewer_count();
```

3. **Click "Run" to execute the SQL**

### Option 2: Using Supabase CLI (Alternative)

If you have Supabase CLI set up:

```bash
# Link your project (you'll need your project reference)
supabase link --project-ref tgmflbglhmnrliredlbn

# Push the migration
supabase db push
```

## Verification

After running the SQL, test that it worked by running:

```bash
node test-stream-creation.cjs
```

You should see:
```
✅ live_streams table is accessible
```

## Next Steps

1. **Update Supabase Types** (Optional but recommended):
   - Generate new types: `npx supabase gen types typescript --project-id tgmflbglhmnrliredlbn > src/integrations/supabase/types.ts`

2. **Test the Live Streaming Feature**:
   - Start your development server: `npm run dev`
   - Navigate to a community
   - Try creating a live stream
   - The "failed to create stream" error should be resolved

## What This Fixes

- ✅ Creates all required database tables
- ✅ Sets up proper Row Level Security policies  
- ✅ Adds performance indexes
- ✅ Creates triggers for automatic viewer count updates
- ✅ Ensures proper foreign key relationships

## Troubleshooting

If you still get errors after running the SQL:

1. **Check table creation**: Go to Supabase Dashboard > Database > Tables and verify the `live_streams` table exists
2. **Check RLS policies**: Ensure you're logged in as a user who is a member of the community
3. **Check browser console**: Look for more detailed error messages in the browser developer tools

The live streaming feature should work properly once these tables are created!
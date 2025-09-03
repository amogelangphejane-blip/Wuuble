-- Fix stream_reactions schema to include position columns
-- This script ensures the position_x and position_y columns exist

-- Check if the columns exist and add them if they don't
DO $$
BEGIN
    -- Add position_x column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stream_reactions' 
        AND column_name = 'position_x'
    ) THEN
        ALTER TABLE stream_reactions ADD COLUMN position_x FLOAT;
        RAISE NOTICE 'Added position_x column to stream_reactions table';
    ELSE
        RAISE NOTICE 'position_x column already exists in stream_reactions table';
    END IF;

    -- Add position_y column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stream_reactions' 
        AND column_name = 'position_y'
    ) THEN
        ALTER TABLE stream_reactions ADD COLUMN position_y FLOAT;
        RAISE NOTICE 'Added position_y column to stream_reactions table';
    ELSE
        RAISE NOTICE 'position_y column already exists in stream_reactions table';
    END IF;

    -- Add duration_ms column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stream_reactions' 
        AND column_name = 'duration_ms'
    ) THEN
        ALTER TABLE stream_reactions ADD COLUMN duration_ms INTEGER DEFAULT 3000;
        RAISE NOTICE 'Added duration_ms column to stream_reactions table';
    ELSE
        RAISE NOTICE 'duration_ms column already exists in stream_reactions table';
    END IF;
END
$$;

-- Drop the old unique constraint that might be causing issues
ALTER TABLE stream_reactions DROP CONSTRAINT IF EXISTS stream_reactions_stream_id_user_id_reaction_type_key;

-- Update the reaction_type constraint to match the enhanced version
ALTER TABLE stream_reactions DROP CONSTRAINT IF EXISTS stream_reactions_reaction_type_check;
ALTER TABLE stream_reactions ADD CONSTRAINT stream_reactions_reaction_type_check 
    CHECK (reaction_type IN ('like', 'love', 'wow', 'laugh', 'clap', 'fire'));

-- Verify the schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'stream_reactions' 
ORDER BY ordinal_position;
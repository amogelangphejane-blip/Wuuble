-- Migration: Fix Stream Reactions Schema
-- Date: 2025-08-13
-- Description: Ensures stream_reactions table has position_x, position_y, and duration_ms columns
-- This fixes the "could not find position x column" error

-- Add missing columns to stream_reactions table
ALTER TABLE stream_reactions ADD COLUMN IF NOT EXISTS position_x FLOAT;
ALTER TABLE stream_reactions ADD COLUMN IF NOT EXISTS position_y FLOAT;
ALTER TABLE stream_reactions ADD COLUMN IF NOT EXISTS duration_ms INTEGER DEFAULT 3000;

-- Drop the old unique constraint that prevents multiple reactions
ALTER TABLE stream_reactions DROP CONSTRAINT IF EXISTS stream_reactions_stream_id_user_id_reaction_type_key;

-- Update the reaction_type constraint to include all supported reaction types
ALTER TABLE stream_reactions DROP CONSTRAINT IF EXISTS stream_reactions_reaction_type_check;
ALTER TABLE stream_reactions ADD CONSTRAINT stream_reactions_reaction_type_check 
    CHECK (reaction_type IN ('like', 'love', 'wow', 'laugh', 'clap', 'fire'));

-- Add comment to document the position columns
COMMENT ON COLUMN stream_reactions.position_x IS 'X position for animated reactions (0-100)';
COMMENT ON COLUMN stream_reactions.position_y IS 'Y position for animated reactions (0-100)';
COMMENT ON COLUMN stream_reactions.duration_ms IS 'Duration of reaction animation in milliseconds';

-- Refresh the schema cache by updating table statistics
ANALYZE stream_reactions;
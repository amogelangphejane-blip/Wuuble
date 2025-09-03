# Livestream Reactions Fix Guide

## Problem Description
The livestream emoji and text reaction feature is failing with the error:
```
"failed to send reaction could not find position x column of stream reactions in the schema cache"
```

## Root Cause Analysis
The error occurs because the database schema for the `stream_reactions` table is missing the `position_x` and `position_y` columns that were added in the `20250127000000_enhance_live_streams.sql` migration. The application code expects these columns to exist, but they may not have been properly applied to the database.

## Solution Steps

### Step 1: Apply the Schema Fix Migration
Run the following migration to ensure the required columns exist:

```bash
# If using Supabase CLI with local development
npx supabase db reset

# Or apply the specific migration
npx supabase migration up --to 20250813000000_fix_stream_reactions_schema
```

### Step 2: Manual Database Fix (If needed)
If you need to manually fix the database schema, run this SQL:

```sql
-- Add missing columns to stream_reactions table
ALTER TABLE stream_reactions ADD COLUMN IF NOT EXISTS position_x FLOAT;
ALTER TABLE stream_reactions ADD COLUMN IF NOT EXISTS position_y FLOAT;
ALTER TABLE stream_reactions ADD COLUMN IF NOT EXISTS duration_ms INTEGER DEFAULT 3000;

-- Drop the old unique constraint that prevents multiple reactions
ALTER TABLE stream_reactions DROP CONSTRAINT IF EXISTS stream_reactions_stream_id_user_id_reaction_type_key;

-- Update the reaction_type constraint
ALTER TABLE stream_reactions DROP CONSTRAINT IF EXISTS stream_reactions_reaction_type_check;
ALTER TABLE stream_reactions ADD CONSTRAINT stream_reactions_reaction_type_check 
    CHECK (reaction_type IN ('like', 'love', 'wow', 'laugh', 'clap', 'fire'));

-- Refresh schema cache
ANALYZE stream_reactions;
```

### Step 3: Verify Schema
Check that the schema is correct by running:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'stream_reactions' 
ORDER BY ordinal_position;
```

Expected columns:
- `id` (UUID)
- `stream_id` (UUID)
- `user_id` (UUID)
- `reaction_type` (VARCHAR)
- `created_at` (TIMESTAMPTZ)
- `position_x` (FLOAT) ← Should be present
- `position_y` (FLOAT) ← Should be present
- `duration_ms` (INTEGER) ← Should be present

### Step 4: Clear Application Cache
If using a production environment, you may need to:
1. Restart your application server
2. Clear any database connection pools
3. Clear browser cache and reload the application

## Testing the Fix

### Test Emoji Reactions
1. Start or join a livestream
2. Click on any emoji reaction button (like ❤️, 😂, 👏, etc.)
3. Verify the reaction appears as an animation on screen
4. Check that no error appears in the browser console

### Test Text Reactions
1. Open the chat panel during a livestream
2. Send a message with emoji characters
3. Verify the message appears correctly in the chat
4. Check that the message is stored with the correct `message_type`

## Code Flow
The reaction system works as follows:

1. **User clicks reaction button** → `AzarLivestream.tsx`
2. **Calls sendReaction** → `useLivestream.tsx`
3. **Invokes livestreamService** → `livestreamService.ts`
4. **Inserts into database** → `stream_reactions` table
5. **Real-time subscription** → Updates UI with animation

## Common Issues and Solutions

### Issue: "Permission denied" error
**Solution**: Check that the user is authenticated and has access to the stream

### Issue: "Invalid stream" error
**Solution**: Verify the stream exists and is active

### Issue: Reactions not animating
**Solution**: Check that the `position_x` and `position_y` values are being set correctly

### Issue: Multiple reactions not working
**Solution**: Ensure the unique constraint was properly removed

## Files Modified
- `supabase/migrations/20250813000000_fix_stream_reactions_schema.sql` (new)
- `fix-stream-reactions-schema.sql` (standalone fix script)

## Migration Files Involved
- `20250126000000_add_live_streams.sql` - Initial stream_reactions table
- `20250127000000_enhance_live_streams.sql` - Added position columns
- `20250201000000_add_livestream_visibility.sql` - Updated policies
- `20250813000000_fix_stream_reactions_schema.sql` - Schema fix

## Prevention
To prevent this issue in the future:
1. Always run `npx supabase db reset` after pulling new migrations
2. Verify schema changes in development before deploying
3. Use database migration tools consistently
4. Monitor application logs for schema-related errors
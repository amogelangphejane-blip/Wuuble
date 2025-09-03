# Live Streams Settings Column Fix

## Problem
The application is failing with the error: **"Stream failed, could not find settings column of live streams in the schema cache"**

## Root Cause
The `settings` column was added to the `live_streams` table in migration `20250127000000_enhance_live_streams.sql`, but this migration has not been applied to the remote Supabase database. The schema cache doesn't recognize the column because it doesn't exist in the actual database schema.

## Diagnosis Results
- ✅ Migration file exists: `supabase/migrations/20250127000000_enhance_live_streams.sql`
- ✅ Code expects the settings column: `src/services/livestreamService.ts`
- ❌ Database schema is missing the settings column
- ❌ Schema cache doesn't recognize the column

## Solution Options

### Option 1: Apply Migration via Supabase Dashboard (Recommended)
1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `tgmflbglhmnrliredlbn`
3. Go to **SQL Editor**
4. Execute the following SQL:

```sql
-- Add the settings column to live_streams table
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"qa_mode": false, "polls_enabled": true, "reactions_enabled": true, "chat_moderation": false}';

-- Update any existing streams that might have NULL settings
UPDATE live_streams 
SET settings = '{"qa_mode": false, "polls_enabled": true, "reactions_enabled": true, "chat_moderation": false}'::jsonb
WHERE settings IS NULL OR settings = '{}'::jsonb;

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'live_streams' 
AND column_name = 'settings'
AND table_schema = 'public';
```

### Option 2: Apply Full Migration File
1. Open your [Supabase Dashboard](https://supabase.com/dashboard) > SQL Editor
2. Copy and paste the entire contents of `supabase/migrations/20250127000000_enhance_live_streams.sql`
3. Execute the migration

### Option 3: Use the Provided Fix Script
1. The fix SQL is available in: `fix-livestream-settings-column.sql`
2. Copy the contents and execute in Supabase Dashboard SQL Editor

## Verification Steps
After applying the fix:

1. **Test the application** - Try creating a livestream
2. **Check the schema** - Run this query in SQL Editor:
   ```sql
   SELECT * FROM information_schema.columns 
   WHERE table_name = 'live_streams' AND column_name = 'settings';
   ```
3. **Verify data** - Check that existing streams have proper settings:
   ```sql
   SELECT id, title, settings FROM live_streams LIMIT 5;
   ```

## Prevention
To prevent this issue in the future:
1. Ensure all migrations are applied to production database
2. Use Supabase CLI to sync migrations: `supabase db push`
3. Test schema changes in staging before production

## Files Created for This Fix
- `fix-livestream-settings-column.sql` - SQL fix script
- `fix-livestream-settings.js` - Diagnostic script
- `LIVESTREAM_SETTINGS_COLUMN_FIX.md` - This documentation

## Migration Details
The missing migration adds these enhancements to live streams:
- Settings column for stream configuration
- Enhanced viewer tracking with watch time
- Polls and Q&A functionality  
- Stream highlights and moderation features
- Analytics tracking

Once the settings column is added, all livestream functionality should work properly.
# Live Streams Relationship Fix

## Problem
The error "Could not find a relationship between 'live_streams' and 'creator_id' in the schema cache" occurs because there's an inconsistency in foreign key relationships in your database schema.

## Root Cause
The `live_streams` table was created with foreign key references to `auth.users(id)`, but other parts of your system expect it to reference `profiles(user_id)` for consistency with other tables.

### Inconsistencies Found:
- ❌ `live_streams.creator_id` references `auth.users(id)` 
- ❌ `stream_viewers.user_id` references `auth.users(id)`
- ❌ `stream_chat.user_id` references `auth.users(id)`
- ❌ `stream_reactions.user_id` references `auth.users(id)`
- ❌ Enhanced livestream tables reference `profiles(id)` instead of `profiles(user_id)`

### Should be:
- ✅ All user references should point to `profiles(user_id)` for consistency

## Solution

### Option 1: Automatic Fix (Recommended)
Run the migration script we've created:

```bash
# Apply the migration
npx supabase db push

# Regenerate types
npx supabase gen types typescript > src/integrations/supabase/types.ts
```

### Option 2: Manual Database Fix
If you have direct database access, run this SQL:

```sql
-- Fix live_streams table
ALTER TABLE live_streams DROP CONSTRAINT IF EXISTS live_streams_creator_id_fkey;
ALTER TABLE live_streams ADD CONSTRAINT live_streams_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Fix stream_viewers table
ALTER TABLE stream_viewers DROP CONSTRAINT IF EXISTS stream_viewers_user_id_fkey;
ALTER TABLE stream_viewers ADD CONSTRAINT stream_viewers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Fix stream_chat table
ALTER TABLE stream_chat DROP CONSTRAINT IF EXISTS stream_chat_user_id_fkey;
ALTER TABLE stream_chat ADD CONSTRAINT stream_chat_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Fix stream_reactions table
ALTER TABLE stream_reactions DROP CONSTRAINT IF EXISTS stream_reactions_user_id_fkey;
ALTER TABLE stream_reactions ADD CONSTRAINT stream_reactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Fix enhanced livestream tables
ALTER TABLE stream_questions DROP CONSTRAINT IF EXISTS stream_questions_user_id_fkey;
ALTER TABLE stream_questions ADD CONSTRAINT stream_questions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE stream_polls DROP CONSTRAINT IF EXISTS stream_polls_creator_id_fkey;
ALTER TABLE stream_polls ADD CONSTRAINT stream_polls_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Continue for all other livestream tables...
```

### Option 3: Using Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the migration file: `supabase/migrations/20250130000000_fix_live_streams_creator_relationship.sql`
4. Run the SQL
5. Regenerate your types

## Files Created

1. **Migration File**: `supabase/migrations/20250130000000_fix_live_streams_creator_relationship.sql`
   - Contains the complete SQL to fix all foreign key relationships
   - Safe to run multiple times (uses IF EXISTS checks)

2. **Fix Script**: `fix-livestream-relationships.sh`
   - Automated script to apply migration and regenerate types
   - Handles both local and remote Supabase instances

## What This Fix Does

### Foreign Key Corrections:
- `live_streams.creator_id`: `auth.users(id)` → `profiles(user_id)`
- `stream_viewers.user_id`: `auth.users(id)` → `profiles(user_id)`
- `stream_chat.user_id`: `auth.users(id)` → `profiles(user_id)`
- `stream_reactions.user_id`: `auth.users(id)` → `profiles(user_id)`
- `stream_questions.user_id`: `profiles(id)` → `profiles(user_id)`
- `stream_polls.creator_id`: `profiles(id)` → `profiles(user_id)`
- All other enhanced livestream tables now reference `profiles(user_id)` consistently

### Benefits:
- ✅ Consistent foreign key relationships across all tables
- ✅ Proper schema cache recognition
- ✅ Better query performance with proper joins
- ✅ Aligned with existing patterns in your codebase

## Verification

After applying the fix, you can verify it worked by:

1. **Check the relationships in your database**:
```sql
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name LIKE '%stream%' AND tc.constraint_type = 'FOREIGN KEY';
```

2. **Test your livestream functionality** - the error should no longer appear

3. **Check your generated types** - `live_streams` should now appear in `src/integrations/supabase/types.ts`

## Next Steps

1. Apply the migration using one of the options above
2. Regenerate your TypeScript types
3. Restart your application
4. Test the livestream functionality

The error "Could not find a relationship between 'live_streams' and 'creator_id' in the schema cache" should now be resolved!
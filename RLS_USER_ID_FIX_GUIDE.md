# RLS User ID Auto-Population Fix

## Problem
Your database tables with Row Level Security (RLS) policies are experiencing violations because the `user_id` columns are `NOT NULL` but don't automatically populate with the authenticated user's ID when new rows are inserted.

## Root Cause
The RLS policies check `auth.uid() = user_id`, but when inserting new rows, if `user_id` is not explicitly provided or defaults to the authenticated user, the policy fails.

## Solution: "Set-and-Forget" Auto-Population

### Tables Affected
The following tables need `user_id` auto-population:
- `community_posts`
- `community_events` 
- `event_rsvps`
- `event_notifications`
- `event_shares`
- `user_event_preferences`

### Implementation

#### Option 1: Execute the SQL Script (Recommended)
Run the `auto_populate_user_id_fix.sql` file in your Supabase SQL editor:

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `auto_populate_user_id_fix.sql`
4. Execute the script

#### Option 2: Apply as Migration
If you want to add this as a proper migration:

1. Copy the migration file to your migrations directory:
   ```bash
   cp auto_populate_user_id_fix.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_auto_populate_user_id.sql
   ```

2. Apply the migration:
   ```bash
   npx supabase db push
   ```

### How It Works

After applying this fix:

1. **Automatic Population**: When inserting new rows into these tables, if `user_id` is not explicitly provided, it will automatically be set to `auth.uid()` (the currently authenticated user's ID).

2. **RLS Compliance**: Since the `user_id` will always match the authenticated user, the RLS policies that check `auth.uid() = user_id` will pass.

3. **No Code Changes Required**: Your application code doesn't need to change. You can insert rows without specifying `user_id`:

   ```sql
   -- Before: This would fail RLS
   INSERT INTO community_posts (community_id, content) 
   VALUES ('some-uuid', 'Hello world');
   
   -- After: This works automatically
   INSERT INTO community_posts (community_id, content) 
   VALUES ('some-uuid', 'Hello world');
   -- user_id is automatically set to auth.uid()
   ```

### Verification

After applying the fix, you can verify it worked by running:

```sql
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('community_posts', 'community_events', 'event_rsvps', 'event_notifications', 'event_shares', 'user_event_preferences')
  AND column_name = 'user_id';
```

You should see `auth.uid()` as the default value for all these columns.

### Benefits

1. **Set-and-Forget**: Once applied, no manual intervention needed
2. **Security**: Maintains RLS policies while preventing violations
3. **Backwards Compatible**: Existing code continues to work
4. **Explicit Override**: You can still explicitly set `user_id` if needed for special cases

### Important Notes

- This only affects INSERT operations where `user_id` is not explicitly provided
- If you explicitly provide a `user_id` value in your INSERT statement, that value will be used instead of the default
- The authenticated user must exist (i.e., `auth.uid()` must not be null) for inserts to work
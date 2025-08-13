# 🚀 QUICK FIX: Group Video Call Feature

## The Issue
Group video call feature fails because database tables are missing.

## The Fix (2 minutes)

### Step 1: Apply Database Schema
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/tgmflbglhmnrliredlbn)
2. Click "SQL Editor" in the left sidebar
3. Create a new query
4. Copy and paste the SQL from `supabase/migrations/20250812235800_add_group_video_calls.sql`
5. Click "Run" to execute

### Step 2: Update Types (Optional but Recommended)
```bash
npx supabase gen types typescript --project-id tgmflbglhmnrliredlbn > src/integrations/supabase/types.ts
```

### Step 3: Test
1. `npm run dev`
2. Go to any community
3. Click "Start Group Call"
4. ✅ Feature should now work!

## What This Fixes
- ✅ Group video calls can be created
- ✅ Users can join existing calls
- ✅ All video call features work (screen share, chat, etc.)
- ✅ Proper permissions and security

## Verification
If successful, you'll see these tables in your Supabase database:
- `community_group_calls`
- `community_group_call_participants`
- `community_group_call_events`

That's it! The code was already complete - it just needed the database tables.
# Events Feature Migration Instructions

## ⚠️ CRITICAL: Database Migration Required

The events feature is not working because the required database tables have not been created in your Supabase instance. You need to apply the database migrations to fix this issue.

## 🚨 Root Cause
The application code expects the following tables to exist:
- `community_events`
- `event_categories` 
- `event_rsvps`
- `event_notifications`
- `user_event_preferences`
- `event_shares`

However, these tables are missing from your Supabase database, which is why the events feature fails to load.

## 🔧 How to Fix

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `tgmflbglhmnrliredlbn`
3. Go to the **SQL Editor** section

### Step 2: Apply the Migration
1. Copy the entire contents of the file `apply_events_migrations.sql` (created in this workspace)
2. Paste it into the SQL Editor in Supabase
3. Click **Run** to execute the migration

### Step 3: Verify Migration Success
After running the migration, you should see the following tables created:
- ✅ `community_events` - Main events table
- ✅ `event_categories` - Event categorization (8 default categories will be created)
- ✅ `event_rsvps` - RSVP management
- ✅ `event_notifications` - Notification system
- ✅ `user_event_preferences` - User preferences
- ✅ `event_shares` - Social sharing tracking

### Step 4: Update Type Definitions (Optional)
After applying the migration, you may want to regenerate the TypeScript types:
1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the updated TypeScript types
3. Replace the contents of `src/integrations/supabase/types.ts`

## 🎯 What This Fixes

Once the migration is applied, the following features will work:
- ✅ Event creation and management
- ✅ Event categories and filtering
- ✅ RSVP functionality
- ✅ Event notifications and reminders
- ✅ Social sharing
- ✅ Calendar integration
- ✅ User preferences

## 🚀 Testing After Migration

After applying the migration:
1. Restart your development server (`npm run dev`)
2. Navigate to any community calendar (`/communities/:id/calendar`)
3. Try creating a new event
4. Test RSVP functionality
5. Verify that events display properly

## 📝 Migration Safety

This migration script is designed to be safe and idempotent:
- Uses `CREATE TABLE IF NOT EXISTS` to avoid conflicts
- Checks for existing columns before adding them
- Handles existing policies gracefully
- Won't break existing data

The migration will create all necessary tables, indexes, policies, and default data needed for the events feature to function properly.
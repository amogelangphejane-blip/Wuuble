# Events Feature Migration Instructions

## Problem Identified
The events feature is not working because the required database tables have not been created in your Supabase database. The Supabase types file shows that only basic tables exist (`communities`, `community_members`, `community_posts`, `profiles`), but none of the events-related tables are present.

## Root Cause
The events-related database migrations have not been applied to your Supabase database. The following tables are missing:
- `community_events`
- `event_categories` 
- `event_rsvps`
- `event_notifications`
- `user_event_preferences`
- `event_shares`

## Solution
Apply the complete events migration to your Supabase database.

## Step-by-Step Instructions

### 1. Access Supabase Dashboard
1. Go to your Supabase project dashboard at: https://supabase.com/dashboard
2. Navigate to your project (the URL and key are configured in your app)
3. Go to the **SQL Editor** section

### 2. Apply the Migration
1. Copy the entire contents of the file `complete_events_migration.sql` (created in your project root)
2. Paste it into the SQL Editor in your Supabase dashboard
3. Click **Run** to execute the migration

### 3. Verify the Migration
After running the migration, you should see the following tables created:
- ✅ `community_events` - Main events table
- ✅ `event_categories` - Event categories with 8 default categories
- ✅ `event_rsvps` - RSVP tracking
- ✅ `event_notifications` - Notification system
- ✅ `user_event_preferences` - User preferences
- ✅ `event_shares` - Social sharing tracking

### 4. Update Database Types (Optional but Recommended)
After applying the migration, you should regenerate your Supabase types:
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the TypeScript types
3. Replace the content of `src/integrations/supabase/types.ts` with the new types

### 5. Test the Events Feature
1. Start your development server: `npm run dev`
2. Navigate to any community
3. Click on the "Calendar" tab or go to `/communities/{id}/calendar`
4. You should now see the enhanced events interface with:
   - Event creation form
   - Category selection
   - RSVP functionality
   - Event filtering and search

## What This Migration Creates

### Tables Created:
1. **community_events** - Core events table with fields for title, description, date, time, location, etc.
2. **event_categories** - Categorization system with 8 default categories (General, Meeting, Workshop, etc.)
3. **event_rsvps** - RSVP tracking with statuses (going, maybe, not_going, waitlist)
4. **event_notifications** - Notification and reminder system
5. **user_event_preferences** - User-specific preferences for notifications and defaults
6. **event_shares** - Social sharing analytics

### Security Features:
- Row Level Security (RLS) enabled on all tables
- Comprehensive policies for viewing, creating, updating, and deleting
- Proper foreign key constraints
- User permission checks

### Performance Features:
- Optimized indexes on frequently queried columns
- Realtime subscriptions for live updates
- Automatic timestamp triggers

### Default Data:
- 8 default event categories with colors and icons
- Automatic user preference creation for new users

## Troubleshooting

### If the migration fails:
1. Check that all prerequisite tables exist (`communities`, `profiles`, `community_members`)
2. Ensure you have proper permissions in your Supabase project
3. Run the migration in smaller chunks if needed

### If events still don't work after migration:
1. Check browser console for errors
2. Verify the Supabase client configuration in `src/integrations/supabase/client.ts`
3. Ensure you're logged in and have access to communities
4. Check network requests in browser dev tools

## Expected Results
After applying this migration, the events feature should be fully functional with:
- ✅ Event creation and editing
- ✅ Category management
- ✅ RSVP functionality
- ✅ Event filtering and search
- ✅ Notification system
- ✅ Social sharing
- ✅ Calendar integration
- ✅ User preferences

The enhanced community calendar should load without errors and display all the advanced features documented in the `ENHANCED_EVENTS_DOCUMENTATION.md` file.
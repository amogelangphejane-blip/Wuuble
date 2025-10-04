# Events Feature Troubleshooting Guide

## Issue: Failed to Create Event

If you're getting an error when trying to create an event, follow these steps:

## Solution Steps

### Step 1: Run the Database Migration (REQUIRED)

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file: `EVENTS_TROUBLESHOOTING_FIX.sql` (in the root directory)
4. Copy ALL the SQL content from that file
5. Paste it into the Supabase SQL Editor
6. Click **Run** or press `Ctrl+Enter`

This will:
- ✅ Create missing tables (`community_events`, `event_categories`, `event_rsvps`)
- ✅ Add missing columns to existing tables
- ✅ Set up proper Row Level Security (RLS) policies
- ✅ Create default event categories
- ✅ Create necessary indexes for performance

### Step 2: Verify the Setup

After running the SQL, you should see a result showing:
```
table_name        | column_count
------------------|-------------
community_events  | 19
event_categories  | 8
event_rsvps      | 7
```

### Step 3: Check Your Permissions

Make sure you are:
- ✅ **Logged in** to the application
- ✅ A **member** of the community where you're creating the event
- ✅ Or the **owner/creator** of the community

### Step 4: Test Event Creation

Try creating a simple event with minimal fields:
1. Go to a community's Calendar page
2. Click "Create Event"
3. Fill in ONLY the required fields:
   - **Title**: "Test Event"
   - **Event Date**: Select any future date
   - **Description**: "This is a test"
4. Click "Create Event"

## Common Error Messages and Solutions

### Error: "Database schema error. Please run the events migration SQL script."
**Cause**: Database tables or columns are missing
**Solution**: Run Step 1 above (the SQL migration script)

### Error: "You don't have permission to create events in this community"
**Cause**: You're not a member or owner of the community
**Solution**: 
- Join the community first
- Or ask the community owner to add you as a member

### Error: "Invalid community or category selected"
**Cause**: The community ID or category ID doesn't exist
**Solution**: 
- Make sure you're on a valid community page
- Try not selecting a category (leave it blank)

### Error: "column does not exist"
**Cause**: Your database schema is outdated
**Solution**: Run the SQL migration script (Step 1)

## What Changed

### Files Modified:
1. **`src/hooks/useEvents.tsx`** - Enhanced error handling and better error messages
2. **`EVENTS_TROUBLESHOOTING_FIX.sql`** - Complete database setup script

### Improvements:
- ✅ Better error messages that tell you exactly what's wrong
- ✅ Handles missing optional fields gracefully
- ✅ Only inserts fields that exist in the database
- ✅ Provides specific guidance based on the error type
- ✅ Validates user permissions before attempting insert

## Testing Checklist

After applying the fix:
- [ ] Can view events list
- [ ] Can create a simple event (title + date only)
- [ ] Can create a full event (with all fields)
- [ ] Can see your created event in the list
- [ ] Can edit your event
- [ ] Can delete your event
- [ ] Can RSVP to events
- [ ] Error messages are clear and helpful

## Still Having Issues?

If you're still experiencing problems:

1. **Check Browser Console**:
   - Press `F12` to open Developer Tools
   - Go to the **Console** tab
   - Look for red error messages
   - Copy the full error message

2. **Check Network Tab**:
   - In Developer Tools, go to **Network** tab
   - Try creating an event
   - Look for failed requests (red)
   - Click on the failed request
   - Check the **Response** tab for error details

3. **Verify Database Setup**:
   Run this query in Supabase SQL Editor:
   ```sql
   -- Check if tables exist
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('community_events', 'event_categories', 'event_rsvps');

   -- Check community_events columns
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'community_events'
   ORDER BY ordinal_position;
   ```

4. **Check RLS Policies**:
   ```sql
   -- List all policies for community_events
   SELECT policyname, cmd, qual 
   FROM pg_policies 
   WHERE tablename = 'community_events';
   ```

## Quick Fix Checklist

- [ ] SQL migration script run successfully
- [ ] All three tables exist (community_events, event_categories, event_rsvps)
- [ ] You're logged in
- [ ] You're a member of the community
- [ ] Browser console shows no errors
- [ ] Event creation works!

## Additional Notes

### Default Event Categories
The SQL script creates these default categories:
- **Meeting** (Blue)
- **Workshop** (Purple)
- **Social** (Pink)
- **Webinar** (Green)
- **Conference** (Orange)

You can add more categories through the event form!

### Supported Event Features
- ✅ Basic events (title, date, time, location)
- ✅ Virtual events (with meeting links)
- ✅ Recurring events (daily, weekly, monthly, yearly)
- ✅ Event categories and tags
- ✅ RSVP system (going, maybe, not going, waitlist)
- ✅ Event visibility (public, members only, private)
- ✅ Max attendees limit
- ✅ Event cover images
- ✅ Multiple timezones

## Success!

Once everything is working, you should be able to:
- ✨ Create events seamlessly
- ✨ See helpful error messages if something goes wrong
- ✨ Manage events (edit/delete your own events)
- ✨ RSVP to events
- ✨ View events in list, grid, or calendar view
- ✨ Use infinite scroll to load more events

Happy event planning! 🎉

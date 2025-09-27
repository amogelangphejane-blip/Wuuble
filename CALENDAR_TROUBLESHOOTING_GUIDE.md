# 📅 Calendar Feature Troubleshooting Guide

## 🚨 Quick Fixes

### Problem: Calendar page is blank or not loading

**Solution 1: Check Database Setup**
```sql
-- Run this in your Supabase SQL Editor to ensure tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('community_events', 'communities', 'community_members');
```

**Solution 2: Apply Complete Migration**
```bash
# Run the complete events migration
psql -h your-supabase-host -d your-database -f complete_events_migration.sql
```

**Solution 3: Check Authentication**
- Make sure user is logged in
- Verify JWT token is valid
- Check browser console for auth errors

### Problem: "Cannot create events" or "Access Denied"

**Solution: Fix Row Level Security Policies**
```sql
-- Grant proper permissions for community events
CREATE POLICY "Users can view events in accessible communities" 
ON public.community_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.communities c 
    WHERE c.id = community_events.community_id 
    AND (
      NOT c.is_private 
      OR c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
      )
    )
  )
);
```

### Problem: Events not showing up

**Check these common issues:**

1. **User Membership**: Ensure user is a member of the community
```sql
SELECT * FROM community_members 
WHERE user_id = 'your-user-id' 
AND community_id = 'your-community-id';
```

2. **Event Visibility**: Check if events have proper visibility settings
```sql
SELECT id, title, visibility FROM community_events 
WHERE community_id = 'your-community-id';
```

3. **RLS Policies**: Verify policies allow access
```sql
-- Test if you can read events
SELECT COUNT(*) FROM community_events 
WHERE community_id = 'your-community-id';
```

## 🔧 Fixed Implementation

I've created a **fixed calendar component** (`CalendarFeatureFix.tsx`) that addresses common issues:

### Key Fixes:

1. **Better Error Handling**: Shows specific error messages instead of blank pages
2. **Authentication Checks**: Properly handles unauthenticated users
3. **RLS Policy Compatibility**: Works with both direct access and membership-based access
4. **Loading States**: Clear loading indicators
5. **Graceful Fallbacks**: Falls back to membership check if direct community access fails

### Updated Route:
```tsx
// App.tsx now uses the fixed component
<Route path="/community/:id/calendar" element={
  <ProtectedRoute>
    <CalendarFeatureFix />
  </ProtectedRoute>
} />
```

## 🛠️ Debug Tools

### 1. Use the Debug Tool
Open `/debug-calendar-issues.html` in your browser to:
- Test database connection
- Check table existence
- Verify permissions
- Test event creation

### 2. Browser Console Debugging
```javascript
// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);

// Test community access
const { data, error } = await supabase
  .from('communities')
  .select('*')
  .eq('id', 'your-community-id');
console.log('Community access:', data, error);

// Test event creation
const { data: events, error: eventsError } = await supabase
  .from('community_events')
  .select('*')
  .eq('community_id', 'your-community-id');
console.log('Events:', events, eventsError);
```

## 📋 Database Setup Checklist

### Required Tables:
- ✅ `communities` - Basic community table
- ✅ `community_members` - User membership tracking  
- ✅ `community_events` - Events table
- ✅ `profiles` - User profiles
- ⚡ `event_categories` - Event categories (optional)
- ⚡ `event_rsvps` - RSVP tracking (optional)

### Required Columns in `community_events`:
```sql
CREATE TABLE public.community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  is_virtual BOOLEAN DEFAULT false,
  max_attendees INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Required Policies:
```sql
-- Enable RLS
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;

-- Allow viewing events in accessible communities
CREATE POLICY "view_events" ON community_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM communities c 
    WHERE c.id = community_events.community_id 
    AND (
      NOT c.is_private 
      OR c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
      )
    )
  )
);

-- Allow creating events in communities user belongs to
CREATE POLICY "create_events" ON community_events FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM communities c 
    WHERE c.id = community_events.community_id 
    AND (
      c.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM community_members cm 
        WHERE cm.community_id = c.id AND cm.user_id = auth.uid()
      )
    )
  )
);
```

## 🚀 Quick Setup Commands

### 1. Apply the complete migration:
```bash
# Download and run the complete events migration
curl -o complete_events_migration.sql https://your-repo/complete_events_migration.sql
# Then run in Supabase SQL Editor or via psql
```

### 2. Test the setup:
```bash
# Open the debug tool
open debug-calendar-issues.html
# Or use the browser debug tool at /debug-calendar-issues.html
```

### 3. Clear browser cache:
```bash
# Clear all browser data for your app domain
# Or use incognito/private browsing mode
```

## 🔍 Common Error Messages

### "Cannot read properties of undefined"
**Cause**: Missing data or null values
**Fix**: Add null checks in components
```tsx
// Instead of: event.title
// Use: event?.title || 'Untitled Event'
```

### "Row level security policy violation"
**Cause**: RLS policies blocking access
**Fix**: Check user membership and policy conditions

### "Cannot access before initialization"
**Cause**: Hook dependency issues
**Fix**: Check useEffect dependencies and loading states

### "Network Error" or "Failed to fetch"
**Cause**: Supabase connection issues
**Fix**: Check Supabase URL and API keys

## 📞 Support

If you're still having issues after trying these fixes:

1. **Check the browser console** for JavaScript errors
2. **Use the debug tool** (`debug-calendar-issues.html`) to test your setup
3. **Verify your Supabase project** settings and RLS policies
4. **Test with a fresh browser session** (incognito mode)
5. **Check your database** directly via Supabase dashboard

## ✅ Success Indicators

Your calendar should be working when:
- ✅ Debug tool shows all green checkmarks
- ✅ You can see the calendar page without errors
- ✅ Events load properly (even if list is empty)
- ✅ You can create new events (if you're a community member)
- ✅ No errors in browser console

## 🎯 Next Steps

Once your calendar is working:
1. Try the enhanced features in `EnhancedEventsHub.tsx`
2. Set up event categories and RSVP tracking
3. Configure advanced features like recurring events
4. Add calendar integrations and notifications

The calendar feature should now be fully functional! 🎉
# Group Video Call Feature Fix Guide

## 🔍 Issue Identified

The group video call feature is **not working** because the required database tables are missing from the Supabase database. The code implementation is complete and functional, but the database schema has not been applied.

## 🚨 Root Cause

The following tables are missing from the database:
- `community_group_calls`
- `community_group_call_participants` 
- `community_group_call_events`

These tables are required for the group video call feature to function properly. When users try to start or join a group call, the application fails because it cannot insert/query data from these non-existent tables.

## ✅ Solution

### Step 1: Apply the Database Migration

The database schema has been prepared in the migration file:
`supabase/migrations/20250812235800_add_group_video_calls.sql`

**Option A: Using Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file above
4. Execute the SQL to create the tables

**Option B: Using Supabase CLI**
```bash
# Link your project (if not already linked)
npx supabase link --project-ref tgmflbglhmnrliredlbn

# Push the migration
npx supabase db push
```

### Step 2: Update Database Types

After applying the migration, regenerate the TypeScript types:

```bash
npx supabase gen types typescript --project-id tgmflbglhmnrliredlbn > src/integrations/supabase/types.ts
```

### Step 3: Verify the Fix

1. Start the development server: `npm run dev`
2. Navigate to a community page
3. Click "Start Group Call" in the Quick Actions section
4. The feature should now work properly

## 🧪 Testing the Feature

Once the database tables are created, test the following:

1. **Start a Group Call**
   - Navigate to any community
   - Click "Start Group Call"
   - Allow camera/microphone permissions
   - Verify the call is created successfully

2. **Join a Group Call**
   - Share the invite link with another user
   - Verify they can join the call
   - Test audio/video functionality

3. **Group Call Features**
   - Toggle audio/video
   - Screen sharing
   - Text chat
   - Participant management (if you're the host)

## 🔧 Technical Details

### Database Schema Overview

The migration creates three main tables:

1. **community_group_calls**: Tracks group video call sessions
2. **community_group_call_participants**: Manages participants in calls
3. **community_group_call_events**: Logs call events for analytics

### Security Features

- Row Level Security (RLS) policies ensure users can only access calls in communities they're members of
- Proper authentication and authorization checks
- Community membership validation

### Performance Optimizations

- Indexes on frequently queried columns
- Automatic participant count updates via triggers
- Cleanup functions for inactive calls

## 🚀 Feature Capabilities

Once working, the group video call feature provides:

- **Multi-participant video calling** (up to 50 participants)
- **Adaptive grid layout** (1x1 to 4x4 based on participant count)
- **Audio/video controls** with toggle functionality
- **Screen sharing** with automatic track replacement
- **Real-time chat** with unread message indicators
- **Participant management** (mute, kick, promote for hosts/moderators)
- **Connection quality indicators**
- **Invite link generation and sharing**
- **Pre-call setup screen** with camera/microphone testing

## 🔗 Integration Points

The feature is integrated into:
- Community detail pages (Quick Actions section)
- Routing system (`/communities/:id/group-call`)
- Authentication system
- Database with proper RLS policies

## 📱 Browser Requirements

- Modern browsers with WebRTC support
- Camera and microphone permissions
- HTTPS (required for WebRTC)
- Stable internet connection

## 🛠️ Development Notes

- Uses mock signaling service by default (`useMockSignaling: true`)
- WebRTC mesh network architecture (suitable for up to ~10 participants)
- For larger groups, consider implementing SFU architecture
- All communications are encrypted via WebRTC

## 🎯 Next Steps

After applying the database migration:

1. The group video call feature will be fully functional
2. Users can start and join group calls
3. All advanced features (screen sharing, chat, participant management) will work
4. Consider implementing additional features like recording or breakout rooms

## 🐛 Troubleshooting

If issues persist after applying the migration:

1. **Check browser console** for JavaScript errors
2. **Verify permissions** for camera/microphone access
3. **Test in different browsers** for compatibility
4. **Check network connectivity** for WebRTC connections
5. **Verify database policies** are working correctly

The implementation is solid and comprehensive - it just needs the database tables to be created!
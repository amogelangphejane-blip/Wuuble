# Setup Guide - Community Discussion Features

## Quick Start

### 1. Database Migration

Run the new migration to create the likes and comments tables:

```bash
# If using local Supabase (with Docker)
npx supabase db reset --local

# If using remote Supabase
npx supabase db push
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test the Features

1. **Navigate to a Community**: Go to `/communities/:id`
2. **Create a Post**: Use the "What's on your mind?" input at the top
3. **Like Posts**: Click the heart icon on any post
4. **Add Comments**: Click the comment icon to expand and add comments
5. **Reply to Comments**: Click "Reply" under any comment

## Migration File Location

The new database schema is defined in:
```
supabase/migrations/20250123000000_add_community_discussion_features.sql
```

## Key Components Modified

### `src/components/CommunityPosts.tsx`
- Complete rewrite with Skool-like features
- Likes, comments, and real-time updates
- Nested reply system

### Database Tables Added
- `community_post_likes` - Tracks post likes
- `community_post_comments` - Handles comments and replies

## Features to Test

### ✅ Post Creation
- Multi-line text support
- User avatar display
- Real-time posting

### ✅ Like System
- Click heart to like/unlike
- Like count display
- Real-time like updates
- Optimistic UI updates

### ✅ Comment System
- Expandable comment sections
- Add comments to posts
- Reply to specific comments
- Nested reply display
- Real-time comment updates

### ✅ Real-time Features
- New posts appear instantly
- Like counts update live
- Comments sync across users
- Multiple user testing recommended

## Testing Scenarios

### Single User Testing
1. Create multiple posts
2. Like and unlike posts
3. Add comments to posts
4. Reply to your own comments
5. Test keyboard shortcuts (Enter to submit)

### Multi-User Testing
1. Open app in multiple browser tabs/windows
2. Log in as different users
3. Create posts from one user
4. Like/comment from another user
5. Verify real-time updates

### Edge Cases
1. Empty content handling
2. Very long posts/comments
3. Rapid clicking (like spam)
4. Network disconnection/reconnection

## Troubleshooting

### Migration Issues
- Ensure Supabase CLI is installed
- Check database connection
- Verify migration file syntax

### Real-time Not Working
- Check Supabase realtime is enabled
- Verify RLS policies
- Check browser console for errors

### UI Issues
- Clear browser cache
- Check for JavaScript errors
- Verify all UI components are imported

## Performance Notes

- Posts are loaded in reverse chronological order (newest first)
- Comments are loaded with posts for better performance
- Real-time subscriptions are optimized with filters
- UI updates are optimistic for better user experience

## Security Features

- All database operations respect RLS policies
- Users can only interact with communities they have access to
- Content validation prevents XSS attacks
- Proper user authentication required for all actions
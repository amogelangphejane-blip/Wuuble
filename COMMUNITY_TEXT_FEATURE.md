# Community Text Feature

## Overview

The built-in community text feature allows users to have real-time text discussions within communities. This feature includes:

- **Real-time messaging**: Messages appear instantly for all community members
- **User profiles**: Display names and avatars for message authors
- **Access control**: Private communities require membership to view/post messages
- **Responsive design**: Works seamlessly on desktop and mobile devices
- **Auto-scroll**: Automatically scrolls to the latest messages

## Features Added

### Database Schema
- **`community_posts` table**: Stores all community messages
- **Row Level Security (RLS)**: Ensures users can only access appropriate content
- **Real-time subscriptions**: Powered by Supabase's real-time features

### UI Components
- **`CommunityPosts`**: Main component for displaying and creating posts
- **`CommunityDetail`**: Full community page with posts integration
- **Responsive layout**: Sidebar with community info, main area for posts

### Key Functionality
- **Join/Leave communities**: Users can join public communities or request access to private ones
- **Real-time updates**: New messages appear instantly without page refresh
- **Message timestamps**: Shows relative time (e.g., "2 minutes ago")
- **Keyboard shortcuts**: Press Enter to send messages
- **Member list**: View all community members with their roles

## Setup Instructions

### 1. Apply Database Migration

Run the following SQL migration in your Supabase dashboard or CLI:

```sql
-- This creates the community_posts table and sets up RLS policies
-- File: /workspace/supabase/migrations/20250120000000_add_community_posts.sql
```

### 2. Start the Development Server

```bash
npm install
npm run dev
```

### 3. Test the Feature

1. Navigate to `/communities`
2. Create a new community or join an existing one
3. Click "View" on any community to access the community detail page
4. Start posting messages in the discussion area

## Usage

### For Community Members
- **View messages**: All community members can see the discussion
- **Post messages**: Type in the input field and press Enter or click Send
- **Real-time updates**: See new messages from other users instantly

### For Community Creators
- **Full access**: Can view and post in their communities
- **Member management**: See all community members in the sidebar
- **Crown icon**: Displayed next to creator's name

### For Non-Members
- **Public communities**: Can view and join to participate
- **Private communities**: Must join first to see discussions

## Technical Details

### Real-time Implementation
- Uses Supabase's real-time subscriptions
- Listens for INSERT events on the `community_posts` table
- Automatically updates the UI when new messages arrive

### Security
- RLS policies ensure users only see appropriate content
- Private community messages are hidden from non-members
- Users can only edit/delete their own messages

### Performance
- Efficient database queries with proper indexing
- Optimistic UI updates for better user experience
- Auto-scrolling to latest messages

## Files Created/Modified

### New Files
- `src/components/CommunityPosts.tsx` - Main posts component
- `src/pages/CommunityDetail.tsx` - Individual community page
- `supabase/migrations/20250120000000_add_community_posts.sql` - Database schema

### Modified Files
- `src/App.tsx` - Added route for community detail pages

## Next Steps

The community text feature is now fully functional. Users can:

1. **Join communities** from the communities page
2. **View community discussions** by clicking "View" on any community
3. **Post messages** in real-time with other community members
4. **See member lists** and community information

The feature integrates seamlessly with the existing community system and provides a solid foundation for community engagement.
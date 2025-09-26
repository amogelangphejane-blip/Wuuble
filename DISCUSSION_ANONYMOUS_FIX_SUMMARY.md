# Discussion Anonymous Posts Fix

## Problem
Posts in the discussion feature were showing as "Anonymous" instead of showing the actual user names.

## Root Cause
The issue was in multiple discussion components where the fallback logic for displaying user names defaulted to 'Anonymous' when:
1. User profile data was not properly fetched
2. Display names were not set in user profiles
3. Fallback logic was insufficient

## Solution Applied

### 1. Updated Display Name Logic
Changed all instances of fallback logic from:
```typescript
// Before
user.user_metadata?.display_name || 'Anonymous'

// After  
user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'
```

### 2. Created Utility Functions
Created `/workspace/src/utils/profileUtils.ts` with:
- `ensureUserProfile()` - Ensures a user profile exists in the database
- `getUserDisplayName()` - Consistent logic for getting user display names
- `getUserInitials()` - Gets user initials for avatars

### 3. Enhanced Profile Data Fetching
Updated components to:
- Fetch user profile data from the `profiles` table
- Include `display_name` in database queries
- Use proper joins to get user information with posts

### 4. Fixed Components

#### CommunityDiscussion.tsx
- Enhanced `fetchPosts()` to query real data with profile joins
- Updated `handleCreatePost()` to ensure user profile exists
- Improved `handleComment()` with proper user data
- Fixed all display name fallback logic

#### SimplifiedSkoolDiscussions.tsx
- Updated interface to include `display_name`
- Enhanced `fetchPosts()` to query profile data
- Improved `getUserName()` function with proper fallbacks
- Fixed mock data to include display names

#### SkoolDiscussions.tsx
- Enhanced profile data fetching logic
- Added `display_name` to the fallback chain

#### FixedSkoolDiscussions.tsx
- Improved user name resolution logic
- Added `display_name` support

### 5. Database Schema Support
The fix leverages the existing database schema:
- `profiles` table with `display_name`, `email`, `avatar_url` columns
- Foreign key relationships between posts and user profiles
- Proper RLS policies for data access

## Testing
To test the fix:
1. Sign up/sign in to the application
2. Navigate to any community
3. Create a new discussion post
4. Verify that your name appears instead of "Anonymous"
5. Check that existing posts show proper user names

## Expected Results
- New posts should show the user's display name if set
- If no display name is set, it should show the username part of their email (e.g., "john" from "john@example.com")
- Only fallback to "User" if no other information is available
- Avatar initials should correspond to the display name
- Mock data should show proper names for demonstration

## Files Modified
- `/workspace/src/components/CommunityDiscussion.tsx`
- `/workspace/src/components/SimplifiedSkoolDiscussions.tsx`
- `/workspace/src/components/SkoolDiscussions.tsx`
- `/workspace/src/components/FixedSkoolDiscussions.tsx`
- `/workspace/src/utils/profileUtils.ts` (created)

The fix ensures that posts in discussions will show meaningful user names instead of "Anonymous", providing a much better user experience.
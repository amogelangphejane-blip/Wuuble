# Upload Permission Fix: Row-Level Security Policy Violation

## Problem Description

Users are encountering the error: **"Cannot upload: new row violates row-level security policy"**

This error occurs when trying to upload avatar images (either profile pictures or community avatars) due to misconfigured Row-Level Security (RLS) policies in Supabase storage.

## Root Cause Analysis

The issue stems from inconsistent or overly restrictive RLS policies on the `storage.objects` table. Specifically:

### Community Avatar Upload Issue
- **Current Policy**: The original policy in `20250108000000_add_community_avatars_storage.sql` allows any authenticated user to upload to the `community-avatars` bucket
- **File Path Structure**: `communities/{community_id}/avatar-{timestamp}.{ext}`
- **Problem**: The policy may be too permissive initially but then conflicts with UPDATE/DELETE policies that require community ownership

### Profile Picture Upload Issue
- **Current Policy**: Requires the user ID to match the folder name: `auth.uid()::text = (storage.foldername(name))[1]`
- **File Path Structure**: `{user_id}/avatar-{timestamp}.{ext}`
- **Problem**: Should work correctly but may have edge cases

## Solutions Provided

### Solution 1: Strict Community Ownership (Recommended)
**File**: `supabase/migrations/20250123000000_fix_community_avatar_upload_permissions.sql`

This solution ensures only community creators can upload community avatars:
- Drops the overly permissive original policy
- Creates a new policy that checks community ownership
- Maintains consistency with UPDATE/DELETE policies

### Solution 2: Flexible Community Member Access
**File**: `supabase/migrations/20250123000001_alternative_community_avatar_policy.sql`

This solution allows both community creators AND members to upload avatars:
- More flexible for collaborative communities
- Checks either creator ownership OR community membership
- Better user experience for active community members

## How to Apply the Fix

### Option 1: Local Development (Requires Docker)
```bash
cd /workspace
npx supabase db reset --local
```

### Option 2: Production/Remote Database
```bash
cd /workspace
npx supabase db push
```

### Option 3: Manual SQL Execution
Execute the SQL from either migration file directly in your Supabase dashboard.

## Testing the Fix

Use the `StoragePolicyTest` component to verify the fix:

1. Navigate to the component in your app
2. Click "Test Storage Policies"
3. Check that "Upload Permission" shows success
4. Try uploading an actual avatar to confirm

## Prevention

To prevent similar issues in the future:

1. **Consistent Policy Design**: Ensure INSERT, UPDATE, and DELETE policies follow the same security model
2. **Test Coverage**: Always test storage policies with the actual upload paths used in the frontend
3. **Documentation**: Document the expected file path structure for each bucket
4. **Validation**: Use the `StoragePolicyTest` component regularly during development

## File Path Structures

### Profile Pictures
- **Bucket**: `profile-pictures`
- **Path**: `{user_id}/avatar-{timestamp}.{ext}`
- **Policy**: User can only access their own folder

### Community Avatars
- **Bucket**: `community-avatars`  
- **Path**: `communities/{community_id}/avatar-{timestamp}.{ext}`
- **Policy**: Creator or member access (depending on chosen solution)

## Related Files

- `src/components/ProfilePictureUpload.tsx` - Profile picture upload logic
- `src/components/CommunityAvatarUpload.tsx` - Community avatar upload logic
- `src/components/StoragePolicyTest.tsx` - Testing component for storage policies
- `supabase/migrations/20250108000000_add_community_avatars_storage.sql` - Original community avatar policies
- `supabase/migrations/20250121000000_setup_profile_pictures.sql` - Profile picture policies
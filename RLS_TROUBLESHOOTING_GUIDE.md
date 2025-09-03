# RLS Policy Troubleshooting Guide

## Overview

This guide helps diagnose and fix Row Level Security (RLS) policy issues in your Supabase application.

## Common RLS Problems and Solutions

### 1. Infinite Recursion in Policies

**Problem**: Policies that reference each other create infinite loops, causing queries to hang or fail.

**Symptoms**:
- Queries timeout or hang indefinitely
- Database connection errors
- High CPU usage on database

**Solution**: 
- Use non-recursive helper functions
- Avoid policies that reference the same table they're applied to
- Use direct table joins instead of function calls in policies

**Fixed in**: `20250108000001_comprehensive_rls_fix.sql`

### 2. Storage Bucket Access Issues

**Problem**: Users cannot upload, view, or manage files in storage buckets.

**Symptoms**:
- Upload failures with permission errors
- Images not loading or displaying
- "Access denied" errors in storage operations

**Solution**:
- Ensure storage buckets are properly configured as public
- Verify folder structure in policies matches your app logic
- Test with the `StoragePolicyTest` component

### 3. Policy Conflicts

**Problem**: Multiple policies with similar names or conflicting logic.

**Symptoms**:
- Inconsistent access behavior
- Some operations work while others don't
- Policy violations that shouldn't occur

**Solution**:
- Drop all conflicting policies and recreate with clear naming
- Use descriptive policy names that indicate their purpose
- Test each policy independently

## Diagnostic Steps

### 1. Check Policy Status

Run the validation migration to see current policy state:

```sql
-- Execute: 20250108000002_validate_rls_policies.sql
```

### 2. Test Storage Policies

Use the `StoragePolicyTest` component in your Profile Settings:
1. Go to Profile Settings
2. Click "Test Storage Policies"
3. Review all test results

### 3. Check Database Logs

Look for these error patterns:
- "infinite recursion detected"
- "policy violation"
- "permission denied"
- "row level security"

### 4. Validate Helper Functions

Ensure helper functions are working:

```sql
-- Test the helper function
SELECT public.is_community_member('your-community-id', 'your-user-id');
```

## Key Fixes Implemented

### 1. Non-Recursive Helper Function

Created `is_community_member()` function that safely checks membership without recursion:

```sql
CREATE OR REPLACE FUNCTION public.is_community_member(community_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members 
    WHERE community_members.community_id = $1 
    AND community_members.user_id = $2
  );
$$;
```

### 2. Simplified Community Policies

**Before**: Complex nested policies with circular references
**After**: Clear, direct policies using simple logic

### 3. Clear Storage Policies

**Profile Pictures**:
- Users can upload/update/delete their own files
- Everyone can view (public read)

**Community Avatars**:
- Authenticated users can upload to proper folder structure
- Community creators can manage their community's avatar
- Everyone can view (public read)

## Testing Your Fixes

### Manual Testing Checklist

1. **Community Access**:
   - [ ] Can view public communities
   - [ ] Can view own communities
   - [ ] Can view communities you're a member of
   - [ ] Cannot view private communities you're not a member of

2. **Community Members**:
   - [ ] Can view members of public communities
   - [ ] Can view members of communities you created
   - [ ] Can view your own membership records
   - [ ] Can join/leave communities appropriately

3. **Community Posts**:
   - [ ] Can view posts in accessible communities
   - [ ] Can create posts in communities you belong to
   - [ ] Can edit/delete your own posts
   - [ ] Community admins can delete posts

4. **Storage**:
   - [ ] Can upload profile pictures
   - [ ] Can view uploaded images
   - [ ] Can upload community avatars (if community creator)
   - [ ] Images display correctly across the app

### Automated Testing

Use the `StoragePolicyTest` component for comprehensive storage testing.

## Emergency Fixes

If you need to quickly disable RLS to restore functionality:

```sql
-- EMERGENCY: Disable RLS (NOT recommended for production)
ALTER TABLE public.communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts DISABLE ROW LEVEL SECURITY;

-- Remember to re-enable after fixing policies:
-- ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
```

## Prevention Best Practices

1. **Avoid Circular References**: Never have policies that reference the same table they're applied to
2. **Use Helper Functions**: Create simple, focused functions for complex logic
3. **Test Incrementally**: Test each policy as you create it
4. **Clear Naming**: Use descriptive names that indicate the policy's purpose
5. **Regular Validation**: Run validation queries periodically

## Migration Order

Apply migrations in this order:
1. `20250108000001_comprehensive_rls_fix.sql` - Fix all policy issues
2. `20250108000002_validate_rls_policies.sql` - Validate the fixes

## Support

If you continue to experience RLS issues:
1. Run the validation migration and share results
2. Use the StoragePolicyTest component
3. Check browser console for specific error messages
4. Test with different user accounts and community types

---

*This guide was created to address the infinite recursion and policy conflict issues identified in the application.*
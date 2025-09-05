# Fix Frontend Tags Query

## Problem
The error "could not find the 'tags' column of 'community_resources' in the schema cache" occurs because the frontend is trying to query a `tags` column that doesn't exist directly on the `community_resources` table.

## Root Cause
Tags are stored in a many-to-many relationship:
- `community_resources` table (main resources)
- `resource_tags` table (available tags)
- `resource_tag_assignments` table (links resources to tags)

## Solution

### Option 1: Use the Correct Join Query
Replace any queries that try to select `tags` directly with this pattern:

```typescript
// ❌ WRONG - This will cause the "tags column not found" error
const { data, error } = await supabase
  .from('community_resources')
  .select('*, tags') // This doesn't work!
  .eq('community_id', communityId);

// ✅ CORRECT - Use proper join syntax
const { data, error } = await supabase
  .from('community_resources')
  .select(`
    *,
    category:resource_categories(id, name, color, icon),
    profiles(display_name, avatar_url),
    tags:resource_tag_assignments(
      resource_tags(id, name)
    )
  `)
  .eq('community_id', communityId)
  .eq('is_approved', true);
```

### Option 2: Use the Helper View
After running the SQL fix, you can use the new view:

```typescript
// Use the new view that includes tags properly
const { data, error } = await supabase
  .from('community_resources_with_tags')
  .select('*')
  .eq('community_id', communityId)
  .eq('is_approved', true);
```

### Option 3: Use the Helper Function
For getting tags for specific resources:

```typescript
// Get tags for a specific resource using the helper function
const { data, error } = await supabase
  .rpc('get_resource_tags', { resource_id: 'your-resource-id' });
```

## Frontend Code Updates Needed

1. **Update CommunityResources.tsx** - Line 132-137:
   ```typescript
   // Current query in buildQuery() method
   let query = supabase
     .from('community_resources')
     .select(`
       *,
       category:resource_categories(id, name, color, icon),
       profiles(display_name, avatar_url),
       tags:resource_tag_assignments(
         resource_tags(id, name)
       )
     `)
     .eq('community_id', communityId)
     .eq('is_approved', true);
   ```

2. **Process tags correctly** - Line 242-244:
   ```typescript
   // Process tags from the join result
   const tags = resource.tags?.map((tagAssignment: any) => ({
     id: tagAssignment.resource_tags.id,
     name: tagAssignment.resource_tags.name
   })) || [];
   ```

## Steps to Fix

1. Run the SQL fix: `fix-tags-schema-cache.sql`
2. Update frontend queries to use proper joins
3. Clear any cached queries in your application
4. Restart your application to refresh schema cache

## Verification

After applying the fix, test with:

```typescript
// This should now work without errors
const { data, error } = await supabase
  .from('community_resources')
  .select(`
    *,
    tags:resource_tag_assignments(resource_tags(name))
  `)
  .limit(1);

console.log('Tags query test:', { data, error });
```
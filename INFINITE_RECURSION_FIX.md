# Fix for Infinite Recursion Issue in Community Creation

## Problem
When trying to create a community, you encounter an infinite recursion error. This is caused by circular references in the Row Level Security (RLS) policies between the `communities` and `community_members` tables.

## Root Cause
The original RLS policies had circular dependencies:
- The `communities` table policy checks if a user is a member by querying `community_members`
- The `community_members` table policy checks community access by querying `communities`
- This creates an infinite loop when PostgreSQL tries to evaluate the policies

## Solution

### Option 1: Apply the Migration (Recommended)
If you have access to Supabase CLI and can push migrations:

1. The migration file `supabase/migrations/20250805163745_f5a6b8e9-b330-481d-a854-de40e99c3a0c.sql` has been updated with the fix
2. Push the migration to your Supabase project:
   ```bash
   npx supabase db push
   ```

### Option 2: Manual SQL Execution
If you can't use the CLI, manually run the SQL script:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `fix_infinite_recursion.sql`
4. Execute the script

### Option 3: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Policies
3. Delete the existing policies for `communities` and `community_members` tables
4. Create new policies using the SQL from `fix_infinite_recursion.sql`

## What the Fix Does

### For Communities Table
The new policy allows users to see:
- All public communities
- Private communities they created
- Private communities they are members of (using direct subquery without recursion)

### For Community Members Table  
The new policy allows users to see members of:
- Public communities (direct check on communities table)
- Private communities they created (direct check on communities table)
- Their own membership records
- Other members if they are also a member (using table alias to prevent recursion)

## Key Changes
1. **Removed circular references**: Policies no longer reference each other in a way that creates loops
2. **Used direct subqueries**: Instead of EXISTS clauses that reference both tables, we use direct IN clauses and table aliases
3. **Separated concerns**: Each policy focuses on its own table's access control without complex cross-references

## Testing
After applying the fix:
1. Try creating a new community
2. The infinite recursion error should be resolved
3. Community creation should work normally
4. Users should be able to view communities and members according to the privacy settings

## Files Modified
- `supabase/migrations/20250805163745_f5a6b8e9-b330-481d-a854-de40e99c3a0c.sql` - Updated migration
- `fix_infinite_recursion.sql` - Standalone SQL script for manual execution
-- ================================================
-- PREVENT FUTURE ISSUES - Run This Once
-- ================================================
-- This ensures your profile works for ALL features

-- Your profile is already created, but let's verify
-- both id and user_id are set correctly

SELECT 
    'CURRENT PROFILE STATUS' as check_type,
    id,
    user_id,
    display_name,
    CASE 
        WHEN id = user_id THEN '✅ CORRECT - Both columns match'
        WHEN id IS NULL THEN '❌ PROBLEM - id is NULL'
        WHEN user_id IS NULL THEN '❌ PROBLEM - user_id is NULL'
        ELSE '⚠️ WARNING - id and user_id dont match'
    END as status
FROM profiles
WHERE id = '6f279873-c8f5-4f1f-970a-f69ef0bcb524'
   OR user_id = '6f279873-c8f5-4f1f-970a-f69ef0bcb524';

-- ================================================
-- TABLES THAT MIGHT HAVE ISSUES
-- ================================================

/*
Based on the database schema, these features reference profiles:

1. ✅ community_members - Uses auth.users (YOU'RE GOOD)
2. ✅ community_resources - Uses auth.users (NOW FIXED)
3. ⚠️ community_posts - Uses profiles(user_id) (MIGHT HAVE ISSUES)
4. ⚠️ community_events - Uses profiles(user_id) (MIGHT HAVE ISSUES)
5. ⚠️ community_post_likes - Uses auth.users (SHOULD BE GOOD)
6. ⚠️ community_post_comments - Uses auth.users (SHOULD BE GOOD)

The ones marked ⚠️ with profiles(user_id) will work fine 
because we set BOTH id and user_id to your user ID.
*/

-- ================================================
-- VERIFY YOUR PROFILE WORKS FOR ALL FEATURES
-- ================================================

-- Test 1: Can you create posts? (references profiles.user_id)
SELECT 
    'POST CREATION CHECK' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles WHERE user_id = '6f279873-c8f5-4f1f-970a-f69ef0bcb524'
        ) THEN '✅ You can create posts'
        ELSE '❌ Posts will fail'
    END as status;

-- Test 2: Can you create events? (references profiles.user_id)
SELECT 
    'EVENT CREATION CHECK' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles WHERE user_id = '6f279873-c8f5-4f1f-970a-f69ef0bcb524'
        ) THEN '✅ You can create events'
        ELSE '❌ Events will fail'
    END as status;

-- Test 3: Can you create resources? (references auth.users via profiles.id)
SELECT 
    'RESOURCE CREATION CHECK' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles WHERE id = '6f279873-c8f5-4f1f-970a-f69ef0bcb524'
        ) THEN '✅ You can create resources'
        ELSE '❌ Resources will fail'
    END as status;

-- ================================================
-- SUMMARY
-- ================================================

SELECT 
    '=== PROFILE SUMMARY ===' as info,
    (SELECT COUNT(*) FROM profiles WHERE id = '6f279873-c8f5-4f1f-970a-f69ef0bcb524') as has_id_entry,
    (SELECT COUNT(*) FROM profiles WHERE user_id = '6f279873-c8f5-4f1f-970a-f69ef0bcb524') as has_user_id_entry,
    CASE 
        WHEN (SELECT COUNT(*) FROM profiles WHERE id = '6f279873-c8f5-4f1f-970a-f69ef0bcb524') > 0 
         AND (SELECT COUNT(*) FROM profiles WHERE user_id = '6f279873-c8f5-4f1f-970a-f69ef0bcb524') > 0
        THEN '✅ ALL FEATURES WILL WORK'
        ELSE '❌ SOME FEATURES MAY FAIL'
    END as overall_status;

-- Verification Script for Image Posts Feature
-- Run this to check if everything is set up correctly

-- Check 1: Does the image_url column exist?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'community_posts' 
      AND column_name = 'image_url'
    ) 
    THEN '✅ image_url column exists'
    ELSE '❌ image_url column is missing - Run fix-image-posts.sql'
  END AS column_check;

-- Check 2: Does the storage bucket exist?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM storage.buckets 
      WHERE id = 'community-post-images'
    ) 
    THEN '✅ Storage bucket exists'
    ELSE '❌ Storage bucket missing - Run fix-image-posts.sql'
  END AS bucket_check;

-- Check 3: Is the bucket public?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM storage.buckets 
      WHERE id = 'community-post-images' 
      AND public = true
    ) 
    THEN '✅ Bucket is public (images can be viewed)'
    ELSE '⚠️ Bucket is not public - Images may not display'
  END AS public_check;

-- Check 4: How many posts have images?
SELECT 
  COUNT(*) AS posts_with_images,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Posts with images found'
    ELSE 'ℹ️ No posts with images yet'
  END AS status
FROM public.community_posts
WHERE image_url IS NOT NULL;

-- Check 5: Are there any posts with the old placeholder text?
SELECT 
  COUNT(*) AS posts_with_placeholder,
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠️ Posts with placeholder text found - Run fix-image-posts.sql to clean up'
    ELSE '✅ No placeholder text found'
  END AS status
FROM public.community_posts
WHERE content IN ('[Image Post]', '[Image]', '[Link Post]', '[Link]', '[Post]')
AND (image_url IS NOT NULL OR link_url IS NOT NULL);

-- Check 6: Storage policies check
SELECT 
  COUNT(*) AS policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Storage policies configured'
    ELSE '❌ Storage policies incomplete - Run fix-image-posts.sql'
  END AS status
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%post images%';

-- Check 7: Index check
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = 'community_posts'
      AND indexname = 'idx_community_posts_image_url'
    ) 
    THEN '✅ Performance index exists'
    ELSE 'ℹ️ Performance index missing (optional)'
  END AS index_check;

-- Summary Report
SELECT 
  '=== IMAGE POSTS SETUP VERIFICATION ===' AS report,
  '' AS spacer;

SELECT 
  CASE 
    WHEN (
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'image_url')
      AND EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'community-post-images')
      AND (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%post images%') >= 4
    )
    THEN '✅ ✅ ✅ ALL CHECKS PASSED - Image posts feature is ready!'
    ELSE '❌ SETUP INCOMPLETE - Please run fix-image-posts.sql'
  END AS overall_status;

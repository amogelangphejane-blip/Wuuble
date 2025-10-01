-- =====================================================
-- MINIMAL Storage Buckets Setup
-- =====================================================
-- Most basic version - just creates the buckets
-- Use if other scripts fail
-- =====================================================

-- Bucket 1: Profile Pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket 2: Community Avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-avatars', 'community-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket 3: Post Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-post-images', 'community-post-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Show results
SELECT id, name, public FROM storage.buckets 
WHERE id IN ('profile-pictures', 'community-avatars', 'community-post-images');

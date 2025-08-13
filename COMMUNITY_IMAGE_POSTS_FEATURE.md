# Community Discussion Image Posts Feature

## Overview
Added image posting functionality to community discussions, allowing users to share images alongside text in their posts.

## Features Added

### 1. Database Schema Updates
- Added `image_url` column to `community_posts` table
- Created `community-post-images` storage bucket with proper policies
- Added database indexes for better performance

### 2. New Components
- **PostImageUpload**: Reusable component for uploading images in posts
  - Image preview functionality
  - File validation (type and size)
  - Upload progress indication
  - Image removal capability

### 3. Enhanced Community Posts
- Updated `CommunityPosts` component to support image uploads
- Modified post creation to handle both text and images
- Enhanced post rendering to display images
- Click-to-expand image functionality

### 4. Storage Management
- Extended storage utilities to support post images bucket
- Added validation for image file types (JPEG, PNG, WebP, GIF)
- Set file size limit to 10MB for post images

## Usage

### For Users
1. When creating a new post, click the "Add Image" button
2. Select an image file from your device
3. Preview the image before posting
4. Remove the image if needed by clicking the X button
5. Post with text, image, or both

### For Developers
```typescript
import { PostImageUpload } from '@/components/PostImageUpload';

// Use in your component
<PostImageUpload
  onImageUploaded={setImageUrl}
  currentImageUrl={imageUrl}
  disabled={isUploading}
/>
```

## Database Migration

The migration file `20250124000000_add_image_to_community_posts.sql` includes:
- Adding `image_url` column to `community_posts` table
- Creating `community-post-images` storage bucket
- Setting up proper RLS policies for image storage
- Adding performance indexes

## Storage Policies

The following policies are applied to the `community-post-images` bucket:
- Users can upload images to their own folder
- All users can view post images
- Users can update/delete only their own images
- Public read access for displaying images

## File Restrictions

- **Supported formats**: JPEG, PNG, WebP, GIF
- **Maximum file size**: 10MB
- **Storage path**: `{user_id}/{timestamp}.{extension}`

## Security Considerations

- Images are stored in user-specific folders
- RLS policies prevent unauthorized access
- File type validation prevents malicious uploads
- Size limits prevent storage abuse

## Technical Implementation

### Components
- `PostImageUpload.tsx`: Main image upload component
- `CommunityPosts.tsx`: Updated to support images

### Database
- `community_posts.image_url`: Stores the public URL of uploaded images
- Storage bucket: `community-post-images`

### Utilities
- `setupStorage.ts`: Extended with post images bucket support
- `checkPostImagesStorageReady()`: Validates storage setup

## Future Enhancements

Potential improvements that could be added:
- Multiple images per post
- Image compression and optimization
- Image editing capabilities
- Image galleries and albums
- Image search and filtering
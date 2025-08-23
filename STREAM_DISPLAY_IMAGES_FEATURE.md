# Stream Display Images Feature

## Overview

This feature allows livestream creators to upload custom display images that will be shown to viewers on the discover page instead of the default gradient placeholder. This enhances the visual appeal of streams and helps creators attract more viewers.

## Features

### For Creators
- **Upload custom display images** during stream creation
- **Manage display images** after stream creation through the stream management interface
- **Image processing** with automatic resizing and compression
- **Previous images gallery** to quickly switch between uploaded images
- **Real-time preview** of how the image will appear to viewers

### For Viewers
- **Enhanced discover page** with custom stream thumbnails
- **Better visual experience** when browsing available streams
- **Consistent fallback** to default gradient if no custom image is set

## Technical Implementation

### Database Schema

#### New Tables
- `stream_images` - Stores metadata for uploaded images
- `display_image_url` column added to `live_streams` table

#### Storage
- `stream-images` Supabase storage bucket for image files
- Automatic cleanup when streams are deleted
- Row-level security policies for access control

### Components

#### StreamImageUpload
- Drag & drop file upload
- Image validation and processing
- Real-time preview
- Error handling and user feedback

#### StreamManagement
- Comprehensive stream settings interface
- Display image management
- Stream analytics overview
- Basic information editing

### Services

#### streamImageService
- Image upload with validation
- Image processing (resize, compress)
- CRUD operations for stream images
- Automatic cleanup functionality

## Usage

### For Stream Creators

#### During Stream Creation
1. Open the "Go Live" dialog
2. Fill in stream title and description
3. Scroll to the "Display Image" section
4. Upload an image by:
   - Dragging and dropping a file
   - Clicking "Choose File"
5. Preview the image and create the stream

#### After Stream Creation
1. Find your stream on the discover page
2. Click "Manage Stream" (visible only to stream creators)
3. Navigate to the "Display Image" section
4. Upload a new image or select from previous uploads
5. Changes are applied immediately

### Image Requirements
- **File types**: JPG, PNG, WEBP
- **Maximum size**: 5MB (configurable)
- **Recommended aspect ratio**: 16:9 for best display
- **Automatic processing**: Images are resized and compressed as needed

## Installation & Setup

### 1. Database Migration
Run the migration to add the new database schema:
```sql
-- Run the migration file
supabase/migrations/20250202000000_add_stream_display_images.sql
```

### 2. Storage Bucket Setup
Execute the storage setup script:
```sql
-- Run the storage setup script
setup-stream-images-bucket.sql
```

### 3. Component Integration
The following components have been updated:
- `LivestreamDiscovery` - Shows custom display images
- `AzarLivestream` - Includes image upload in stream creation
- New `StreamImageUpload` component for image handling
- New `StreamManagement` component for post-creation management

## API Reference

### streamImageService Methods

#### uploadDisplayImage(streamId, file, options?)
Uploads a display image for a stream.
- `streamId`: UUID of the stream
- `file`: File object to upload
- `options`: Upload options (size limits, quality, etc.)
- Returns: `Promise<StreamImage>`

#### getStreamImages(streamId, imageType?)
Retrieves images for a stream.
- `streamId`: UUID of the stream
- `imageType`: Optional filter ('display', 'thumbnail', 'banner')
- Returns: `Promise<StreamImage[]>`

#### deleteStreamImage(imageId)
Deletes a stream image.
- `imageId`: UUID of the image to delete
- Returns: `Promise<void>`

#### setActiveDisplayImage(imageId)
Sets an image as the active display image.
- `imageId`: UUID of the image to activate
- Returns: `Promise<void>`

## Security Considerations

### Access Control
- Only stream creators can upload/manage images for their streams
- Public read access for all stream images
- Automatic cleanup prevents orphaned files

### File Validation
- File type restrictions (images only)
- Size limits to prevent abuse
- Image processing to ensure consistent format

### Storage Policies
- Row-level security on storage bucket
- Folder-based organization by stream ID
- Automatic cleanup on stream deletion

## Performance Considerations

### Image Processing
- Client-side image resizing and compression
- Optimized file sizes for web delivery
- Lazy loading on discover page

### Caching
- Browser caching for static images
- CDN-friendly public URLs
- Efficient database queries with proper indexing

## Future Enhancements

### Planned Features
- **Multiple image types**: Thumbnails, banners, logos
- **Image cropping tools**: Built-in editor for better composition
- **Template gallery**: Pre-made templates for creators
- **Analytics**: Track which images perform better
- **Bulk upload**: Multiple images at once
- **AI-generated images**: Automatic image creation based on stream content

### Potential Improvements
- **Image optimization**: WebP conversion, progressive loading
- **Mobile optimization**: Touch-friendly upload interface
- **Integration**: Connect with external image services
- **Moderation**: Automated content filtering for inappropriate images

## Troubleshooting

### Common Issues

#### Upload Fails
- Check file size (must be under 5MB)
- Verify file type (JPG, PNG, WEBP only)
- Ensure stable internet connection
- Check browser console for detailed errors

#### Image Not Displaying
- Verify image was uploaded successfully
- Check browser cache (hard refresh)
- Ensure image URL is accessible
- Verify database record exists

#### Permission Errors
- Confirm user is the stream creator
- Check authentication status
- Verify database policies are correctly applied

### Debug Mode
Enable debug logging in the browser console:
```javascript
localStorage.setItem('stream_debug', 'true');
```

## Support

For technical support or feature requests, please refer to the project documentation or contact the development team.
import { supabase } from '@/integrations/supabase/client';

export interface ThumbnailUploadOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

class ThumbnailService {
  private defaultOptions: ThumbnailUploadOptions = {
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxWidth: 1280,
    maxHeight: 720,
    quality: 0.8
  };

  /**
   * Upload a thumbnail for a stream to the new stream-thumbnails bucket
   */
  async uploadThumbnail(
    streamId: string,
    file: File,
    options: ThumbnailUploadOptions = {}
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    
    // Validate file
    await this.validateFile(file, opts);
    
    // Get current user
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user.user) {
      throw new Error('You must be logged in to upload thumbnails');
    }

    // Verify user owns the stream
    const { data: stream, error: streamError } = await supabase
      .from('live_streams')
      .select('creator_id')
      .eq('id', streamId)
      .single();

    if (streamError) {
      throw new Error('Stream not found');
    }

    if (stream.creator_id !== user.user.id) {
      throw new Error('You can only upload thumbnails to your own streams');
    }

    try {
      // Process image if needed
      const processedFile = await this.processImage(file, opts);
      
      // Generate filename - using streamId as folder name as per our bucket policy
      const fileExt = file.name.split('.').pop();
      const fileName = `${streamId}/thumbnail-${Date.now()}.${fileExt}`;
      
      // Upload to new stream-thumbnails bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('stream-thumbnails')
        .upload(fileName, processedFile, {
          cacheControl: '3600',
          upsert: true // Allow overwriting
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('stream-thumbnails')
        .getPublicUrl(fileName);

      if (!urlData.publicUrl) {
        throw new Error('Failed to get thumbnail URL');
      }

      // Update the live_streams table with the new thumbnail URL
      const { error: updateError } = await supabase
        .from('live_streams')
        .update({ 
          thumbnail_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', streamId);

      if (updateError) {
        // Clean up uploaded file if database update fails
        await supabase.storage
          .from('stream-thumbnails')
          .remove([fileName]);
        throw new Error(`Failed to update stream: ${updateError.message}`);
      }

      return urlData.publicUrl;
    } catch (error: any) {
      throw new Error(`Thumbnail upload failed: ${error.message}`);
    }
  }

  /**
   * Get thumbnail URL for a stream
   */
  async getThumbnailUrl(streamId: string): Promise<string | null> {
    const { data: stream, error } = await supabase
      .from('live_streams')
      .select('thumbnail_url')
      .eq('id', streamId)
      .single();

    if (error || !stream) {
      return null;
    }

    return stream.thumbnail_url;
  }

  /**
   * Delete thumbnail for a stream
   */
  async deleteThumbnail(streamId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('You must be logged in to delete thumbnails');
    }

    // Verify user owns the stream
    const { data: stream, error: streamError } = await supabase
      .from('live_streams')
      .select('creator_id, thumbnail_url')
      .eq('id', streamId)
      .single();

    if (streamError || !stream) {
      throw new Error('Stream not found');
    }

    if (stream.creator_id !== user.user.id) {
      throw new Error('You can only delete thumbnails from your own streams');
    }

    if (!stream.thumbnail_url) {
      return; // No thumbnail to delete
    }

    try {
      // Extract filename from URL
      const url = new URL(stream.thumbnail_url);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts.slice(-2).join('/'); // Get "streamId/filename.ext"

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('stream-thumbnails')
        .remove([fileName]);

      if (storageError) {
        console.warn('Failed to delete thumbnail from storage:', storageError);
      }

      // Clear thumbnail URL from database
      const { error: updateError } = await supabase
        .from('live_streams')
        .update({ 
          thumbnail_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', streamId);

      if (updateError) {
        throw new Error(`Failed to update stream: ${updateError.message}`);
      }
    } catch (error: any) {
      throw new Error(`Thumbnail deletion failed: ${error.message}`);
    }
  }

  /**
   * Validate uploaded file
   */
  private async validateFile(file: File, options: ThumbnailUploadOptions): Promise<void> {
    // Check file size
    if (options.maxSizeBytes && file.size > options.maxSizeBytes) {
      throw new Error(`File size must be less than ${Math.round(options.maxSizeBytes / 1024 / 1024)}MB`);
    }

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      throw new Error(`File type must be one of: ${options.allowedTypes.join(', ')}`);
    }

    // Check if it's actually an image
    try {
      const dimensions = await this.getImageDimensions(file);
      
      // Check dimensions
      if (options.maxWidth && dimensions.width > options.maxWidth) {
        throw new Error(`Image width must be less than ${options.maxWidth}px`);
      }
      
      if (options.maxHeight && dimensions.height > options.maxHeight) {
        throw new Error(`Image height must be less than ${options.maxHeight}px`);
      }
    } catch (error) {
      throw new Error('Invalid image file');
    }
  }

  /**
   * Process image (resize, compress, etc.)
   */
  private async processImage(file: File, options: ThumbnailUploadOptions): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      img.onload = () => {
        let { width, height } = img;

        // Calculate new dimensions if resizing is needed
        if (options.maxWidth && width > options.maxWidth) {
          height = (height * options.maxWidth) / width;
          width = options.maxWidth;
        }

        if (options.maxHeight && height > options.maxHeight) {
          width = (width * options.maxHeight) / height;
          height = options.maxHeight;
        }

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to process image'));
              return;
            }

            // Create new file
            const processedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });

            resolve(processedFile);
          },
          file.type,
          options.quality || 0.8
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get image dimensions
   */
  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

export const thumbnailService = new ThumbnailService();
import { supabase } from '@/integrations/supabase/client';

export interface ThumbnailUploadOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  debug?: boolean;
}

class ThumbnailService {
  private defaultOptions: ThumbnailUploadOptions = {
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxWidth: 1280,
    maxHeight: 720,
    quality: 0.8,
    debug: false
  };

  private debugLog(message: string, data?: any) {
    if (this.defaultOptions.debug || localStorage.getItem('thumbnail_debug') === 'true') {
      console.log(`[ThumbnailService] ${message}`, data);
    }
  }

  /**
   * Upload a thumbnail for a stream to the stream-thumbnails bucket
   */
  async uploadThumbnail(
    streamId: string,
    file: File,
    options: ThumbnailUploadOptions = {}
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    
    this.debugLog('Starting thumbnail upload', { streamId, fileName: file.name, fileSize: file.size });
    
    // Validate file
    await this.validateFile(file, opts);
    
    // Get current user
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError) {
      this.debugLog('Authentication error', authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    if (!user.user) {
      throw new Error('You must be logged in to upload thumbnails');
    }

    this.debugLog('User authenticated', { userId: user.user.id });

    // Verify user owns the stream
    const { data: stream, error: streamError } = await supabase
      .from('live_streams')
      .select('creator_id, title')
      .eq('id', streamId)
      .single();

    if (streamError) {
      this.debugLog('Stream lookup error', streamError);
      throw new Error(`Stream not found: ${streamError.message}`);
    }

    if (!stream) {
      throw new Error('Stream not found');
    }

    if (stream.creator_id !== user.user.id) {
      this.debugLog('Permission denied', { streamCreator: stream.creator_id, currentUser: user.user.id });
      throw new Error('You can only upload thumbnails to your own streams');
    }

    this.debugLog('Stream ownership verified', { streamTitle: stream.title });

    try {
      // Process image if needed
      const processedFile = await this.processImage(file, opts);
      this.debugLog('Image processed', { originalSize: file.size, processedSize: processedFile.size });
      
      // Generate filename - using streamId as folder name as per our bucket policy
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${streamId}/thumbnail-${Date.now()}.${fileExt}`;
      
      this.debugLog('Uploading to storage', { fileName, bucketId: 'stream-thumbnails' });
      
      // Upload to stream-thumbnails bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('stream-thumbnails')
        .upload(fileName, processedFile, {
          cacheControl: '3600',
          upsert: true // Allow overwriting
        });

      if (uploadError) {
        this.debugLog('Upload error', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      this.debugLog('File uploaded successfully', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('stream-thumbnails')
        .getPublicUrl(fileName);

      if (!urlData.publicUrl) {
        throw new Error('Failed to get thumbnail URL');
      }

      this.debugLog('Public URL generated', { publicUrl: urlData.publicUrl });

      // Update the live_streams table with the new thumbnail URL
      const { error: updateError } = await supabase
        .from('live_streams')
        .update({ 
          thumbnail_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', streamId);

      if (updateError) {
        this.debugLog('Database update error', updateError);
        // Clean up uploaded file if database update fails
        await supabase.storage
          .from('stream-thumbnails')
          .remove([fileName]);
        throw new Error(`Failed to update stream: ${updateError.message}`);
      }

      this.debugLog('Thumbnail upload completed successfully', { publicUrl: urlData.publicUrl });
      return urlData.publicUrl;
    } catch (error: any) {
      this.debugLog('Thumbnail upload failed', error);
      throw new Error(`Thumbnail upload failed: ${error.message}`);
    }
  }

  /**
   * Get thumbnail URL for a stream
   */
  async getThumbnailUrl(streamId: string): Promise<string | null> {
    this.debugLog('Getting thumbnail URL', { streamId });
    
    const { data: stream, error } = await supabase
      .from('live_streams')
      .select('thumbnail_url, display_image_url')
      .eq('id', streamId)
      .single();

    if (error) {
      this.debugLog('Error getting thumbnail URL', error);
      return null;
    }

    if (!stream) {
      this.debugLog('Stream not found');
      return null;
    }

    // Return display_image_url if available, otherwise thumbnail_url
    const thumbnailUrl = stream.display_image_url || stream.thumbnail_url;
    this.debugLog('Thumbnail URL retrieved', { thumbnailUrl, hasDisplayImage: !!stream.display_image_url, hasThumbnail: !!stream.thumbnail_url });
    
    return thumbnailUrl;
  }

  /**
   * Delete thumbnail for a stream
   */
  async deleteThumbnail(streamId: string): Promise<void> {
    this.debugLog('Deleting thumbnail', { streamId });
    
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
      this.debugLog('Stream lookup error for deletion', streamError);
      throw new Error('Stream not found');
    }

    if (stream.creator_id !== user.user.id) {
      throw new Error('You can only delete thumbnails from your own streams');
    }

    if (!stream.thumbnail_url) {
      this.debugLog('No thumbnail to delete');
      return; // No thumbnail to delete
    }

    try {
      // Extract filename from URL
      const url = new URL(stream.thumbnail_url);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts.slice(-2).join('/'); // Get "streamId/filename.ext"

      this.debugLog('Deleting from storage', { fileName });

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('stream-thumbnails')
        .remove([fileName]);

      if (storageError) {
        this.debugLog('Storage deletion warning', storageError);
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
        this.debugLog('Database update error during deletion', updateError);
        throw new Error(`Failed to update stream: ${updateError.message}`);
      }

      this.debugLog('Thumbnail deleted successfully');
    } catch (error: any) {
      this.debugLog('Thumbnail deletion failed', error);
      throw new Error(`Thumbnail deletion failed: ${error.message}`);
    }
  }

  /**
   * Validate uploaded file
   */
  private async validateFile(file: File, options: ThumbnailUploadOptions): Promise<void> {
    this.debugLog('Validating file', { fileName: file.name, fileSize: file.size, fileType: file.type });
    
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
      this.debugLog('Image dimensions', dimensions);
      
      // Check dimensions
      if (options.maxWidth && dimensions.width > options.maxWidth) {
        throw new Error(`Image width must be less than ${options.maxWidth}px`);
      }
      
      if (options.maxHeight && dimensions.height > options.maxHeight) {
        throw new Error(`Image height must be less than ${options.maxHeight}px`);
      }
    } catch (error) {
      this.debugLog('Image validation error', error);
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
        this.debugLog('Original image dimensions', { width, height });

        // Calculate new dimensions if resizing is needed
        if (options.maxWidth && width > options.maxWidth) {
          height = (height * options.maxWidth) / width;
          width = options.maxWidth;
        }

        if (options.maxHeight && height > options.maxHeight) {
          width = (width * options.maxHeight) / height;
          height = options.maxHeight;
        }

        this.debugLog('Processed image dimensions', { width, height });

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

            this.debugLog('Image processing completed', { originalSize: file.size, processedSize: processedFile.size });
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

  /**
   * Enable debug mode
   */
  enableDebug() {
    localStorage.setItem('thumbnail_debug', 'true');
    this.debugLog('Debug mode enabled');
  }

  /**
   * Disable debug mode
   */
  disableDebug() {
    localStorage.removeItem('thumbnail_debug');
    console.log('[ThumbnailService] Debug mode disabled');
  }

  /**
   * Check if thumbnail service is properly configured
   */
  async checkConfiguration(): Promise<{ isConfigured: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Check if user is authenticated
      const { data: user, error: authError } = await supabase.auth.getUser();
      if (authError || !user.user) {
        issues.push('User not authenticated');
      }

      // Check if bucket exists and is accessible
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        issues.push(`Cannot access storage buckets: ${bucketError.message}`);
      } else {
        const hasThumbnailBucket = buckets.some(b => b.name === 'stream-thumbnails');
        if (!hasThumbnailBucket) {
          issues.push('stream-thumbnails bucket does not exist');
        }
      }

      // Check if we can query live_streams table
      const { error: streamError } = await supabase
        .from('live_streams')
        .select('id')
        .limit(1);
      
      if (streamError) {
        issues.push(`Cannot access live_streams table: ${streamError.message}`);
      }

    } catch (error: any) {
      issues.push(`Configuration check failed: ${error.message}`);
    }

    return {
      isConfigured: issues.length === 0,
      issues
    };
  }
}

export const thumbnailService = new ThumbnailService();
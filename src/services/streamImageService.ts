import { supabase } from '@/integrations/supabase/client';

export interface StreamImage {
  id: string;
  stream_id: string;
  creator_id: string;
  image_url: string;
  image_type: 'display' | 'thumbnail' | 'banner';
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  is_active: boolean;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface ImageUploadOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

class StreamImageService {
  private defaultOptions: ImageUploadOptions = {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8
  };

  /**
   * Upload a display image for a stream
   */
  async uploadDisplayImage(
    streamId: string,
    file: File,
    options: ImageUploadOptions = {}
  ): Promise<StreamImage> {
    const opts = { ...this.defaultOptions, ...options };
    
    // Validate file
    await this.validateFile(file, opts);
    
    // Get current user
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user.user) {
      throw new Error('You must be logged in to upload images');
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
      throw new Error('You can only upload images to your own streams');
    }

    try {
      // Process image if needed
      const processedFile = await this.processImage(file, opts);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${streamId}/display/${Date.now()}.${fileExt}`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('stream-images')
        .upload(fileName, processedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('stream-images')
        .getPublicUrl(fileName);

      if (!urlData.publicUrl) {
        throw new Error('Failed to get image URL');
      }

      // Get image dimensions
      const dimensions = await this.getImageDimensions(processedFile);

      // Save image record to database
      const { data: imageRecord, error: dbError } = await supabase
        .from('stream_images')
        .insert({
          stream_id: streamId,
          creator_id: user.user.id,
          image_url: urlData.publicUrl,
          image_type: 'display',
          file_size: processedFile.size,
          mime_type: processedFile.type,
          width: dimensions.width,
          height: dimensions.height,
          is_active: true
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('stream-images')
          .remove([fileName]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      return imageRecord;
    } catch (error: any) {
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  /**
   * Get all images for a stream
   */
  async getStreamImages(
    streamId: string,
    imageType?: 'display' | 'thumbnail' | 'banner'
  ): Promise<StreamImage[]> {
    let query = supabase
      .from('stream_images')
      .select('*')
      .eq('stream_id', streamId)
      .order('created_at', { ascending: false });

    if (imageType) {
      query = query.eq('image_type', imageType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch stream images: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Delete a stream image
   */
  async deleteStreamImage(imageId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('You must be logged in to delete images');
    }

    // Get image record
    const { data: image, error: fetchError } = await supabase
      .from('stream_images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      throw new Error('Image not found');
    }

    if (image.creator_id !== user.user.id) {
      throw new Error('You can only delete your own images');
    }

    try {
      // Extract file path from URL
      const url = new URL(image.image_url);
      const filePath = url.pathname.split('/stream-images/')[1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('stream-images')
        .remove([filePath]);

      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('stream_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        throw new Error(`Failed to delete image record: ${dbError.message}`);
      }
    } catch (error: any) {
      throw new Error(`Image deletion failed: ${error.message}`);
    }
  }

  /**
   * Set an image as the active display image
   */
  async setActiveDisplayImage(imageId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('You must be logged in to update images');
    }

    // Get image record
    const { data: image, error: fetchError } = await supabase
      .from('stream_images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      throw new Error('Image not found');
    }

    if (image.creator_id !== user.user.id) {
      throw new Error('You can only update your own images');
    }

    // Set this image as active (trigger will handle the rest)
    const { error: updateError } = await supabase
      .from('stream_images')
      .update({ is_active: true })
      .eq('id', imageId);

    if (updateError) {
      throw new Error(`Failed to set active image: ${updateError.message}`);
    }
  }

  /**
   * Validate uploaded file
   */
  private async validateFile(file: File, options: ImageUploadOptions): Promise<void> {
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
  private async processImage(file: File, options: ImageUploadOptions): Promise<File> {
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

export const streamImageService = new StreamImageService();
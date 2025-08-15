import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Image, X, Upload, Loader2 } from 'lucide-react';

interface PostImageUploadProps {
  onImageUploaded: (imageUrl: string | null) => void;
  currentImageUrl?: string | null;
  disabled?: boolean;
}

export const PostImageUpload = ({ 
  onImageUploaded, 
  currentImageUrl, 
  disabled = false 
}: PostImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, WebP, GIF)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload images",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Create a unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${timestamp}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('community-post-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload image",
          variant: "destructive",
        });
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('community-post-images')
        .getPublicUrl(data.path);

      const imageUrl = urlData.publicUrl;
      setPreviewUrl(imageUrl);
      onImageUploaded(imageUrl);

      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully",
      });

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Upload error",
        description: "An unexpected error occurred while uploading",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    if (previewUrl && previewUrl.includes('community-post-images')) {
      try {
        // Extract file path from URL
        const urlParts = previewUrl.split('/');
        const fileName = urlParts.slice(-2).join('/'); // user_id/filename.ext
        
        // Delete from storage
        await supabase.storage
          .from('community-post-images')
          .remove([fileName]);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
    
    setPreviewUrl(null);
    onImageUploaded(null);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Image preview */}
      {previewUrl && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Post image preview"
            className="max-w-full max-h-64 rounded-lg border border-border object-cover"
          />
          {!disabled && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              onClick={removeImage}
              disabled={uploading}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Upload button */}
      {!previewUrl && (
        <Button
          variant="outline"
          size="sm"
          onClick={openFileDialog}
          disabled={disabled || uploading}
          className="flex items-center gap-2 h-10 px-4 bg-secondary/50 hover:bg-secondary border-border/50 hover:border-border text-foreground font-medium rounded-full transition-all duration-200 hover:shadow-sm"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Image className="h-4 w-4" />
              <span>Add Image</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
};
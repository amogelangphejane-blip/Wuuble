import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, X, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onAvatarChange: (avatarUrl: string | null) => void;
  bucketName: string;
  folder?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32'
};

export const AvatarUpload = ({
  currentAvatarUrl,
  onAvatarChange,
  bucketName,
  folder,
  size = 'md',
  className = ''
}: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, GIF, etc.)",
        variant: "destructive"
      });
      return false;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload an avatar",
        variant: "destructive"
      });
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${folder ? `${folder}/` : ''}${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) return;

    setUploading(true);
    try {
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Upload file
      const avatarUrl = await uploadAvatar(file);
      if (avatarUrl) {
        onAvatarChange(avatarUrl);
        toast({
          title: "Success!",
          description: "Avatar uploaded successfully"
        });
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar",
        variant: "destructive"
      });
      // Reset preview on error
      setPreviewUrl(currentAvatarUrl || null);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = () => {
    setPreviewUrl(null);
    onAvatarChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      <div className="relative group">
        <div className={`${sizeClasses[size]} rounded-full border-2 border-dashed border-luxury/30 bg-luxury/5 flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:border-luxury/50`}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera className="w-6 h-6 text-luxury/60" />
          )}
        </div>
        
        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <Upload className="w-4 h-4 text-white" />
        </div>

        {/* Remove button */}
        {previewUrl && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
            onClick={handleRemoveAvatar}
            disabled={uploading}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      <div className="flex flex-col items-center space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUploadClick}
          disabled={uploading}
          className="text-xs"
        >
          {uploading ? 'Uploading...' : previewUrl ? 'Change Avatar' : 'Upload Avatar'}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          PNG, JPG, GIF up to 5MB
        </p>
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};
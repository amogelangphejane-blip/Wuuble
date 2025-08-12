import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, User } from 'lucide-react';
import { validateAvatarUrl } from '@/lib/utils';

interface ProfilePictureUploadProps {
  currentAvatarUrl?: string | null;
  onAvatarUpdate: (newAvatarUrl: string | null) => void;
}

export const ProfilePictureUpload = ({ currentAvatarUrl, onAvatarUpdate }: ProfilePictureUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
        description: "Please select an image file (JPEG, PNG, WebP, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.onerror = () => {
      toast({
        title: "Preview failed",
        description: "Could not generate image preview. You can still upload the file.",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      // Generate unique filename with proper extension handling
      const fileExt = selectedFile.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload image. Please try again.');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      if (!publicUrl || publicUrl.trim() === '') {
        throw new Error('Failed to generate public URL for uploaded file');
      }

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Clean up old avatar if it exists and is different
      if (currentAvatarUrl && currentAvatarUrl !== publicUrl) {
        try {
          const urlParts = currentAvatarUrl.split('/storage/v1/object/public/profile-pictures/');
          if (urlParts.length > 1) {
            const storagePath = urlParts[1];
            await supabase.storage
              .from('profile-pictures')
              .remove([storagePath]);
          }
        } catch (deleteError) {
          console.warn('Could not delete old avatar:', deleteError);
        }
      }

      onAvatarUpdate(publicUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user || !currentAvatarUrl) return;

    setUploading(true);
    try {
      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Remove file from storage
      try {
        const urlParts = currentAvatarUrl.split('/storage/v1/object/public/profile-pictures/');
        if (urlParts.length > 1) {
          const storagePath = urlParts[1];
          await supabase.storage
            .from('profile-pictures')
            .remove([storagePath]);
        }
      } catch (deleteError) {
        console.warn('Could not delete avatar from storage:', deleteError);
      }

      onAvatarUpdate(null);
      toast({
        title: "Success",
        description: "Profile picture removed successfully",
      });
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: "Remove failed",
        description: "Failed to remove profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <Avatar className="w-20 h-20">
        <AvatarImage 
          src={previewUrl || validateAvatarUrl(currentAvatarUrl)} 
          alt="Profile picture"
        />
        <AvatarFallback className="text-2xl">
          <User />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-2">
          <Label htmlFor="avatar-upload" className="sr-only">
            Upload avatar
          </Label>
          <Input
            id="avatar-upload"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Image
          </Button>
          
          {currentAvatarUrl && !selectedFile && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
        
        {selectedFile && (
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={uploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          Square image recommended, max 5MB. Supports JPEG, PNG, WebP.
        </p>
      </div>
    </div>
  );
};
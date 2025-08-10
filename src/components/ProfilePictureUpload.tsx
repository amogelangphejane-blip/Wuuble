import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, User } from 'lucide-react';
import { validateAvatarUrl } from '@/lib/utils';
import { uploadProfilePicture } from '@/utils/uploadHelpers';

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
      console.error('Failed to read file for preview');
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
      console.log('Starting profile picture upload for user:', user.id);
      console.log('File details:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });

      // Use enhanced upload helper with better error handling
      const uploadResult = await uploadProfilePicture(selectedFile, user.id);

      if (!uploadResult.success) {
        console.error('Upload failed:', uploadResult.error, uploadResult.debugInfo);
        throw new Error(uploadResult.error);
      }

      const publicUrl = uploadResult.publicUrl!;
      console.log('Upload successful:', uploadResult.debugInfo);
      console.log('Generated public URL:', publicUrl);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      console.log('Profile updated successfully');

      // Remove old avatar if it exists and is different
      if (currentAvatarUrl && currentAvatarUrl !== publicUrl) {
        try {
          // Extract the storage path from the public URL
          // URL format: https://[project].supabase.co/storage/v1/object/public/profile-pictures/[path]
          const urlParts = currentAvatarUrl.split('/storage/v1/object/public/profile-pictures/');
          if (urlParts.length > 1) {
            const storagePath = urlParts[1];
            console.log('Attempting to delete old avatar:', storagePath);
            
            const { error: deleteError } = await supabase.storage
              .from('profile-pictures')
              .remove([storagePath]);
            
            if (deleteError) {
              console.warn('Failed to delete old avatar:', deleteError);
              // Don't throw here, as the main upload was successful
            }
          }
        } catch (deleteError) {
          console.warn('Error during old avatar cleanup:', deleteError);
          // Don't throw here, as the main upload was successful
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
        description: "Failed to upload profile picture. Please try again.",
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
        // Extract the storage path from the public URL
        const urlParts = currentAvatarUrl.split('/storage/v1/object/public/profile-pictures/');
        if (urlParts.length > 1) {
          const storagePath = urlParts[1];
          console.log('Attempting to delete avatar:', storagePath);
          
          const { error: deleteError } = await supabase.storage
            .from('profile-pictures')
            .remove([storagePath]);
          
          if (deleteError) {
            console.warn('Failed to delete avatar from storage:', deleteError);
          }
        }
      } catch (deleteError) {
        console.warn('Error during avatar deletion:', deleteError);
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
    <Card>
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
        <CardDescription>
          Upload a profile picture to personalize your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="w-20 h-20">
            <AvatarImage 
              src={previewUrl || validateAvatarUrl(currentAvatarUrl)} 
              alt="Profile picture"
              onError={(e) => {
                console.warn('Profile avatar failed to load:', previewUrl || currentAvatarUrl);
              }}
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
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground">
              Recommended: Square image, at least 200x200px. Max 5MB.
              <br />
              Supported formats: JPEG, PNG, WebP
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
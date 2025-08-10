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
import React from 'react'; // Added missing import for React

interface ProfilePictureUploadProps {
  currentAvatarUrl?: string | null;
  onAvatarUpdate: (newAvatarUrl: string | null) => void;
}

export const ProfilePictureUpload = ({ currentAvatarUrl, onAvatarUpdate }: ProfilePictureUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.size, file.type);

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
      const result = e.target?.result as string;
      console.log('Preview URL created successfully');
      setPreviewUrl(result);
    };
    reader.onerror = () => {
      console.error('Failed to read file for preview');
      toast({
        title: "Preview failed",
        description: "Could not create image preview",
        variant: "destructive",
      });
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
    if (!selectedFile || !user) {
      console.error('Cannot upload: missing file or user');
      return;
    }

    setUploading(true);
    setUploadProgress('Preparing upload...');
    
    try {
      console.log('Starting profile picture upload for user:', user.id);
      console.log('File details:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });

      // Generate unique filename with proper extension handling
      const fileExt = selectedFile.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
      console.log('Generated filename:', fileName);

      setUploadProgress('Uploading to storage...');

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);
      setUploadProgress('Generating public URL...');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      console.log('Generated public URL:', publicUrl);

      // Validate the public URL
      if (!publicUrl || publicUrl.trim() === '') {
        throw new Error('Failed to generate public URL for uploaded file');
      }

      // Additional validation of the generated URL
      const validatedUrl = validateAvatarUrl(publicUrl);
      if (!validatedUrl) {
        throw new Error('Generated URL failed validation');
      }

      setUploadProgress('Updating profile...');

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
        throw new Error(`Profile update failed: ${updateError.message}`);
      }

      console.log('Profile updated successfully');

      // Remove old avatar if it exists and is different
      if (currentAvatarUrl && currentAvatarUrl !== publicUrl) {
        setUploadProgress('Cleaning up old avatar...');
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
            } else {
              console.log('Old avatar deleted successfully');
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
      setUploadProgress('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Upload failed",
        description: `Failed to upload profile picture: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleRemove = async () => {
    if (!user || !currentAvatarUrl) return;

    setUploading(true);
    setUploadProgress('Removing avatar...');
    
    try {
      console.log('Removing avatar for user:', user.id);
      
      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw new Error(`Failed to update profile: ${updateError.message}`);
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
          } else {
            console.log('Avatar deleted from storage successfully');
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Remove failed",
        description: `Failed to remove profile picture: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setUploadProgress('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Debug current state
  React.useEffect(() => {
    console.log('ProfilePictureUpload state:', {
      currentAvatarUrl,
      validatedUrl: validateAvatarUrl(currentAvatarUrl),
      previewUrl,
      hasSelectedFile: !!selectedFile,
      uploading,
      userId: user?.id
    });
  }, [currentAvatarUrl, previewUrl, selectedFile, uploading, user?.id]);

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
              onLoad={() => {
                console.log('Profile avatar loaded successfully');
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
            
            {uploadProgress && (
              <p className="text-sm text-blue-600 font-medium">
                {uploadProgress}
              </p>
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
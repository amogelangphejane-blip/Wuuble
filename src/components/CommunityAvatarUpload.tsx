import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Users } from 'lucide-react';
import { validateAvatarUrl } from '@/lib/utils';
import { uploadCommunityAvatar } from '@/utils/uploadHelpers';

interface CommunityAvatarUploadProps {
  communityId?: string;
  currentAvatarUrl?: string | null;
  onAvatarUpdate: (newAvatarUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const CommunityAvatarUpload = ({ 
  communityId, 
  currentAvatarUrl, 
  onAvatarUpdate, 
  size = 'md',
  showLabel = true 
}: CommunityAvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  };

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
    if (!selectedFile || !user || !communityId) return;

    setUploading(true);
    try {
      console.log('Starting community avatar upload for community:', communityId, 'by user:', user.id);
      console.log('File details:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });

      // Use enhanced upload helper with better error handling
      const uploadResult = await uploadCommunityAvatar(selectedFile, communityId, user.id);

      if (!uploadResult.success) {
        console.error('Community upload failed:', uploadResult.error, uploadResult.debugInfo);
        throw new Error(uploadResult.error);
      }

      const publicUrl = uploadResult.publicUrl!;
      console.log('Community avatar upload successful:', uploadResult.debugInfo);
      console.log('Generated public URL:', publicUrl);

      // Update community with new avatar URL
      const { error: updateError } = await supabase
        .from('communities')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', communityId);

      if (updateError) {
        console.error('Community update error:', updateError);
        throw updateError;
      }

      console.log('Community updated successfully');

      // Remove old avatar if it exists and is different
      if (currentAvatarUrl && currentAvatarUrl !== publicUrl) {
        try {
          // Extract the storage path from the public URL
          // URL format: https://[project].supabase.co/storage/v1/object/public/community-avatars/[path]
          const urlParts = currentAvatarUrl.split('/storage/v1/object/public/community-avatars/');
          if (urlParts.length > 1) {
            const storagePath = urlParts[1];
            console.log('Attempting to delete old community avatar:', storagePath);
            
            const { error: deleteError } = await supabase.storage
              .from('community-avatars')
              .remove([storagePath]);
            
            if (deleteError) {
              console.warn('Failed to delete old community avatar:', deleteError);
              // Don't throw here, as the main upload was successful
            }
          }
        } catch (deleteError) {
          console.warn('Error during old community avatar cleanup:', deleteError);
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
        description: "Community avatar updated successfully",
      });
    } catch (error) {
      console.error('Error uploading community avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload community avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user || !currentAvatarUrl || !communityId) return;

    setUploading(true);
    try {
      // Update community to remove avatar URL
      const { error: updateError } = await supabase
        .from('communities')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', communityId);

      if (updateError) {
        throw updateError;
      }

      // Remove file from storage
      try {
        // Extract the storage path from the public URL
        const urlParts = currentAvatarUrl.split('/storage/v1/object/public/community-avatars/');
        if (urlParts.length > 1) {
          const storagePath = urlParts[1];
          console.log('Attempting to delete community avatar:', storagePath);
          
          const { error: deleteError } = await supabase.storage
            .from('community-avatars')
            .remove([storagePath]);
          
          if (deleteError) {
            console.warn('Failed to delete community avatar from storage:', deleteError);
          }
        }
      } catch (deleteError) {
        console.warn('Error during community avatar deletion:', deleteError);
      }

      onAvatarUpdate(null);
      toast({
        title: "Success",
        description: "Community avatar removed successfully",
      });
    } catch (error) {
      console.error('Error removing community avatar:', error);
      toast({
        title: "Remove failed",
        description: "Failed to remove community avatar. Please try again.",
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
    <div className="space-y-4">
      {showLabel && (
        <div>
          <Label className="text-sm font-medium">Community Avatar</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Upload an image to represent your community
          </p>
        </div>
      )}
      
      <div className="flex items-center space-x-4">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage 
            src={previewUrl || validateAvatarUrl(currentAvatarUrl)} 
            alt="Community avatar"
            onError={(e) => {
              console.warn('Community avatar failed to load:', previewUrl || currentAvatarUrl);
            }}
          />
          <AvatarFallback className={size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm'}>
            <Users />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="community-avatar-upload" className="sr-only">
              Upload community avatar
            </Label>
            <Input
              id="community-avatar-upload"
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
            Recommended: Square image, at least 200x200px. Max 5MB.
          </p>
        </div>
      </div>
    </div>
  );
};
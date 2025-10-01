import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Users, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { validateAvatarUrl } from '@/lib/utils';
import { checkCommunityStorageReady, setupStorageBuckets } from '@/utils/setupStorage';

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
  const [storageReady, setStorageReady] = useState<boolean | null>(null);
  const [settingUpStorage, setSettingUpStorage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  };

  // Check if storage is properly configured and auto-setup if needed
  useEffect(() => {
    const checkStorageSetup = async () => {
      if (!user) return;
      
      const isReady = await checkCommunityStorageReady();
      setStorageReady(isReady);
      
      if (!isReady) {
        console.warn('Community avatars storage bucket is missing - attempting auto-setup');
        // Attempt to auto-create buckets
        await handleSetupStorage();
      }
    };

    checkStorageSetup();
  }, [user]);

  const handleSetupStorage = async () => {
    setSettingUpStorage(true);
    try {
      console.log('Setting up storage buckets...');
      const results = await setupStorageBuckets();
      
      const allSuccessful = results.every(r => r.success);
      if (allSuccessful) {
        setStorageReady(true);
        toast({
          title: "Storage Ready",
          description: "Storage buckets have been set up successfully!",
        });
      } else {
        const failedSteps = results.filter(r => !r.success);
        console.error('Storage setup failed:', failedSteps);
        toast({
          title: "Storage Setup Issue",
          description: "Some storage buckets could not be created. Please contact support.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error setting up storage:', error);
      toast({
        title: "Setup Failed",
        description: "Could not set up storage automatically. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSettingUpStorage(false);
    }
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
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      console.log('Starting community avatar upload for community:', communityId, 'by user:', user.id);
      console.log('File details:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });

      // Generate unique filename with proper extension handling
      const fileExt = selectedFile.name.split('.').pop() || 'jpg';
      const fileName = communityId 
        ? `communities/${communityId}/avatar-${Date.now()}.${fileExt}`
        : `temp/community-avatar-${user.id}-${Date.now()}.${fileExt}`;
      console.log('Generated filename:', fileName);

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('community-avatars')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Community avatar upload error details:', uploadError);
        throw uploadError;
      }

      console.log('Community avatar upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('community-avatars')
        .getPublicUrl(fileName);

      console.log('Generated public URL:', publicUrl);

      // Validate the public URL
      if (!publicUrl || publicUrl.trim() === '') {
        throw new Error('Failed to generate public URL for uploaded file');
      }

      // Update community with new avatar URL only if communityId exists
      if (communityId) {
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
      }

      onAvatarUpdate(publicUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: "Success",
        description: communityId ? "Community avatar updated successfully" : "Avatar uploaded successfully",
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
    if (!user || !currentAvatarUrl) return;

    setUploading(true);
    try {
      // Update community to remove avatar URL only if communityId exists
      if (communityId) {
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
      
      {/* Storage setup warning */}
      {storageReady === false && !settingUpStorage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800 font-medium">Storage Setup Required</p>
            <p className="text-xs text-yellow-700 mt-1">
              Storage buckets need to be configured before you can upload images.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSetupStorage}
              className="mt-2 bg-white"
            >
              Setup Storage Now
            </Button>
          </div>
        </div>
      )}
      
      {settingUpStorage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <p className="text-sm text-blue-800">Setting up storage buckets...</p>
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
              disabled={uploading || settingUpStorage}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || settingUpStorage || (communityId && storageReady === false)}
              className="hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Choose Image
            </Button>
            
            {currentAvatarUrl && !selectedFile && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={uploading || settingUpStorage}
                className="hover:bg-destructive/10 hover:text-destructive transition-colors"
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
                disabled={uploading || settingUpStorage || (communityId && storageReady === false)}
                className="bg-green-600 hover:bg-green-700"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={uploading || settingUpStorage}
              >
                Cancel
              </Button>
              {selectedFile && (
                <span className="text-xs text-muted-foreground">
                  {selectedFile.name}
                </span>
              )}
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
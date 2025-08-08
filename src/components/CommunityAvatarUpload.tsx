import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Users } from 'lucide-react';

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
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !communityId) return;

    setUploading(true);
    try {
      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `communities/${communityId}/avatar-${Date.now()}.${fileExt}`;

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('community-avatars')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('community-avatars')
        .getPublicUrl(fileName);

      // Update community with new avatar URL
      const { error: updateError } = await supabase
        .from('communities')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', communityId);

      if (updateError) {
        throw updateError;
      }

      // Remove old avatar if it exists and is different
      if (currentAvatarUrl && currentAvatarUrl !== publicUrl) {
        const oldPath = currentAvatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('community-avatars')
            .remove([`communities/${communityId}/${oldPath}`]);
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
      const oldPath = currentAvatarUrl.split('/').pop();
      if (oldPath) {
        await supabase.storage
          .from('community-avatars')
          .remove([`communities/${communityId}/${oldPath}`]);
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
            src={previewUrl || currentAvatarUrl || undefined} 
            alt="Community avatar" 
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
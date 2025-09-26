import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, ensureUserProfile, UserProfile } from '@/utils/profileUtils';
import { User as UserIcon, Camera } from 'lucide-react';

interface ProfileSetupProps {
  onComplete?: () => void;
  showIfComplete?: boolean; // Show even if profile is already complete
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ 
  onComplete, 
  showIfComplete = false 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userProfile = await ensureUserProfile(user);
      setProfile(userProfile);
      setDisplayName(userProfile.display_name || '');
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !displayName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a display name',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSaving(true);
      const result = await updateUserProfile(user, { 
        display_name: displayName.trim() 
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Your profile has been updated'
        });
        
        // Update local state
        setProfile(prev => prev ? { ...prev, display_name: displayName.trim() } : null);
        
        if (onComplete) {
          onComplete();
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update profile',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Don't show if user doesn't exist
  if (!user) return null;

  // Don't show if profile is complete and we don't want to show it
  if (!showIfComplete && profile?.display_name && !isLoading) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {profile?.display_name ? 'Update Profile' : 'Complete Your Profile'}
        </CardTitle>
        <p className="text-sm text-gray-600 text-center">
          {profile?.display_name 
            ? 'Update your display name and profile picture' 
            : 'Help others recognize you by setting up your profile'
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl">
                {displayName ? displayName.substring(0, 2).toUpperCase() : <UserIcon className="w-8 h-8" />}
              </AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              variant="outline"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
              disabled
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Display Name Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Display Name</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            maxLength={50}
          />
          <p className="text-xs text-gray-500">
            This is how your name will appear in discussions and comments
          </p>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave}
          disabled={isSaving || !displayName.trim()}
          className="w-full"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            profile?.display_name ? 'Update Profile' : 'Complete Profile'
          )}
        </Button>

        {profile?.display_name && onComplete && (
          <Button 
            variant="outline"
            onClick={onComplete}
            className="w-full"
          >
            Skip for Now
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
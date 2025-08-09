import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, User } from 'lucide-react';
import { ProfilePictureUpload } from '@/components/ProfilePictureUpload';
import { StorageTest } from '@/components/StorageTest';
import { AvatarDebugTest } from '@/components/AvatarDebugTest';
import { StoragePolicyTest } from '@/components/StoragePolicyTest';
import { ProfilePictureTest } from '@/components/ProfilePictureTest';

interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

const ProfileSettings = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
      } else {
        // Create profile if it doesn't exist
        const newProfile = {
          user_id: user.id,
          display_name: user.email?.split('@')[0] || '',
          bio: '',
          avatar_url: null
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        setProfile(createdProfile);
        setDisplayName(createdProfile.display_name || '');
        setBio(createdProfile.bio || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Update local state
      setProfile({
        ...profile,
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        updated_at: new Date().toISOString()
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string | null) => {
    if (profile) {
      setProfile({
        ...profile,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString()
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="space-y-3">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/communities')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Communities
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your profile information and preferences
          </p>
        </div>

        {/* Profile Picture Section */}
        <ProfilePictureUpload 
          currentAvatarUrl={profile?.avatar_url}
          onAvatarUpdate={handleAvatarUpdate}
        />

        {/* New Comprehensive Profile Picture Test */}
        <ProfilePictureTest />

        {/* Storage Test Section - Temporary for debugging */}
        <StorageTest />

        <Separator />

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Profile Information</span>
            </CardTitle>
            <CardDescription>
              Update your display name and bio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                maxLength={50}
              />
              <p className="text-sm text-muted-foreground">
                This is how other users will see your name in communities and posts.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                maxLength={200}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
              />
              <p className="text-sm text-muted-foreground">
                {bio.length}/200 characters
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details (read-only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            
            {profile && (
              <div className="space-y-2">
                <Label>Member Since</Label>
                <Input
                  value={new Date(profile.created_at).toLocaleDateString()}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Test Component */}
        <AvatarDebugTest />

        {/* Storage Policy Test Component */}
        <StoragePolicyTest />
      </div>
    </div>
  );
};

export default ProfileSettings;
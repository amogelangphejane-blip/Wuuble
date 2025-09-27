import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { getUserProfile, getUserDisplayName, getUserAvatar, getUserInitials } from '@/utils/profileUtils';
import { validateAvatarUrl } from '@/lib/utils';

export const AvatarTest: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userProfile = await getUserProfile(user.id, true); // Force refresh
      setProfile(userProfile);
      console.log('User Profile:', userProfile);
      console.log('User Auth Data:', user);
      console.log('Display Name:', getUserDisplayName(user, userProfile));
      console.log('Avatar URL:', getUserAvatar(user, userProfile));
      console.log('Validated Avatar URL:', validateAvatarUrl(getUserAvatar(user, userProfile)));
      console.log('Initials:', getUserInitials(getUserDisplayName(user, userProfile)));
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      testProfile();
    }
  }, [user]);

  if (!user) {
    return (
      <Card className="p-4">
        <CardContent>
          <p>Please log in to test avatar system</p>
        </CardContent>
      </Card>
    );
  }

  const displayName = getUserDisplayName(user, profile);
  const avatarUrl = getUserAvatar(user, profile);
  const validatedAvatarUrl = validateAvatarUrl(avatarUrl);
  const initials = getUserInitials(displayName);

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Avatar System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={validatedAvatarUrl} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{displayName}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <strong>Profile Data:</strong>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>Display Name:</strong> {displayName}
          </div>
          
          <div>
            <strong>Avatar URL:</strong> {avatarUrl || 'None'}
          </div>
          
          <div>
            <strong>Validated Avatar URL:</strong> {validatedAvatarUrl || 'None (fallback to initials)'}
          </div>
          
          <div>
            <strong>Initials:</strong> {initials}
          </div>
        </div>

        <Button onClick={testProfile} disabled={loading} className="w-full">
          {loading ? 'Refreshing...' : 'Refresh Profile Data'}
        </Button>
      </CardContent>
    </Card>
  );
};
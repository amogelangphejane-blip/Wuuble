import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  getUserProfile, 
  getUserDisplayName, 
  getUserAvatar, 
  clearProfileCache,
  ensureUserProfile 
} from '@/utils/profileUtils';
import { validateAvatarUrl } from '@/lib/utils';
import { RefreshCw, Database, User, Eye } from 'lucide-react';

export const ProfileDebugger: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rawProfile, setRawProfile] = useState<any>(null);
  const [authData, setAuthData] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const debugProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('=== PROFILE DEBUGGING START ===');
      
      // 1. Get raw auth user data
      console.log('1. Auth User Data:', user);
      setAuthData({
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata
      });

      // 2. Direct database query for profile
      console.log('2. Fetching profile directly from database...');
      const { data: directProfile, error: directError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Direct profile query result:', { directProfile, directError });
      setRawProfile(directProfile);

      // 3. Test our utility functions
      console.log('3. Testing utility functions...');
      const cachedProfile = await getUserProfile(user.id);
      const displayName = getUserDisplayName(user, directProfile);
      const avatarUrl = getUserAvatar(user, directProfile);
      const validatedAvatar = validateAvatarUrl(avatarUrl);

      console.log('Utility results:', {
        cachedProfile,
        displayName,
        avatarUrl,
        validatedAvatar
      });

      // 4. Check if profile exists, create if not
      let finalProfile = directProfile;
      if (!directProfile) {
        console.log('4. No profile found, creating one...');
        finalProfile = await ensureUserProfile(user.id, user.email, user.user_metadata?.display_name);
        console.log('Created profile:', finalProfile);
      }

      // 5. If display_name is null/empty, try to fix it
      if (!finalProfile?.display_name || finalProfile.display_name.trim() === '') {
        console.log('5. Display name is null/empty, attempting to fix...');
        const emailUsername = user.email?.split('@')[0] || 'User';
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            display_name: emailUsername,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Failed to update display name:', updateError);
        } else {
          console.log('Successfully updated display name to:', emailUsername);
          finalProfile = { ...finalProfile, display_name: emailUsername };
          clearProfileCache(user.id);
        }
      }

      setDebugInfo({
        step1_authUser: user,
        step2_directProfile: directProfile,
        step2_error: directError,
        step3_cachedProfile: cachedProfile,
        step3_displayName: getUserDisplayName(user, finalProfile),
        step3_avatarUrl: getUserAvatar(user, finalProfile),
        step3_validatedAvatar: validateAvatarUrl(getUserAvatar(user, finalProfile)),
        step4_finalProfile: finalProfile,
        step5_emailUsername: user.email?.split('@')[0]
      });

      console.log('=== PROFILE DEBUGGING END ===');
      
      toast({
        title: "Debug Complete",
        description: "Check the console and component for detailed information",
      });
      
    } catch (error) {
      console.error('Debug error:', error);
      toast({
        title: "Debug Error",
        description: error instanceof Error ? error.message : "Debug failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const forceCreateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const emailUsername = user.email?.split('@')[0] || 'User';
      
      // Force create/update profile
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: emailUsername,
          bio: null,
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      clearProfileCache(user.id);
      setRawProfile(data);
      
      toast({
        title: "Profile Created/Updated",
        description: `Display name set to: ${emailUsername}`,
      });
      
      // Refresh debug info
      await debugProfile();
      
    } catch (error) {
      console.error('Force create error:', error);
      toast({
        title: "Create Failed",
        description: error instanceof Error ? error.message : "Failed to create profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      debugProfile();
    }
  }, [user]);

  if (!user) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Please sign in to debug profile</p>
        </CardContent>
      </Card>
    );
  }

  const currentDisplayName = debugInfo.step3_displayName || 'Loading...';
  const currentAvatar = debugInfo.step3_validatedAvatar;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Current Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Current Display (What You Should See)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={currentAvatar} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg">
                {currentDisplayName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xl font-semibold">{currentDisplayName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-400">Avatar URL: {currentAvatar || 'None'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button onClick={debugProfile} disabled={loading} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              {loading ? 'Debugging...' : 'Run Debug'}
            </Button>
            
            <Button onClick={forceCreateProfile} disabled={loading} variant="outline" className="flex-1">
              <Database className="w-4 h-4 mr-2" />
              {loading ? 'Creating...' : 'Force Fix Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auth Data */}
      <Card>
        <CardHeader>
          <CardTitle>1. Auth User Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(authData, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Raw Profile Data */}
      <Card>
        <CardHeader>
          <CardTitle>2. Raw Profile Data from Database</CardTitle>
        </CardHeader>
        <CardContent>
          {rawProfile ? (
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(rawProfile, null, 2)}
            </pre>
          ) : (
            <p className="text-red-500">No profile found in database!</p>
          )}
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>3. Debug Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Email Username:</strong> {debugInfo.step5_emailUsername || 'N/A'}
            </div>
            <div>
              <strong>Computed Display Name:</strong> {debugInfo.step3_displayName || 'N/A'}
            </div>
            <div>
              <strong>Avatar URL:</strong> {debugInfo.step3_avatarUrl || 'None'}
            </div>
            <div>
              <strong>Validated Avatar:</strong> {debugInfo.step3_validatedAvatar || 'None (will show initials)'}
            </div>
          </div>
          
          <details className="mt-4">
            <summary className="cursor-pointer font-medium">Full Debug Data</summary>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60 mt-2">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};
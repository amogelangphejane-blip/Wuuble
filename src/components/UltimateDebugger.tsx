import React, { useState } from 'react';
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
  clearProfileCache 
} from '@/utils/profileUtils';
import { validateAvatarUrl } from '@/lib/utils';
import { AlertTriangle, Database, Code, Eye, RefreshCw } from 'lucide-react';

export const UltimateDebugger: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>({});

  const runCompleteDebug = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const results: any = {};

    try {
      console.log('🔍 ULTIMATE DEBUG SESSION STARTED');
      
      // Step 1: Check auth user data
      console.log('Step 1: Auth User Data');
      results.authUser = {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        emailUsername: user.email?.split('@')[0]
      };
      console.log('Auth User:', results.authUser);

      // Step 2: Direct database query for profile
      console.log('Step 2: Direct Profile Query');
      const { data: rawProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      results.rawProfile = { data: rawProfile, error: profileError };
      console.log('Raw Profile:', results.rawProfile);

      // Step 3: Test utility functions
      console.log('Step 3: Utility Function Tests');
      const cachedProfile = await getUserProfile(user.id);
      const displayName = getUserDisplayName(user, rawProfile);
      const avatarUrl = getUserAvatar(user, rawProfile);
      const validatedAvatar = validateAvatarUrl(avatarUrl);
      
      results.utilities = {
        cachedProfile,
        displayName,
        avatarUrl,
        validatedAvatar,
        displayNameLogic: {
          profileDisplayName: rawProfile?.display_name,
          authDisplayName: user.user_metadata?.display_name,
          emailUsername: user.email?.split('@')[0],
          finalResult: displayName
        }
      };
      console.log('Utilities:', results.utilities);

      // Step 4: Test database permissions
      console.log('Step 4: Database Permissions Test');
      try {
        const { data: testUpdate, error: updateError } = await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .select();
        
        results.permissions = { 
          canUpdate: !updateError, 
          error: updateError?.message,
          result: testUpdate
        };
      } catch (err) {
        results.permissions = { 
          canUpdate: false, 
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
      console.log('Permissions:', results.permissions);

      // Step 5: Try to force fix
      console.log('Step 5: Force Fix Attempt');
      if (rawProfile && (!rawProfile.display_name || rawProfile.display_name.trim() === '')) {
        const newDisplayName = user.email?.split('@')[0] || 'TestUser';
        const { data: fixedProfile, error: fixError } = await supabase
          .from('profiles')
          .update({ 
            display_name: newDisplayName,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select()
          .single();
        
        results.fixAttempt = {
          attempted: true,
          newDisplayName,
          success: !fixError,
          error: fixError?.message,
          result: fixedProfile
        };
        
        if (!fixError) {
          clearProfileCache(user.id);
        }
      } else {
        results.fixAttempt = {
          attempted: false,
          reason: 'Profile already has display_name',
          currentDisplayName: rawProfile?.display_name
        };
      }
      console.log('Fix Attempt:', results.fixAttempt);

      // Step 6: Test how discussion component would see this user
      console.log('Step 6: Discussion Component Test');
      const discussionProfile = await getUserProfile(user.id, true); // Force refresh
      const discussionDisplayName = getUserDisplayName(user, discussionProfile);
      const discussionAvatar = validateAvatarUrl(getUserAvatar(user, discussionProfile));
      
      results.discussionView = {
        profile: discussionProfile,
        displayName: discussionDisplayName,
        avatar: discussionAvatar,
        initials: discussionDisplayName.substring(0, 2).toUpperCase()
      };
      console.log('Discussion View:', results.discussionView);

      // Step 7: Check if there are multiple profiles somehow
      console.log('Step 7: Check for Multiple Profiles');
      const { data: allProfiles, error: allError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id);
      
      results.allProfiles = { data: allProfiles, error: allError };
      console.log('All Profiles for User:', results.allProfiles);

      setDebugData(results);
      
      toast({
        title: "Debug Complete",
        description: "Check the results below and console for details",
      });

    } catch (error) {
      console.error('Debug failed:', error);
      results.error = error instanceof Error ? error.message : 'Unknown error';
      setDebugData(results);
      
      toast({
        title: "Debug Failed",
        description: "Check console for details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const forceDatabaseFix = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const emailUsername = user.email?.split('@')[0] || 'FixedUser';
      
      // Delete any existing profile and recreate
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);
      
      // Create fresh profile
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          display_name: emailUsername,
          bio: null,
          avatar_url: null
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      clearProfileCache(user.id);
      
      toast({
        title: "Profile Recreated",
        description: `New profile created with display_name: ${emailUsername}`,
      });
      
      // Refresh debug data
      await runCompleteDebug();
      
    } catch (error) {
      toast({
        title: "Force Fix Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center">Please sign in to run debugging</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Ultimate Profile Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runCompleteDebug} 
              disabled={loading}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {loading ? 'Debugging...' : 'Run Complete Debug'}
            </Button>
            
            <Button 
              onClick={forceDatabaseFix} 
              disabled={loading}
              variant="destructive"
              className="flex-1"
            >
              <Database className="w-4 h-4 mr-2" />
              {loading ? 'Fixing...' : 'Force Database Fix'}
            </Button>
          </div>
          
          <p className="text-sm text-gray-600">
            <strong>Run Complete Debug</strong> to see exactly what's happening.
            <strong>Force Database Fix</strong> will delete and recreate your profile.
          </p>
        </CardContent>
      </Card>

      {/* Current Status */}
      {debugData.discussionView && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Current Status (What You See in Discussions)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded">
              <Avatar className="w-16 h-16">
                <AvatarImage src={debugData.discussionView.avatar} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg">
                  {debugData.discussionView.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold">{debugData.discussionView.displayName}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-xs text-gray-400">
                  {debugData.discussionView.displayName === 'User' ? '❌ Problem: Showing "User"' : '✅ Good: Showing proper name'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Results */}
      {Object.keys(debugData).length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Raw Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Database Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(debugData.rawProfile, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Display Name Logic */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Display Name Logic</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(debugData.utilities?.displayNameLogic, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Database Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(debugData.permissions, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Fix Attempt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Fix Attempt Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(debugData.fixAttempt, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
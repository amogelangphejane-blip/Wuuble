import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateAvatarUrl, getInitials } from '@/lib/utils';
import { User, Users, RefreshCw } from 'lucide-react';

export const AvatarDebugTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sampleCommunity, setSampleCommunity] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const addResult = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(formattedMessage);
    setResults(prev => [...prev, formattedMessage]);
  };

  const testAvatarSystem = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setResults([]);

    try {
      addResult(`Starting avatar system test for user: ${user.id}`);

      // Test 1: Check storage buckets
      addResult('Testing storage bucket access...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        addResult(`Bucket access failed: ${JSON.stringify(bucketsError)}`, 'error');
      } else {
        const profileBucket = buckets.find(b => b.id === 'profile-pictures');
        const communityBucket = buckets.find(b => b.id === 'community-avatars');
        
        addResult(`Profile pictures bucket: ${profileBucket ? '✅ Found' : '❌ Missing'}`, profileBucket ? 'success' : 'error');
        addResult(`Community avatars bucket: ${communityBucket ? '✅ Found' : '❌ Missing'}`, communityBucket ? 'success' : 'error');
      }

      // Test 2: Check user profile
      addResult('Testing user profile access...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        addResult(`Profile access failed: ${JSON.stringify(profileError)}`, 'error');
      } else if (profile) {
        setUserProfile(profile);
        addResult(`Profile found: ${profile.display_name || 'No display name'}`, 'success');
        addResult(`Current avatar URL: ${profile.avatar_url || 'None'}`);
        
        if (profile.avatar_url) {
          const validatedUrl = validateAvatarUrl(profile.avatar_url);
          addResult(`Avatar URL validation: ${validatedUrl ? '✅ Valid' : '❌ Invalid'}`, validatedUrl ? 'success' : 'error');
        }
      } else {
        addResult('No profile found - will be created automatically', 'info');
      }

      // Test 3: Check a sample community
      addResult('Testing community avatar access...');
      const { data: communities, error: communityError } = await supabase
        .from('communities')
        .select('id, name, avatar_url')
        .limit(1);
      
      if (communityError) {
        addResult(`Community access failed: ${JSON.stringify(communityError)}`, 'error');
      } else if (communities && communities.length > 0) {
        const community = communities[0];
        setSampleCommunity(community);
        addResult(`Sample community: ${community.name}`, 'success');
        addResult(`Community avatar URL: ${community.avatar_url || 'None'}`);
        
        if (community.avatar_url) {
          const validatedUrl = validateAvatarUrl(community.avatar_url);
          addResult(`Community avatar validation: ${validatedUrl ? '✅ Valid' : '❌ Invalid'}`, validatedUrl ? 'success' : 'error');
        }
      } else {
        addResult('No communities found', 'info');
      }

      // Test 4: Test URL validation function
      addResult('Testing URL validation function...');
      const testUrls = [
        'https://tgmflbglhmnrliredlbn.supabase.co/storage/v1/object/public/profile-pictures/test.jpg',
        'https://example.com/avatar.png',
        '',
        null,
        undefined,
        'invalid-url',
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'
      ];

      testUrls.forEach((url, index) => {
        const result = validateAvatarUrl(url);
        addResult(`URL ${index + 1} (${url}): ${result ? '✅ Valid' : '❌ Invalid'}`);
      });

      addResult('Avatar system test completed!', 'success');

    } catch (error) {
      addResult(`Test failed: ${JSON.stringify(error)}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Avatar System Debug Test
        </CardTitle>
        <CardDescription>
          Comprehensive test to identify avatar and profile picture issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div className="flex gap-2">
          <Button onClick={testAvatarSystem} disabled={testing}>
            {testing ? 'Testing...' : 'Run Avatar Test'}
          </Button>
          <Button variant="outline" onClick={clearResults} disabled={testing}>
            Clear Results
          </Button>
        </div>

        {/* Sample Avatars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* User Avatar */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              User Avatar Test
            </h4>
            <div className="flex items-center gap-3">
              <Avatar className="w-16 h-16">
                <AvatarImage 
                  src={validateAvatarUrl(userProfile?.avatar_url)} 
                  alt="User avatar test"
                  onError={() => addResult('User avatar image failed to load', 'error')}
                  onLoad={() => addResult('User avatar image loaded successfully', 'success')}
                />
                <AvatarFallback className="text-lg">
                  <User />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {userProfile?.display_name || 'No name'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userProfile?.avatar_url ? 'Has avatar' : 'No avatar'}
                </p>
              </div>
            </div>
          </div>

          {/* Community Avatar */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Community Avatar Test
            </h4>
            <div className="flex items-center gap-3">
              <Avatar className="w-16 h-16">
                <AvatarImage 
                  src={validateAvatarUrl(sampleCommunity?.avatar_url)} 
                  alt="Community avatar test"
                  onError={() => addResult('Community avatar image failed to load', 'error')}
                  onLoad={() => addResult('Community avatar image loaded successfully', 'success')}
                />
                <AvatarFallback className="text-lg">
                  <Users />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {sampleCommunity?.name || 'No community'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sampleCommunity?.avatar_url ? 'Has avatar' : 'No avatar'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Test Results</h4>
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`font-mono text-xs mb-1 ${
                    result.includes('ERROR') ? 'text-red-600' : 
                    result.includes('SUCCESS') ? 'text-green-600' : 
                    'text-gray-700'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
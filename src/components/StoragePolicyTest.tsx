import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const StoragePolicyTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<Array<{
    test: string;
    status: 'success' | 'error' | 'warning';
    message: string;
  }>>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const addResult = (test: string, status: 'success' | 'error' | 'warning', message: string) => {
    setResults(prev => [...prev, { test, status, message }]);
  };

  const testStoragePolicies = async () => {
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
      // Test 1: Profile Pictures Bucket Access
      try {
        const { data: profileFiles, error: profileListError } = await supabase.storage
          .from('profile-pictures')
          .list('', { limit: 1 });
        
        if (profileListError) {
          addResult('Profile Pictures List', 'error', `Cannot list files: ${profileListError.message}`);
        } else {
          addResult('Profile Pictures List', 'success', 'Can list files in profile-pictures bucket');
        }
      } catch (error) {
        addResult('Profile Pictures List', 'error', `Bucket access failed: ${error}`);
      }

      // Test 2: Community Avatars Bucket Access
      try {
        const { data: communityFiles, error: communityListError } = await supabase.storage
          .from('community-avatars')
          .list('', { limit: 1 });
        
        if (communityListError) {
          addResult('Community Avatars List', 'error', `Cannot list files: ${communityListError.message}`);
        } else {
          addResult('Community Avatars List', 'success', 'Can list files in community-avatars bucket');
        }
      } catch (error) {
        addResult('Community Avatars List', 'error', `Bucket access failed: ${error}`);
      }

      // Test 3: User Folder Access (Profile Pictures)
      try {
        const userFolder = `${user.id}/`;
        const { data: userFiles, error: userListError } = await supabase.storage
          .from('profile-pictures')
          .list(userFolder, { limit: 5 });
        
        if (userListError) {
          addResult('User Folder Access', 'warning', `Cannot list user folder: ${userListError.message}`);
        } else {
          addResult('User Folder Access', 'success', `Found ${userFiles.length} files in user folder`);
        }
      } catch (error) {
        addResult('User Folder Access', 'error', `User folder access failed: ${error}`);
      }

      // Test 4: Test Upload Permission (dry run - create a tiny test file)
      try {
        const testFileName = `${user.id}/test-upload-${Date.now()}.txt`;
        const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(testFileName, testFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          addResult('Upload Permission', 'error', `Cannot upload: ${uploadError.message}`);
        } else {
          addResult('Upload Permission', 'success', 'Upload permission works');
          
          // Clean up test file
          await supabase.storage
            .from('profile-pictures')
            .remove([testFileName]);
        }
      } catch (error) {
        addResult('Upload Permission', 'error', `Upload test failed: ${error}`);
      }

      // Test 5: Public URL Generation
      try {
        const testPath = `${user.id}/test-image.jpg`;
        const { data: { publicUrl } } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(testPath);

        if (publicUrl && publicUrl.includes('supabase.co')) {
          addResult('Public URL Generation', 'success', `Generated URL: ${publicUrl}`);
        } else {
          addResult('Public URL Generation', 'error', 'Invalid public URL generated');
        }
      } catch (error) {
        addResult('Public URL Generation', 'error', `URL generation failed: ${error}`);
      }

      // Test 6: Check if buckets are public
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          addResult('Bucket Configuration', 'error', `Cannot check buckets: ${bucketsError.message}`);
        } else {
          const profileBucket = buckets.find(b => b.id === 'profile-pictures');
          const communityBucket = buckets.find(b => b.id === 'community-avatars');
          
          if (profileBucket) {
            addResult('Profile Bucket Config', profileBucket.public ? 'success' : 'warning', 
              `Profile pictures bucket is ${profileBucket.public ? 'public' : 'private'}`);
          }
          
          if (communityBucket) {
            addResult('Community Bucket Config', communityBucket.public ? 'success' : 'warning', 
              `Community avatars bucket is ${communityBucket.public ? 'public' : 'private'}`);
          }
        }
      } catch (error) {
        addResult('Bucket Configuration', 'error', `Bucket config check failed: ${error}`);
      }

      // Test 7: Check RLS Policies
      try {
        // Test community access
        const { data: communities, error: communityError } = await supabase
          .from('communities')
          .select('id, name, is_private')
          .limit(5);
        
        if (communityError) {
          addResult('Community RLS Test', 'error', `Cannot access communities: ${communityError.message}`);
        } else {
          addResult('Community RLS Test', 'success', `Can access ${communities.length} communities`);
        }
      } catch (error) {
        addResult('Community RLS Test', 'error', `Community access test failed: ${error}`);
      }

      // Test 8: Check Helper Function
      try {
        const { data: functionTest, error: functionError } = await supabase
          .rpc('is_community_member', { 
            community_id: '00000000-0000-0000-0000-000000000000', 
            user_id: user.id 
          });
        
        if (functionError) {
          addResult('Helper Function Test', 'warning', `Helper function issue: ${functionError.message}`);
        } else {
          addResult('Helper Function Test', 'success', 'Helper function is working correctly');
        }
      } catch (error) {
        addResult('Helper Function Test', 'error', `Function test failed: ${error}`);
      }

    } catch (error) {
      addResult('General Error', 'error', `Test suite failed: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Storage Policy Test
        </CardTitle>
        <CardDescription>
          Test storage permissions and policies for profile pictures and community avatars
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testStoragePolicies} disabled={testing}>
          {testing ? 'Testing Policies...' : 'Test Storage Policies'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Policy Test Results</h4>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  {getStatusIcon(result.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{result.test}</p>
                    <p className="text-xs text-muted-foreground break-words">
                      {result.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
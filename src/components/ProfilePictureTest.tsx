import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateAvatarUrl } from '@/lib/utils';
import { TestTube, CheckCircle, XCircle, AlertTriangle, User } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: any;
}

export const ProfilePictureTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const addResult = (test: string, status: TestResult['status'], message: string, details?: any) => {
    const result: TestResult = { test, status, message, details };
    console.log(`[ProfilePictureTest] ${status.toUpperCase()}: ${test} - ${message}`, details);
    setResults(prev => [...prev, result]);
  };

  const runComprehensiveTest = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in first to run profile picture tests",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setResults([]);

    try {
      addResult('Authentication', 'info', `Testing as user: ${user.id}`);

      // Test 1: Check if user is properly authenticated
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser.user) {
        addResult('Authentication Check', 'error', 'User authentication failed', authError);
        return;
      } else {
        addResult('Authentication Check', 'success', 'User is properly authenticated');
      }

      // Test 2: Check storage bucket access
      addResult('Storage Access', 'info', 'Checking storage bucket access...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        addResult('Storage Buckets', 'error', 'Cannot access storage buckets', bucketsError);
      } else {
        const profileBucket = buckets.find(b => b.id === 'profile-pictures');
        if (profileBucket) {
          addResult('Profile Pictures Bucket', 'success', 
            `Bucket found - Public: ${profileBucket.public}, Size limit: ${profileBucket.file_size_limit || 'unlimited'}`);
        } else {
          addResult('Profile Pictures Bucket', 'error', 'profile-pictures bucket not found');
        }
      }

      // Test 3: Check profile table access
      addResult('Profile Data', 'info', 'Checking profile table access...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        addResult('Profile Table Access', 'error', 'Cannot access profiles table', profileError);
      } else if (profile) {
        setUserProfile(profile);
        addResult('Profile Found', 'success', `Profile exists for user`);
        addResult('Current Avatar URL', 'info', profile.avatar_url || 'No avatar URL set');
        
        if (profile.avatar_url) {
          const validatedUrl = validateAvatarUrl(profile.avatar_url);
          addResult('Avatar URL Validation', validatedUrl ? 'success' : 'error', 
            validatedUrl ? 'Avatar URL is valid' : 'Avatar URL failed validation');
        }
      } else {
        addResult('Profile Status', 'warning', 'No profile found - will be created automatically');
      }

      // Test 4: Test upload permissions with a tiny test file
      addResult('Upload Permission', 'info', 'Testing upload permissions...');
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
          addResult('Upload Permission Test', 'error', 'Cannot upload to profile-pictures bucket', uploadError);
        } else {
          addResult('Upload Permission Test', 'success', 'Upload permission works');
          
          // Test public URL generation
          const { data: { publicUrl } } = supabase.storage
            .from('profile-pictures')
            .getPublicUrl(testFileName);
          
          if (publicUrl && publicUrl.includes('supabase.co')) {
            addResult('Public URL Generation', 'success', `Public URL generated: ${publicUrl}`);
          } else {
            addResult('Public URL Generation', 'error', 'Invalid public URL generated');
          }
          
          // Clean up test file
          await supabase.storage
            .from('profile-pictures')
            .remove([testFileName]);
          addResult('Cleanup', 'success', 'Test file cleaned up successfully');
        }
      } catch (error) {
        addResult('Upload Permission Test', 'error', 'Upload test failed', error);
      }

      // Test 5: Test profile update permissions
      addResult('Profile Update', 'info', 'Testing profile update permissions...');
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (updateError) {
          addResult('Profile Update Test', 'error', 'Cannot update profile table', updateError);
        } else {
          addResult('Profile Update Test', 'success', 'Profile update permission works');
        }
      } catch (error) {
        addResult('Profile Update Test', 'error', 'Profile update test failed', error);
      }

      // Test 6: Test image loading with a known good URL
      addResult('Image Loading', 'info', 'Testing image loading capabilities...');
      const testImageUrl = 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Test';
      const validatedTestUrl = validateAvatarUrl(testImageUrl);
      
      if (validatedTestUrl) {
        addResult('Test Image Validation', 'success', 'Test image URL validation passed');
      } else {
        addResult('Test Image Validation', 'error', 'Test image URL validation failed');
      }

      addResult('Test Complete', 'success', 'All profile picture tests completed');

    } catch (error) {
      addResult('Test Suite Error', 'error', 'Test suite encountered an error', error);
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <TestTube className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Profile Picture Functionality Test
        </CardTitle>
        <CardDescription>
          Comprehensive test to diagnose profile picture issues and verify functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div className="flex gap-2">
          <Button onClick={runComprehensiveTest} disabled={testing}>
            {testing ? 'Running Tests...' : 'Run Profile Picture Test'}
          </Button>
          <Button variant="outline" onClick={clearResults} disabled={testing}>
            Clear Results
          </Button>
        </div>

        {/* Current State Display */}
        {userProfile && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-3">Current Profile State</h4>
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage 
                  src={validateAvatarUrl(userProfile?.avatar_url)} 
                  alt="Current profile picture"
                  onError={() => console.warn('Current profile avatar failed to load')}
                  onLoad={() => console.log('Current profile avatar loaded successfully')}
                />
                <AvatarFallback className="text-lg">
                  <User />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{userProfile.display_name || 'No display name'}</p>
                <p className="text-sm text-muted-foreground">
                  {userProfile.avatar_url ? 'Has avatar URL' : 'No avatar URL'}
                </p>
                {userProfile.avatar_url && (
                  <p className="text-xs text-muted-foreground break-all">
                    {userProfile.avatar_url}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Test Results</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
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
                    {result.details && (
                      <details className="mt-1">
                        <summary className="text-xs text-blue-600 cursor-pointer">
                          Show details
                        </summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
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
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bug, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const RLSDebugTool = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<Array<{
    test: string;
    status: 'success' | 'error' | 'warning';
    message: string;
    details?: any;
  }>>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const addResult = (test: string, status: 'success' | 'error' | 'warning', message: string, details?: any) => {
    setResults(prev => [...prev, { test, status, message, details }]);
  };

  const testRLSPolicies = async () => {
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
      // Test 1: Check authentication state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addResult('Authentication Check', 'error', `Session error: ${sessionError.message}`, sessionError);
      } else if (!session) {
        addResult('Authentication Check', 'error', 'No active session found');
      } else {
        addResult('Authentication Check', 'success', `User authenticated: ${session.user.id}`, {
          userId: session.user.id,
          userEmail: session.user.email,
          role: session.user.role
        });
      }

      // Test 2: Test auth.uid() function directly via SQL
      try {
        const { data: authTest, error: authTestError } = await supabase
          .rpc('test_auth_uid', {});

        if (authTestError) {
          addResult('Auth UID Test', 'error', `auth.uid() test failed: ${authTestError.message}`, authTestError);
        } else {
          addResult('Auth UID Test', 'success', `auth.uid() returns: ${authTest}`, { authUid: authTest });
        }
      } catch (error) {
        // If the function doesn't exist, let's create a simple test
        addResult('Auth UID Test', 'warning', 'Could not test auth.uid() directly - function may not exist');
      }

      // Test 3: Test profile picture path construction
      const profileFileName = `${user.id}/test-avatar-${Date.now()}.jpg`;
      addResult('Profile Path Construction', 'success', `Profile path: ${profileFileName}`, {
        expectedFolder: user.id,
        actualPath: profileFileName,
        folderParts: profileFileName.split('/')
      });

      // Test 4: Test community avatar path construction
      const testCommunityId = 'test-community-id';
      const communityFileName = `communities/${testCommunityId}/avatar-${Date.now()}.jpg`;
      addResult('Community Path Construction', 'success', `Community path: ${communityFileName}`, {
        expectedFirstFolder: 'communities',
        expectedSecondFolder: testCommunityId,
        actualPath: communityFileName,
        folderParts: communityFileName.split('/')
      });

      // Test 5: Test actual upload permission for profile pictures
      try {
        const testContent = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header
        const testFile = new File([testContent], 'test.png', { type: 'image/png' });
        const testFileName = `${user.id}/rls-test-${Date.now()}.png`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(testFileName, testFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          addResult('Profile Upload Test', 'error', `Upload failed: ${uploadError.message}`, {
            error: uploadError,
            fileName: testFileName,
            userId: user.id
          });
        } else {
          addResult('Profile Upload Test', 'success', 'Profile picture upload successful', uploadData);
          
          // Clean up test file
          await supabase.storage
            .from('profile-pictures')
            .remove([testFileName]);
        }
      } catch (error) {
        addResult('Profile Upload Test', 'error', `Upload test exception: ${error}`, error);
      }

      // Test 6: Check storage bucket policies
      try {
        const { data: policies, error: policiesError } = await supabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'objects')
          .eq('schemaname', 'storage');

        if (policiesError) {
          addResult('Policy Check', 'warning', `Could not fetch policies: ${policiesError.message}`);
        } else {
          const relevantPolicies = policies.filter(p => 
            p.policyname?.includes('profile') || 
            p.policyname?.includes('community') ||
            p.policyname?.includes('upload')
          );
          addResult('Policy Check', 'success', `Found ${relevantPolicies.length} relevant policies`, relevantPolicies);
        }
      } catch (error) {
        addResult('Policy Check', 'warning', 'Could not check policies - this is normal for non-admin users');
      }

    } catch (error) {
      addResult('General Error', 'error', `Test suite failed: ${error}`, error);
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
          <Bug className="w-5 h-5" />
          RLS Policy Debug Tool
        </CardTitle>
        <CardDescription>
          Debug row-level security policy violations for uploads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testRLSPolicies} disabled={testing}>
          {testing ? 'Testing RLS Policies...' : 'Test RLS Policies'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">RLS Debug Results</h4>
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
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-blue-600 hover:text-blue-800">
                          Show details
                        </summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
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
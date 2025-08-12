import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle, XCircle, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DiagnosticResult {
  category: string;
  test: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: any;
  fix?: string;
}

export const ProfileAvatarDiagnostic = () => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    success: number;
    errors: number;
    warnings: number;
  }>({ total: 0, success: 0, errors: 0, warnings: 0 });
  
  const { user } = useAuth();
  const { toast } = useToast();

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const updateSummary = (results: DiagnosticResult[]) => {
    const summary = results.reduce((acc, result) => {
      acc.total++;
      if (result.status === 'success') acc.success++;
      else if (result.status === 'error') acc.errors++;
      else if (result.status === 'warning') acc.warnings++;
      return acc;
    }, { total: 0, success: 0, errors: 0, warnings: 0 });
    
    setSummary(summary);
  };

  useEffect(() => {
    updateSummary(results);
  }, [results]);

  const runComprehensiveDiagnostic = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to run diagnostics",
        variant: "destructive",
      });
      return;
    }

    setRunning(true);
    setResults([]);

    try {
      // 1. Check Authentication Status
      addResult({
        category: "Authentication",
        test: "User Session",
        status: "success",
        message: `Logged in as ${user.email}`,
        details: { userId: user.id, email: user.email }
      });

      // 2. Check Storage Buckets Existence
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          addResult({
            category: "Storage Setup",
            test: "List Buckets",
            status: "error",
            message: `Cannot access storage: ${bucketsError.message}`,
            fix: "Check Supabase project configuration and API keys"
          });
        } else {
          const profileBucket = buckets.find(b => b.id === 'profile-pictures');
          const communityBucket = buckets.find(b => b.id === 'community-avatars');
          
          if (profileBucket) {
            addResult({
              category: "Storage Setup",
              test: "Profile Pictures Bucket",
              status: "success",
              message: "Profile pictures bucket exists",
              details: profileBucket
            });
          } else {
            addResult({
              category: "Storage Setup",
              test: "Profile Pictures Bucket",
              status: "error",
              message: "Profile pictures bucket is missing",
              fix: "Create 'profile-pictures' bucket in Supabase dashboard or use Storage Setup component"
            });
          }
          
          if (communityBucket) {
            addResult({
              category: "Storage Setup",
              test: "Community Avatars Bucket",
              status: "success",
              message: "Community avatars bucket exists",
              details: communityBucket
            });
          } else {
            addResult({
              category: "Storage Setup",
              test: "Community Avatars Bucket",
              status: "error",
              message: "Community avatars bucket is missing",
              fix: "Create 'community-avatars' bucket in Supabase dashboard or use Storage Setup component"
            });
          }
        }
      } catch (error) {
        addResult({
          category: "Storage Setup",
          test: "Bucket Access",
          status: "error",
          message: `Storage access failed: ${error}`,
          fix: "Check network connection and Supabase configuration"
        });
      }

      // 3. Test Storage Permissions
      await testStoragePermissions();

      // 4. Check Profile Data
      await checkProfileData();

      // 5. Test Upload Functionality
      await testUploadCapabilities();

      // 6. Check RLS Policies
      await checkRLSPolicies();

    } catch (error) {
      addResult({
        category: "System",
        test: "Diagnostic Error",
        status: "error",
        message: `Diagnostic failed: ${error}`,
        fix: "Check console for detailed error information"
      });
    } finally {
      setRunning(false);
    }
  };

  const testStoragePermissions = async () => {
    // Test profile pictures permissions
    try {
      const { data: profileList, error: profileListError } = await supabase.storage
        .from('profile-pictures')
        .list('', { limit: 1 });
      
      if (profileListError) {
        addResult({
          category: "Permissions",
          test: "Profile Pictures Read",
          status: "error",
          message: `Cannot list profile pictures: ${profileListError.message}`,
          fix: "Apply storage RLS policies using fix-storage-policies.sql"
        });
      } else {
        addResult({
          category: "Permissions",
          test: "Profile Pictures Read",
          status: "success",
          message: "Can read profile pictures bucket"
        });
      }
    } catch (error) {
      addResult({
        category: "Permissions",
        test: "Profile Pictures Read",
        status: "error",
        message: `Profile pictures bucket not accessible: ${error}`,
        fix: "Ensure profile-pictures bucket exists"
      });
    }

    // Test community avatars permissions
    try {
      const { data: communityList, error: communityListError } = await supabase.storage
        .from('community-avatars')
        .list('', { limit: 1 });
      
      if (communityListError) {
        addResult({
          category: "Permissions",
          test: "Community Avatars Read",
          status: "error",
          message: `Cannot list community avatars: ${communityListError.message}`,
          fix: "Apply storage RLS policies using fix-storage-policies.sql"
        });
      } else {
        addResult({
          category: "Permissions",
          test: "Community Avatars Read",
          status: "success",
          message: "Can read community avatars bucket"
        });
      }
    } catch (error) {
      addResult({
        category: "Permissions",
        test: "Community Avatars Read",
        status: "error",
        message: `Community avatars bucket not accessible: ${error}`,
        fix: "Ensure community-avatars bucket exists"
      });
    }
  };

  const checkProfileData = async () => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (profileError) {
        addResult({
          category: "Profile Data",
          test: "Profile Record",
          status: "error",
          message: `Cannot fetch profile: ${profileError.message}`,
          fix: "Ensure profiles table exists and user has a profile record"
        });
      } else {
        addResult({
          category: "Profile Data",
          test: "Profile Record",
          status: "success",
          message: "Profile record exists",
          details: { 
            hasAvatar: !!profile.avatar_url,
            avatarUrl: profile.avatar_url,
            displayName: profile.display_name
          }
        });

        // Test avatar URL if it exists
        if (profile.avatar_url) {
          try {
            const response = await fetch(profile.avatar_url, { method: 'HEAD' });
            if (response.ok) {
              addResult({
                category: "Profile Data",
                test: "Avatar URL Accessibility",
                status: "success",
                message: "Current avatar URL is accessible"
              });
            } else {
              addResult({
                category: "Profile Data",
                test: "Avatar URL Accessibility",
                status: "warning",
                message: `Avatar URL returns ${response.status}: ${response.statusText}`,
                fix: "Re-upload profile picture or update avatar URL"
              });
            }
          } catch (error) {
            addResult({
              category: "Profile Data",
              test: "Avatar URL Accessibility",
              status: "error",
              message: `Cannot access avatar URL: ${error}`,
              fix: "Re-upload profile picture"
            });
          }
        }
      }
    } catch (error) {
      addResult({
        category: "Profile Data",
        test: "Profile Access",
        status: "error",
        message: `Profile data access failed: ${error}`,
        fix: "Check database connection and table permissions"
      });
    }
  };

  const testUploadCapabilities = async () => {
    // Test profile picture upload
    try {
      const testFileName = `${user?.id}/diagnostic-test-${Date.now()}.txt`;
      const testFile = new File(['diagnostic test'], 'test.txt', { type: 'text/plain' });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(testFileName, testFile);

      if (uploadError) {
        addResult({
          category: "Upload Test",
          test: "Profile Picture Upload",
          status: "error",
          message: `Upload failed: ${uploadError.message}`,
          fix: uploadError.message.includes('Policy') ? 
            "Apply RLS policies using fix-storage-policies.sql" :
            "Check storage bucket configuration"
        });
      } else {
        addResult({
          category: "Upload Test",
          test: "Profile Picture Upload",
          status: "success",
          message: "Upload permission works"
        });

        // Clean up test file
        await supabase.storage
          .from('profile-pictures')
          .remove([testFileName]);
      }
    } catch (error) {
      addResult({
        category: "Upload Test",
        test: "Profile Picture Upload",
        status: "error",
        message: `Upload test failed: ${error}`,
        fix: "Check storage configuration and permissions"
      });
    }

    // Test community avatar upload
    try {
      const testFileName = `temp/diagnostic-test-${Date.now()}.txt`;
      const testFile = new File(['diagnostic test'], 'test.txt', { type: 'text/plain' });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('community-avatars')
        .upload(testFileName, testFile);

      if (uploadError) {
        addResult({
          category: "Upload Test",
          test: "Community Avatar Upload",
          status: "error",
          message: `Upload failed: ${uploadError.message}`,
          fix: uploadError.message.includes('Policy') ? 
            "Apply RLS policies using fix-storage-policies.sql" :
            "Check storage bucket configuration"
        });
      } else {
        addResult({
          category: "Upload Test",
          test: "Community Avatar Upload",
          status: "success",
          message: "Upload permission works"
        });

        // Clean up test file
        await supabase.storage
          .from('community-avatars')
          .remove([testFileName]);
      }
    } catch (error) {
      addResult({
        category: "Upload Test",
        test: "Community Avatar Upload",
        status: "error",
        message: `Upload test failed: ${error}`,
        fix: "Check storage configuration and permissions"
      });
    }
  };

  const checkRLSPolicies = async () => {
    try {
      // This is a basic check - we try to query the policies table
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_storage_policies')
        .catch(() => ({ data: null, error: { message: 'RPC function not available' } }));

      if (policiesError) {
        addResult({
          category: "RLS Policies",
          test: "Policy Check",
          status: "warning",
          message: "Cannot verify RLS policies directly",
          fix: "Manually verify policies exist in Supabase dashboard"
        });
      } else {
        addResult({
          category: "RLS Policies",
          test: "Policy Check",
          status: "info",
          message: "RLS policy verification requires manual check",
          fix: "Check Supabase dashboard Authentication > Policies"
        });
      }
    } catch (error) {
      addResult({
        category: "RLS Policies",
        test: "Policy Check",
        status: "warning",
        message: "Policy verification not available",
        fix: "Manually verify policies in Supabase dashboard"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Shield className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Profile & Avatar System Diagnostic
        </CardTitle>
        <CardDescription>
          Comprehensive diagnostic tool to identify and resolve profile picture and community avatar issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            onClick={runComprehensiveDiagnostic}
            disabled={running || !user}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Running Diagnostic...' : 'Run Complete Diagnostic'}
          </Button>
          
          {results.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600">✓ {summary.success}</span>
              <span className="text-red-600">✗ {summary.errors}</span>
              <span className="text-yellow-600">⚠ {summary.warnings}</span>
              <span className="text-gray-600">Total: {summary.total}</span>
            </div>
          )}
        </div>

        {!user && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to run the diagnostic tests.
            </AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}>
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {result.category}
                      </span>
                      <span className="text-sm font-medium">
                        {result.test}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{result.message}</p>
                    {result.fix && (
                      <p className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                        <strong>Fix:</strong> {result.fix}
                      </p>
                    )}
                    {result.details && (
                      <details className="text-xs text-gray-500 mt-1">
                        <summary className="cursor-pointer">Details</summary>
                        <pre className="mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && summary.errors > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription>
              <strong>Issues Found:</strong> {summary.errors} error(s) detected. 
              Review the fixes above and apply the recommended solutions.
              Most issues can be resolved by applying the RLS policies in <code>fix-storage-policies.sql</code>.
            </AlertDescription>
          </Alert>
        )}

        {results.length > 0 && summary.errors === 0 && summary.warnings === 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>
              <strong>All tests passed!</strong> Your profile picture and community avatar system is working correctly.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
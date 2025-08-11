import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';

interface StorageStatus {
  bucketExists: boolean;
  canUpload: boolean;
  canRead: boolean;
  error?: string;
}

export const StorageTest = () => {
  const [testing, setTesting] = useState(false);
  const [profileStatus, setProfileStatus] = useState<StorageStatus | null>(null);
  const [communityStatus, setCommunityStatus] = useState<StorageStatus | null>(null);
  const { user } = useAuth();

  const testStorage = async () => {
    if (!user) return;

    setTesting(true);
    setProfileStatus(null);
    setCommunityStatus(null);

    try {
      // Test profile-pictures bucket
      const profileResult = await testBucket('profile-pictures');
      setProfileStatus(profileResult);

      // Test community-avatars bucket
      const communityResult = await testBucket('community-avatars');
      setCommunityStatus(communityResult);

    } catch (error) {
      console.error('Storage test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const testBucket = async (bucketName: string): Promise<StorageStatus> => {
    const result: StorageStatus = {
      bucketExists: false,
      canUpload: false,
      canRead: false
    };

    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        result.error = `Cannot list buckets: ${listError.message}`;
        return result;
      }

      result.bucketExists = buckets.some(b => b.id === bucketName);
      
      if (!result.bucketExists) {
        result.error = `Bucket '${bucketName}' does not exist`;
        return result;
      }

      // Test read access
      try {
        const { data: files, error: listFilesError } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 1 });
        
        result.canRead = !listFilesError;
        if (listFilesError) {
          result.error = `Cannot read from bucket: ${listFilesError.message}`;
        }
      } catch (readError) {
        result.canRead = false;
        result.error = `Read test failed: ${readError}`;
      }

      // Test upload access (create a tiny test file)
      try {
        const testFileName = `${user?.id}/test-${Date.now()}.txt`;
        const testFile = new File(['test'], testFileName, { type: 'text/plain' });
        
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(testFileName, testFile);

        result.canUpload = !uploadError;
        
        if (uploadError) {
          if (uploadError.message.includes('Policy')) {
            result.error = `Upload policy restriction: ${uploadError.message}`;
          } else {
            result.error = `Upload test failed: ${uploadError.message}`;
          }
        } else {
          // Clean up test file
          await supabase.storage.from(bucketName).remove([testFileName]);
        }
      } catch (uploadError) {
        result.canUpload = false;
        result.error = `Upload test failed: ${uploadError}`;
      }

    } catch (error) {
      result.error = `Test failed: ${error}`;
    }

    return result;
  };

  const getStatusBadge = (status: StorageStatus | null, label: string) => {
    if (!status) return <Badge variant="secondary">Not tested</Badge>;
    
    if (status.error) {
      return <Badge variant="destructive" className="gap-1">
        <XCircle className="w-3 h-3" />
        {label} Failed
      </Badge>;
    }
    
    if (status.bucketExists && status.canRead && status.canUpload) {
      return <Badge variant="default" className="bg-green-600 gap-1">
        <CheckCircle className="w-3 h-3" />
        {label} Ready
      </Badge>;
    }
    
    return <Badge variant="secondary" className="gap-1">
      <AlertTriangle className="w-3 h-3" />
      {label} Issues
    </Badge>;
  };

  const getDetailedStatus = (status: StorageStatus | null) => {
    if (!status) return null;

    return (
      <div className="text-xs space-y-1 mt-2">
        <div className="flex items-center gap-2">
          {status.bucketExists ? (
            <CheckCircle className="w-3 h-3 text-green-500" />
          ) : (
            <XCircle className="w-3 h-3 text-red-500" />
          )}
          <span>Bucket exists: {status.bucketExists ? 'Yes' : 'No'}</span>
        </div>
        <div className="flex items-center gap-2">
          {status.canRead ? (
            <CheckCircle className="w-3 h-3 text-green-500" />
          ) : (
            <XCircle className="w-3 h-3 text-red-500" />
          )}
          <span>Can read: {status.canRead ? 'Yes' : 'No'}</span>
        </div>
        <div className="flex items-center gap-2">
          {status.canUpload ? (
            <CheckCircle className="w-3 h-3 text-green-500" />
          ) : (
            <XCircle className="w-3 h-3 text-red-500" />
          )}
          <span>Can upload: {status.canUpload ? 'Yes' : 'No'}</span>
        </div>
        {status.error && (
          <div className="text-red-600 font-medium mt-1">
            Error: {status.error}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Diagnostics</CardTitle>
        <CardDescription>
          Test storage bucket configuration for profile uploads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testStorage} 
          disabled={testing || !user}
          className="w-full"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
          {testing ? 'Testing Storage...' : 'Test Storage Configuration'}
        </Button>

        {(profileStatus || communityStatus) && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Profile Pictures</span>
                  {getStatusBadge(profileStatus, 'Profile')}
                </div>
                {getDetailedStatus(profileStatus)}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Community Avatars</span>
                  {getStatusBadge(communityStatus, 'Community')}
                </div>
                {getDetailedStatus(communityStatus)}
              </div>
            </div>

            {(!profileStatus?.bucketExists || !communityStatus?.bucketExists) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-red-800">Storage buckets missing</p>
                    <p className="text-red-700 mt-1">
                      Please create the missing storage buckets via your Supabase Dashboard → Storage.
                      See the setup instructions above for detailed steps.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(profileStatus?.bucketExists && communityStatus?.bucketExists) && 
             (profileStatus?.canUpload && communityStatus?.canUpload) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-800">Storage is working!</p>
                    <p className="text-green-700 mt-1">
                      All storage buckets are configured correctly. Profile uploads should work.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
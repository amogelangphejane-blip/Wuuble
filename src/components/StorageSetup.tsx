import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { setupStorageBuckets, SetupResult } from '@/utils/setupStorage';
import { supabase } from '@/integrations/supabase/client';
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Loader2
} from 'lucide-react';

export const StorageSetup = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [setupResults, setSetupResults] = useState<SetupResult[]>([]);
  const [bucketStatus, setBucketStatus] = useState<{
    profilePictures: boolean;
    communityAvatars: boolean;
    postImages: boolean;
  } | null>(null);

  const checkBuckets = async () => {
    setLoading(true);
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to check storage buckets",
          variant: "destructive",
        });
        return;
      }

      setBucketStatus({
        profilePictures: buckets.some(b => b.id === 'profile-pictures'),
        communityAvatars: buckets.some(b => b.id === 'community-avatars'),
        postImages: buckets.some(b => b.id === 'community-post-images'),
      });
    } catch (error) {
      console.error('Error checking buckets:', error);
      toast({
        title: "Error",
        description: "Failed to check storage buckets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    setLoading(true);
    try {
      const results = await setupStorageBuckets();
      setSetupResults(results);
      
      const allSuccessful = results.every(r => r.success);
      if (allSuccessful) {
        toast({
          title: "Success",
          description: "Storage buckets have been set up successfully!",
        });
        // Re-check bucket status
        await checkBuckets();
      } else {
        toast({
          title: "Partial Success",
          description: "Some buckets were created, but there were issues. Check details below.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error setting up storage:', error);
      toast({
        title: "Setup Failed",
        description: "Could not set up storage. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Storage Bucket Setup
        </CardTitle>
        <CardDescription>
          Configure Supabase storage buckets for image uploads (profile pictures, community avatars, and post images)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkBuckets} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Check Status
          </Button>
          <Button onClick={handleSetup} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting Up...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Setup Buckets
              </>
            )}
          </Button>
        </div>

        {bucketStatus && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Bucket Status:</h4>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                {bucketStatus.profilePictures ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">
                  Profile Pictures: {bucketStatus.profilePictures ? 'Configured' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {bucketStatus.communityAvatars ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">
                  Community Avatars: {bucketStatus.communityAvatars ? 'Configured' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {bucketStatus.postImages ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">
                  Post Images: {bucketStatus.postImages ? 'Configured' : 'Missing'}
                </span>
              </div>
            </div>
          </div>
        )}

        {setupResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Setup Results:</h4>
            <div className="space-y-1">
              {setupResults.map((result, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  {result.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className="font-medium">{result.step}:</span> {result.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Storage buckets need to be configured before users can upload profile pictures, 
            community avatars, or post images. The setup process will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Create 'profile-pictures' bucket (5MB limit)</li>
              <li>Create 'community-avatars' bucket (5MB limit)</li>
              <li>Create 'community-post-images' bucket (10MB limit)</li>
              <li>Set appropriate permissions for public access</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Settings, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { setupStorageBuckets, type SetupResult } from '@/utils/setupStorage';

export const StorageSetup = () => {
  const [setting, setSetting] = useState(false);
  const [results, setResults] = useState<SetupResult[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const setupStorage = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive",
      });
      return;
    }

    setSetting(true);
    setResults([]);

    try {
      const setupResults = await setupStorageBuckets();
      setResults(setupResults);

      const allSuccessful = setupResults.every(r => r.success);
      
      if (allSuccessful) {
        toast({
          title: "Setup Complete",
          description: "Storage buckets have been configured. You can now upload profile pictures!",
        });
        
        // Trigger a page refresh to update storage status in other components
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({
          title: "Setup Issues",
          description: "Some setup steps failed. Check the results below for details.",
          variant: "destructive",
        });
      }

    } catch (error) {
      setResults([{ step: 'Setup Failed', success: false, message: `Setup failed: ${error}` }]);
      toast({
        title: "Setup Failed",
        description: "Failed to set up storage. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setSetting(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Storage Setup
        </CardTitle>
        <CardDescription>
          Set up storage buckets and policies required for profile picture uploads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
           <div className="flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
             <div>
               <h4 className="font-medium text-yellow-800">Storage Setup Required</h4>
               <p className="text-sm text-yellow-700 mt-1">
                 The storage buckets for profile pictures need to be created before uploads can work.
                 <br /><br />
                 <strong>Quick Fix:</strong> Go to your <a href="https://supabase.com/dashboard" target="_blank" className="underline">Supabase Dashboard</a> → Storage → Create the following buckets:
                 <br />• <code>profile-pictures</code> (public, 5MB limit)
                 <br />• <code>community-avatars</code> (public, 5MB limit)
                 <br /><br />
                 Or try the automated setup below (may require admin permissions).
               </p>
             </div>
           </div>
         </div>

        <Button onClick={setupStorage} disabled={setting} className="w-full">
          {setting ? 'Setting Up Storage...' : 'Set Up Storage Buckets'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Setup Progress</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                               <div 
                 key={index} 
                 className="flex items-start gap-3 p-3 rounded-lg border"
               >
                 {getStatusIcon(result.success)}
                 <div className="flex-1 min-w-0">
                   <p className="font-medium text-sm">{result.step}</p>
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
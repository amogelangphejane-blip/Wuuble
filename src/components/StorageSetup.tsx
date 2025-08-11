import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Settings, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { setupStorageBuckets, type SetupResult } from '@/scripts/setupStorageBuckets';

export const StorageSetup = () => {
  const [setting, setSetting] = useState(false);
  const [results, setResults] = useState<SetupResult[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSetupStorage = async () => {
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
      console.log('🔧 Starting storage setup...');
      const setupResults = await setupStorageBuckets();
      setResults(setupResults);

      const allSuccessful = setupResults.every(r => r.success);
      
      if (allSuccessful) {
        toast({
          title: "Success",
          description: "Storage buckets set up successfully! You can now upload avatars.",
        });
      } else {
        const errorCount = setupResults.filter(r => !r.success).length;
        toast({
          title: "Setup Issues",
          description: `${errorCount} issue(s) encountered during setup. Check the details below.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Storage setup failed:', error);
      toast({
        title: "Setup Failed",
        description: "Failed to set up storage buckets. Please try again or check your permissions.",
        variant: "destructive",
      });
      setResults([{
        step: 'Setup Error',
        success: false,
        message: `Unexpected error: ${error}`,
        details: error
      }]);
    } finally {
      setSetting(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getWarningIcon = () => <AlertTriangle className="w-4 h-4 text-yellow-500" />;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Storage Setup
        </CardTitle>
        <CardDescription>
          Set up storage buckets for profile pictures and community avatars
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleSetupStorage} 
            disabled={setting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {setting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Setting Up...
              </>
            ) : (
              'Set Up Storage Buckets'
            )}
          </Button>
          
          {results.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {results.filter(r => r.success).length}/{results.length} steps completed
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Setup Results</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  {getStatusIcon(result.success)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{result.step}</p>
                    <p className="text-xs text-muted-foreground break-words">
                      {result.message}
                    </p>
                    {result.details && (
                      <details className="mt-1">
                        <summary className="text-xs cursor-pointer text-blue-600">
                          View Details
                        </summary>
                        <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
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

        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>What this does:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Creates <code>profile-pictures</code> bucket for user avatars</li>
            <li>Creates <code>community-avatars</code> bucket for community images</li>
            <li>Sets up proper permissions and file size limits (5MB)</li>
            <li>Enables public access for image display</li>
            <li>Tests upload permissions to verify everything works</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
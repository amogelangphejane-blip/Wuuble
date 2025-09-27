import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { fixMyProfile, testProfile } from '@/utils/immediateProfileFix';
import { getUserDisplayName, getUserAvatar, getUserInitials } from '@/utils/profileUtils';
import { validateAvatarUrl } from '@/lib/utils';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export const QuickProfileFix: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleTest = async () => {
    setLoading(true);
    try {
      const result = await testProfile();
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: "Profile Test Complete",
          description: result.hasValidDisplayName 
            ? "Profile looks good!" 
            : "Profile needs fixing - click 'Fix Now'",
          variant: result.hasValidDisplayName ? "default" : "destructive"
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFix = async () => {
    setLoading(true);
    try {
      const result = await fixMyProfile();
      
      if (result.success) {
        toast({
          title: "Profile Fixed!",
          description: `Display name set to: ${result.displayName}`,
        });
        
        // Refresh test data
        await handleTest();
      } else {
        toast({
          title: "Fix Failed",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fix Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Display current status if we have test results
  const displayName = testResult?.profile?.display_name || testResult?.suggestedDisplayName || 'Loading...';
  const avatarUrl = validateAvatarUrl(testResult?.profile?.avatar_url);
  const hasValidName = testResult?.hasValidDisplayName;

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasValidName === true ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : hasValidName === false ? (
            <AlertCircle className="w-5 h-5 text-red-500" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
          Profile Fix Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {testResult && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <Avatar className="w-12 h-12">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                {getUserInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-sm text-gray-500">{testResult.user?.email}</p>
              <p className="text-xs text-gray-400">
                Status: {hasValidName ? '✅ Good' : '❌ Needs Fix'}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Button 
            onClick={handleTest} 
            disabled={loading} 
            variant="outline" 
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Profile'}
          </Button>
          
          <Button 
            onClick={handleFix} 
            disabled={loading || (testResult && hasValidName)} 
            className="w-full"
          >
            {loading ? 'Fixing...' : 'Fix Now'}
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>What this does:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Tests if your profile has a valid display name</li>
            <li>If not, creates/updates your profile to use your email username</li>
            <li>Clears the profile cache to ensure immediate effect</li>
            <li>Should fix the "User" showing in discussions</li>
          </ul>
        </div>

        {testResult && !testResult.success && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
            <strong>Error:</strong> {testResult.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
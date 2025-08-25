import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Database, 
  ExternalLink, 
  FileText, 
  HelpCircle,
  Settings,
  Upload
} from 'lucide-react';

interface StorageSetupHelperProps {
  error?: string;
  onDismiss?: () => void;
}

export const StorageSetupHelper: React.FC<StorageSetupHelperProps> = ({ 
  error, 
  onDismiss 
}) => {
  const isStorageError = error && (
    error.includes('bucket') || 
    error.includes('storage') || 
    error.includes('policy') ||
    error.includes('Invalid bucket')
  );

  if (!isStorageError) return null;

  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard', '_blank');
  };

  const openSetupGuide = () => {
    // This would open the setup guide - could be a modal or external link
    console.log('Opening setup guide...');
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Storage Configuration Required
        </CardTitle>
        <CardDescription className="text-orange-700">
          The marketplace file upload functionality needs additional setup.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert className="border-orange-200 bg-orange-100/50">
          <Database className="h-4 w-4" />
          <AlertTitle>Missing Storage Buckets</AlertTitle>
          <AlertDescription>
            Your Supabase project is missing the required storage buckets for marketplace uploads:
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li><code className="text-sm bg-white px-1 rounded">product-images</code> - For thumbnails and previews</li>
              <li><code className="text-sm bg-white px-1 rounded">digital-products</code> - For downloadable files</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            onClick={openSupabaseDashboard}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open Supabase Dashboard
          </Button>
          
          <Button
            onClick={openSetupGuide}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            View Setup Guide
          </Button>
        </div>

        <div className="bg-white rounded-lg p-4 border border-orange-200">
          <h4 className="font-semibold flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4" />
            Quick Setup Steps:
          </h4>
          <ol className="text-sm space-y-2 ml-4 list-decimal">
            <li>Get your Service Role Key from Supabase Dashboard → Settings → API</li>
            <li>Add <code className="bg-gray-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> to your .env file</li>
            <li>Run: <code className="bg-gray-100 px-1 rounded">node setup-marketplace-buckets.cjs</code></li>
            <li>Refresh this page and try uploading again</li>
          </ol>
        </div>

        {onDismiss && (
          <div className="flex justify-end">
            <Button onClick={onDismiss} variant="ghost" size="sm">
              Dismiss
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StorageSetupHelper;
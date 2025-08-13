import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { setupStorageBuckets } from '@/utils/setupStorage';
import { Loader2, Database } from 'lucide-react';

export const StorageSetupButton = () => {
  const [isSetupRunning, setIsSetupRunning] = useState(false);
  const { toast } = useToast();

  const runStorageSetup = async () => {
    setIsSetupRunning(true);
    
    try {
      const results = await setupStorageBuckets();
      
      const hasErrors = results.some(r => !r.success);
      
      if (hasErrors) {
        const errorMessages = results
          .filter(r => !r.success)
          .map(r => r.message)
          .join(', ');
        
        toast({
          title: "Storage Setup Issues",
          description: `Some issues occurred: ${errorMessages}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Storage Setup Complete",
          description: "All storage buckets are now ready for image uploads!",
        });
      }
      
      console.log('Storage setup results:', results);
      
    } catch (error) {
      console.error('Storage setup error:', error);
      toast({
        title: "Setup Failed",
        description: "Failed to set up storage buckets. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsSetupRunning(false);
    }
  };

  return (
    <Button
      onClick={runStorageSetup}
      disabled={isSetupRunning}
      className="flex items-center gap-2"
      variant="outline"
    >
      {isSetupRunning ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Setting up storage...
        </>
      ) : (
        <>
          <Database className="h-4 w-4" />
          Setup Storage Buckets
        </>
      )}
    </Button>
  );
};
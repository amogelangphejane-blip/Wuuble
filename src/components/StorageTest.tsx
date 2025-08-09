import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const StorageTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const addResult = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, message]);
  };

  const testStorage = async () => {
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
      addResult(`Testing storage for user: ${user.id}`);

      // Test bucket access
      addResult('Testing bucket access...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        addResult(`Buckets error: ${JSON.stringify(bucketsError)}`);
      } else {
        addResult(`Available buckets: ${buckets.map(b => b.id).join(', ')}`);
        
        const profileBucket = buckets.find(b => b.id === 'profile-pictures');
        const communityBucket = buckets.find(b => b.id === 'community-avatars');
        
        addResult(`Profile pictures bucket exists: ${!!profileBucket}`);
        addResult(`Community avatars bucket exists: ${!!communityBucket}`);
      }

      // Test profile-pictures bucket access
      addResult('Testing profile-pictures bucket...');
      const { data: profileFiles, error: profileError } = await supabase.storage
        .from('profile-pictures')
        .list('', { limit: 1 });
      
      if (profileError) {
        addResult(`Profile bucket error: ${JSON.stringify(profileError)}`);
      } else {
        addResult(`Profile bucket accessible: ${profileFiles.length >= 0 ? 'Yes' : 'No'}`);
      }

      // Test community-avatars bucket access
      addResult('Testing community-avatars bucket...');
      const { data: communityFiles, error: communityError } = await supabase.storage
        .from('community-avatars')
        .list('', { limit: 1 });
      
      if (communityError) {
        addResult(`Community bucket error: ${JSON.stringify(communityError)}`);
      } else {
        addResult(`Community bucket accessible: ${communityFiles.length >= 0 ? 'Yes' : 'No'}`);
      }

      // Test profile table access
      addResult('Testing profile table access...');
      const { data: profile, error: profileTableError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileTableError && profileTableError.code !== 'PGRST116') {
        addResult(`Profile table error: ${JSON.stringify(profileTableError)}`);
      } else {
        addResult(`Profile exists: ${!!profile}`);
        if (profile) {
          addResult(`Current avatar URL: ${profile.avatar_url || 'None'}`);
        }
      }

      addResult('Storage test completed!');

    } catch (error) {
      addResult(`Test failed: ${JSON.stringify(error)}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Storage Test</h3>
      <Button onClick={testStorage} disabled={testing}>
        {testing ? 'Testing...' : 'Test Storage Access'}
      </Button>
      
      {results.length > 0 && (
        <div className="bg-gray-100 p-3 rounded text-sm space-y-1 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <div key={index} className="font-mono text-xs">
              {result}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
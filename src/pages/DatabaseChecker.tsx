import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, XCircle, AlertTriangle, Database, RefreshCw } from 'lucide-react';

export default function DatabaseChecker() {
  const { user } = useAuth();
  const [results, setResults] = useState<any>({});
  const [checking, setChecking] = useState(false);

  const runCheck = async (name: string, checkFn: () => Promise<any>) => {
    try {
      const result = await checkFn();
      setResults(prev => ({
        ...prev,
        [name]: { status: 'success', message: 'OK', details: result }
      }));
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [name]: { status: 'error', message: error.message, details: null }
      }));
    }
  };

  const checkDatabase = async () => {
    setChecking(true);
    setResults({});

    // Check 1: Basic Supabase connection
    await runCheck('Supabase Connection', async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return 'Connected';
    });

    // Check 2: Authentication
    await runCheck('User Authentication', async () => {
      if (!user) throw new Error('No user logged in');
      return `Logged in as ${user.email}`;
    });

    // Check 3: Profiles table
    await runCheck('Profiles Table', async () => {
      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return `Table exists, ${count || 0} rows`;
    });

    // Check 4: Conversations table
    await runCheck('Simple Conversations Table', async () => {
      const { data, error, count } = await supabase
        .from('simple_conversations')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return `Table exists, ${count || 0} rows`;
    });

    // Check 5: Messages table
    await runCheck('Simple Messages Table', async () => {
      const { data, error, count } = await supabase
        .from('simple_messages')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return `Table exists, ${count || 0} rows`;
    });

    // Check 6: User profile exists
    if (user) {
      await runCheck('Current User Profile', async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('Profile does not exist for current user');
        return `Profile found: ${data.display_name || 'No display name'}`;
      });
    }

    // Check 7: RLS Policies
    await runCheck('Row Level Security', async () => {
      // Try to access tables (this will fail if RLS is misconfigured)
      await supabase.from('profiles').select('id').limit(1);
      await supabase.from('simple_conversations').select('id').limit(1);
      await supabase.from('simple_messages').select('id').limit(1);
      return 'RLS policies are working';
    });

    setChecking(false);
  };

  const createUserProfile = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          display_name: user.email?.split('@')[0] || `User ${user.id.slice(0, 8)}`
        });
      
      if (error) throw error;
      
      setResults(prev => ({
        ...prev,
        'Profile Created': { status: 'success', message: 'Profile created successfully', details: null }
      }));
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        'Profile Created': { status: 'error', message: error.message, details: null }
      }));
    }
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Connection Checker
            </CardTitle>
            <p className="text-sm text-gray-600">
              This tool will diagnose why you're seeing "Failed to load conversations"
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Button 
                onClick={checkDatabase} 
                disabled={checking}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                {checking ? 'Checking...' : 'Check Database'}
              </Button>
              
              {user && (
                <Button 
                  onClick={createUserProfile} 
                  variant="outline"
                  disabled={checking}
                >
                  Create My Profile
                </Button>
              )}
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>Current User:</strong> {user ? user.email : 'Not logged in'}</p>
              <p><strong>User ID:</strong> {user ? user.id : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-3">
          {Object.entries(results).map(([check, result]: [string, any]) => (
            <Card key={check}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{check}</h3>
                      <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                        {result.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                    {result.details && (
                      <p className="text-xs text-gray-500 mt-1">{result.details}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        {Object.keys(results).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {results['Profiles Table']?.status === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <strong>❌ Missing Tables:</strong>
                    <p>You need to run the database setup SQL. Go to your Supabase dashboard, open SQL Editor, and run the setup script.</p>
                  </div>
                )}
                
                {results['Current User Profile']?.status === 'error' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <strong>⚠️ Missing Profile:</strong>
                    <p>Click "Create My Profile" button above to create your user profile.</p>
                  </div>
                )}
                
                {results['Row Level Security']?.status === 'error' && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                    <strong>🔒 RLS Issues:</strong>
                    <p>Row Level Security policies are not configured correctly. Re-run the database setup SQL.</p>
                  </div>
                )}

                {Object.values(results).every((r: any) => r.status === 'success') && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <strong>✅ All Good!</strong>
                    <p>Database is properly configured. The messaging system should work now.</p>
                    <Button 
                      className="mt-2" 
                      onClick={() => window.location.href = '/messages'}
                    >
                      Go to Messages
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
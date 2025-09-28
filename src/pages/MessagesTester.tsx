import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, User, MessageSquare } from 'lucide-react';

export default function MessagesTester() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [testUserId, setTestUserId] = useState('');

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    try {
      const result = await testFn();
      setTestResults(prev => ({
        ...prev,
        [testName]: { status: 'success', result, error: null }
      }));
      return result;
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { status: 'error', result: null, error: error.message }
      }));
      throw error;
    }
  };

  const testDatabaseConnection = async () => {
    return await supabase.from('profiles').select('count', { count: 'exact', head: true });
  };

  const testTablesExist = async () => {
    const tables = [];
    
    // Test profiles table
    try {
      await supabase.from('profiles').select('id').limit(1);
      tables.push('profiles ✅');
    } catch (error) {
      tables.push('profiles ❌');
    }

    // Test conversations table
    try {
      await supabase.from('simple_conversations').select('id').limit(1);
      tables.push('simple_conversations ✅');
    } catch (error) {
      tables.push('simple_conversations ❌');
    }

    // Test messages table
    try {
      await supabase.from('simple_messages').select('id').limit(1);
      tables.push('simple_messages ✅');
    } catch (error) {
      tables.push('simple_messages ❌');
    }

    return tables;
  };

  const testCurrentUserProfile = async () => {
    if (!user) throw new Error('No user authenticated');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // Try to create profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ 
          user_id: user.id, 
          display_name: user.email?.split('@')[0] || `User ${user.id.slice(0, 8)}`
        });
      
      if (insertError) throw insertError;
      return { created: true, profile: { user_id: user.id, display_name: user.email?.split('@')[0] } };
    }

    return { created: false, profile: data };
  };

  const testCreateTestConversation = async () => {
    if (!user || !testUserId.trim()) throw new Error('Need user and test user ID');

    // Check if conversation exists
    const { data: existing } = await supabase
      .from('simple_conversations')
      .select('id')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${testUserId}),and(user1_id.eq.${testUserId},user2_id.eq.${user.id})`)
      .maybeSingle();

    if (existing) {
      return { exists: true, conversation: existing };
    }

    // Create conversation
    const { data, error } = await supabase
      .from('simple_conversations')
      .insert({
        user1_id: user.id,
        user2_id: testUserId
      })
      .select()
      .single();

    if (error) throw error;
    return { exists: false, conversation: data };
  };

  const testSendMessage = async () => {
    if (!user || !testUserId.trim()) throw new Error('Need user and test user ID');

    // First ensure conversation exists
    const convResult = await testCreateTestConversation();
    const conversationId = convResult.conversation.id;

    // Send test message
    const { data, error } = await supabase
      .from('simple_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: `Test message from ${user.email || 'test user'} at ${new Date().toISOString()}`
      })
      .select()
      .single();

    if (error) throw error;
    return { message: data, conversationId };
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestResults({});

    try {
      await runTest('Database Connection', testDatabaseConnection);
      await runTest('Tables Exist', testTablesExist);
      await runTest('Current User Profile', testCurrentUserProfile);
      
      if (testUserId.trim()) {
        await runTest('Create Test Conversation', testCreateTestConversation);
        await runTest('Send Test Message', testSendMessage);
      }

      toast({
        title: "Tests completed",
        description: "Check results below",
      });
    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messaging System Tester & Debugger
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={user ? "default" : "destructive"}>
                <User className="h-3 w-3 mr-1" />
                {user ? `Logged in as ${user.email}` : 'Not logged in'}
              </Badge>
              {user && (
                <Badge variant="outline">
                  ID: {user.id.slice(0, 8)}...
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Test User ID (optional):</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter another user's ID to test conversations..."
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                />
                <Button 
                  onClick={runAllTests} 
                  disabled={loading || !user}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Run Tests
                </Button>
              </div>
              <p className="text-xs text-gray-600">
                Leave empty to test basic functionality only. Add another user's ID to test conversations.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(testResults).map(([testName, result]: [string, any]) => (
            <Card key={testName}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  {testName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.status === 'success' ? (
                  <div className="text-sm text-green-700">
                    <strong>Success!</strong>
                    {result.result && (
                      <pre className="mt-2 bg-green-50 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    )}
                  </div>
                ) : result.status === 'error' ? (
                  <div className="text-sm text-red-700">
                    <strong>Error:</strong> {result.error}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Not tested yet</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Before testing:</h4>
              <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Open your Supabase dashboard</li>
                <li>Go to SQL Editor</li>
                <li>Run the SQL from the troubleshooting script</li>
                <li>Make sure you're logged in to the app</li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h4 className="font-medium text-blue-800 mb-2">🧪 Testing Steps:</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Create two user accounts in your app</li>
                <li>Copy one user's ID from Supabase Auth dashboard</li>
                <li>Login as the other user</li>
                <li>Paste the first user's ID in the field above</li>
                <li>Run tests to verify everything works</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => window.open('/messages', '_blank')}
                variant="outline"
              >
                Open Messages Page
              </Button>
              <Button 
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                variant="outline"
              >
                Open Supabase Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
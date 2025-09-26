import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ensureUserProfile } from '@/utils/profileUtils';

export const DebugProfile: React.FC = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    if (!user) {
      setDebugInfo({ error: 'No user logged in' });
      return;
    }

    setLoading(true);
    const info: any = {
      user_id: user.id,
      user_email: user.email,
      user_metadata: user.user_metadata,
    };

    try {
      // Check if profiles table exists and has our user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      info.profile_query_result = {
        data: profileData,
        error: profileError?.message || null,
        error_code: profileError?.code || null
      };

      // Test ensureUserProfile function
      try {
        const ensuredProfile = await ensureUserProfile(user);
        info.ensure_profile_result = {
          success: true,
          profile: ensuredProfile
        };
      } catch (ensureError: any) {
        info.ensure_profile_result = {
          success: false,
          error: ensureError.message
        };
      }

      // Check if community_posts table exists
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('id, user_id, title, content, created_at')
        .eq('user_id', user.id)
        .limit(5);

      info.posts_query_result = {
        data: postsData,
        error: postsError?.message || null,
        count: postsData?.length || 0
      };

      // Test the join query that's failing
      const { data: joinData, error: joinError } = await supabase
        .from('community_posts')
        .select(`
          id, title, content, user_id,
          profiles!community_posts_user_id_fkey (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .limit(5);

      info.join_query_result = {
        data: joinData,
        error: joinError?.message || null,
        error_code: joinError?.code || null
      };

    } catch (error: any) {
      info.global_error = error.message;
    }

    setDebugInfo(info);
    setLoading(false);
  };

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto m-4">
        <CardContent className="p-6">
          <p className="text-center text-gray-600">Please log in to debug profile issues</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto m-4">
      <CardHeader>
        <CardTitle>Profile Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDebug} disabled={loading}>
          {loading ? 'Running Debug...' : 'Run Debug Check'}
        </Button>
        
        {debugInfo && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">User Information</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify({
                  user_id: debugInfo.user_id,
                  user_email: debugInfo.user_email,
                  user_metadata: debugInfo.user_metadata
                }, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-lg">Profile Query Result</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(debugInfo.profile_query_result, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-lg">Ensure Profile Result</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(debugInfo.ensure_profile_result, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-lg">Posts Query Result</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(debugInfo.posts_query_result, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-lg">Join Query Result</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(debugInfo.join_query_result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
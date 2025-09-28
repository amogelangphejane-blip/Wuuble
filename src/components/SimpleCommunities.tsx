import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreateCommunityDialog } from '@/components/CreateCommunityDialog';
import { ModernHeader } from '@/components/ModernHeader';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Plus,
  Search,
  Globe,
  Lock,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  creator_id?: string;
  owner_id?: string;
  is_private: boolean;
  member_count: number;
  category?: string;
  tags?: string[];
  created_at: string;
}

export const SimpleCommunities: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateDialog(true);
      searchParams.delete('create');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      
      console.log('🔄 Fetching communities...');
      
      // Test basic connection first
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching communities:', error);
        setError(error.message);
        setDebugInfo({
          error: error,
          hint: error.hint,
          details: error.details,
          code: error.code
        });
        return;
      }

      console.log('✅ Communities fetched successfully:', data?.length || 0);
      setCommunities(data || []);
      
    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      setError(`Unexpected error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: user.id,
          role: 'member'
        });

      if (error) {
        console.error('Error joining community:', error);
        toast({
          title: "Error",
          description: "Failed to join community. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success!",
        description: "You've joined the community successfully!",
      });

      // Navigate to community
      navigate(`/community/${communityId}`);
    } catch (error) {
      console.error('Error joining community:', error);
      toast({
        title: "Error",
        description: "Failed to join community. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ModernHeader />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading communities...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ModernHeader />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Communities
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Discover and join communities that match your interests
            </p>
          </div>
          
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Community
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Failed to load communities:</strong> {error}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchCommunities}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                  {debugInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm underline">
                        Show Debug Info
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Search */}
        {!error && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Communities Grid */}
        {!error && (
          <>
            {filteredCommunities.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {searchQuery ? 'No communities found' : 'No communities yet'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchQuery 
                      ? 'Try adjusting your search query.'
                      : 'Be the first to create a community!'
                    }
                  </p>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Community
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCommunities.map((community) => (
                  <Card 
                    key={community.id} 
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/community/${community.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={community.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                            {community.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex items-center gap-2">
                          {community.is_private && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Lock className="w-3 h-3" />
                              Private
                            </Badge>
                          )}
                          {!community.is_private && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Globe className="w-3 h-3" />
                              Public
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <CardTitle className="text-lg">{community.name}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {community.description || 'No description available'}
                      </p>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{community.member_count || 0} members</span>
                        </div>
                        
                        {community.category && (
                          <Badge variant="secondary" className="text-xs">
                            {community.category}
                          </Badge>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinCommunity(community.id);
                        }}
                      >
                        Join Community
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Create Community Dialog */}
        <CreateCommunityDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog}
          onSuccess={(communityId) => {
            setShowCreateDialog(false);
            fetchCommunities(); // Refresh the list
            navigate(`/community/${communityId}`);
          }}
        />
      </div>
    </div>
  );
};
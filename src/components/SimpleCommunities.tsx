import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  cover_image_url?: string;
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-10">
            <div className="h-12 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-3" />
            <div className="h-6 w-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                <div className="p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md">
                  <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                  <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mt-6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ModernHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Discover Communities
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Find and join communities that match your interests
              </p>
            </div>
            
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <Plus className="w-5 h-5" />
              Create Community
            </Button>
          </div>
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
          <div className="mb-8">
            <div className="relative max-w-lg">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search communities by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-2 focus:border-blue-500 rounded-xl shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Communities Grid */}
        {!error && (
          <>
            {filteredCommunities.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {searchQuery ? 'No communities found' : 'No communities yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  {searchQuery 
                    ? 'Try adjusting your search query to find what you\'re looking for.'
                    : 'Be the first to create a community and start building your network!'
                  }
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 shadow-lg"
                    size="lg"
                  >
                    <Plus className="w-5 h-5" />
                    Create First Community
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCommunities.map((community) => (
                  <Card 
                    key={community.id} 
                    className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-500/30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl"
                    onClick={() => navigate(`/community/${community.id}`)}
                  >
                    {/* Profile Picture - Large Hero Image */}
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10">
                      {community.avatar_url ? (
                        <>
                          <img 
                            src={community.avatar_url} 
                            alt={community.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent group-hover:from-black/20 transition-colors" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                          <span className="text-6xl font-bold text-white/90">
                            {community.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      {/* Glass Badge - Top Right */}
                      <div className="absolute top-3 right-3">
                        {community.is_private ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-lg">
                            <Lock className="w-3.5 h-3.5 text-white drop-shadow" />
                            <span className="text-xs font-semibold text-white drop-shadow">Private</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-lg">
                            <Globe className="w-3.5 h-3.5 text-white drop-shadow" />
                            <span className="text-xs font-semibold text-white drop-shadow">Public</span>
                          </div>
                        )}
                      </div>

                      {/* Glass Stats Overlay - Bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 via-black/40 to-transparent backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-white">
                          <Users className="w-4 h-4 drop-shadow" />
                          <span className="font-semibold drop-shadow">
                            {community.member_count || 0}
                          </span>
                          <span className="text-sm text-white/90 drop-shadow">
                            {community.member_count === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content Area with Glass Effect */}
                    <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-md">
                      <CardHeader className="pb-3">
                        <div className="space-y-2">
                          <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                            {community.name}
                          </CardTitle>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed min-h-[2rem]">
                            {community.description || 'No description available'}
                          </p>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0 pb-4">
                        {/* Category & Tags */}
                        <div className="space-y-3">
                          {community.category && (
                            <div className="flex items-center gap-2">
                              <div className="px-2.5 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20 backdrop-blur-sm border border-blue-500/20">
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                  {community.category}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Tags if available */}
                          {community.tags && community.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {community.tags.slice(0, 3).map((tag, idx) => (
                                <div 
                                  key={idx} 
                                  className="px-2 py-0.5 rounded-full bg-gray-500/10 dark:bg-gray-500/20 backdrop-blur-sm border border-gray-500/20"
                                >
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {tag}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Join Button with Glass Effect */}
                        <Button 
                          className="w-full mt-4 font-semibold bg-blue-600/90 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all group-hover:scale-[1.02] backdrop-blur-sm border border-blue-500/20"
                          size="lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinCommunity(community.id);
                          }}
                        >
                          Join Community
                        </Button>
                      </CardContent>
                    </div>
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
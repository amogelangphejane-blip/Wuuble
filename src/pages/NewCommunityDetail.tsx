import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SimpleHeader } from '@/components/SimpleHeader';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  ArrowLeft,
  Globe,
  Lock,
  UserPlus,
  LogOut,
  Loader2
} from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  member_count: number;
  is_private: boolean;
  category?: string;
  created_at: string;
  owner_id?: string;
  creator_id: string;
  tags?: string[];
}

const NewCommunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchCommunity();
      checkMembership();
    }
  }, [id, user]);

  const fetchCommunity = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching community:', error);
        toast({
          title: "Error",
          description: "Community not found",
          variant: "destructive"
        });
        navigate('/communities');
        return;
      }

      setCommunity(data);
      setIsOwner((data as any).owner_id === user?.id || data.creator_id === user?.id);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', id)
        .eq('user_id', user.id)
        .single();

      setIsMember(!!data && !error);
    } catch (err) {
      console.error('Error checking membership:', err);
    }
  };

  const handleJoinCommunity = async () => {
    if (!user || !id) {
      navigate('/auth');
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: id,
          user_id: user.id,
          role: 'member'
        });

      if (error) {
        console.error('Error joining community:', error);
        toast({
          title: "Error",
          description: "Failed to join community",
          variant: "destructive"
        });
        return;
      }

      setIsMember(true);
      if (community) {
        setCommunity({
          ...community,
          member_count: (community.member_count || 0) + 1
        });
      }
      
      toast({
        title: "Success",
        description: "You've joined the community!",
      });
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!user || !id) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving community:', error);
        toast({
          title: "Error",
          description: "Failed to leave community",
          variant: "destructive"
        });
        return;
      }

      setIsMember(false);
      if (community) {
        setCommunity({
          ...community,
          member_count: Math.max(0, (community.member_count || 0) - 1)
        });
      }
      
      toast({
        title: "Left community",
        description: "You've left the community",
      });
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SimpleHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading community...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SimpleHeader />
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-md w-full">
            <CardContent className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Community Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This community doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/communities')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Communities
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SimpleHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/communities')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Communities
        </Button>

        {/* Community Header */}
        <Card className="mb-8 overflow-hidden border-2">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32"></div>
          <CardContent className="p-8 -mt-16">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="w-32 h-32 ring-8 ring-white dark:ring-gray-950 shadow-xl">
                <AvatarImage src={community.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-4xl font-bold">
                  {community.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 pt-16 sm:pt-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                      {community.name}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {community.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {community.is_private ? (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="w-3 h-3" />
                          Private
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Globe className="w-3 h-3" />
                          Public
                        </Badge>
                      )}
                      {community.category && (
                        <Badge variant="outline" className="capitalize">{community.category}</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{community.member_count || 0} members</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isMember ? (
                      <Button
                        variant="outline"
                        onClick={handleLeaveCommunity}
                        disabled={actionLoading}
                        className="gap-2"
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                        Leave
                      </Button>
                    ) : (
                      <Button
                        onClick={handleJoinCommunity}
                        disabled={actionLoading}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                        Join Community
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members Section */}
        <Card className="border-2">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Community Members
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Connect with {community.member_count || 0} member{(community.member_count || 0) !== 1 ? 's' : ''}
                </p>
              </div>
              {isMember && (
                <Button
                  onClick={() => navigate(`/community/${id}/members`)}
                  className="gap-2"
                >
                  <Users className="w-4 h-4" />
                  View All Members
                </Button>
              )}
            </div>

            {!isMember && (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  Join to see members
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Become a member to view and connect with the community
                </p>
                <Button
                  onClick={handleJoinCommunity}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Join Community
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewCommunityDetail;
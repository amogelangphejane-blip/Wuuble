import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModernHeader } from '@/components/ModernHeader';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import CommunityMemberService from '@/services/communityMemberService';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Calendar, 
  MessageCircle, 
  Video,
  BookOpen,
  Trophy,
  Link,
  Settings,
  ArrowLeft,
  Globe,
  Lock,
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
  owner_id: string;
  tags?: string[];
}

const CommunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (id) {
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
        return;
      }

      setCommunity(data);
      setIsOwner(data.owner_id === user?.id);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    if (!user || !id) return;

    try {
      const isMemberResult = await CommunityMemberService.isMember(id, user.id);
      setIsMember(isMemberResult);
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
      const result = await CommunityMemberService.joinCommunity(id, user);

      if (result.success) {
        setIsMember(true);
        
        // Refresh community data to get updated member count
        await fetchCommunity();
        
        toast({
          title: "Success",
          description: `You've joined ${community?.name || 'the community'}!`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || 'Failed to join community',
          variant: "destructive",
        });
      }
      
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error", 
        description: 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!user || !id) return;

    // Confirm before leaving
    const confirmed = window.confirm(
      `Are you sure you want to leave ${community?.name || 'this community'}?`
    );
    
    if (!confirmed) {
      return;
    }

    setActionLoading(true);

    try {
      const result = await CommunityMemberService.leaveCommunity(id, user.id);

      if (result.success) {
        setIsMember(false);
        
        // Refresh community data to get updated member count
        await fetchCommunity();
        
        toast({
          title: "Success",
          description: `You've left ${community?.name || 'the community'}`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || 'Failed to leave community',
          variant: "destructive",
        });
      }
      
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <ResponsiveLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ResponsiveLayout>
    );
  }

  if (!community) {
    return (
      <ResponsiveLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="text-center py-8">
              <h2 className="text-2xl font-bold mb-4">Community Not Found</h2>
              <p className="text-gray-600 mb-6">This community doesn't exist or has been removed.</p>
              <Button onClick={() => navigate('/communities')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Communities
              </Button>
            </CardContent>
          </Card>
        </div>
      </ResponsiveLayout>
    );
  }

  const features = [
    { icon: MessageCircle, label: 'Discussions', href: `/community/${id}/discussions` },
    { icon: Calendar, label: 'Events', href: `/community/${id}/calendar` },
    { icon: BookOpen, label: 'Classroom', href: `/community/${id}/classroom` },
    { icon: Trophy, label: 'Leaderboard', href: `/community/${id}/leaderboard` },
    { icon: Users, label: 'Members', href: `/community/${id}/members` },
    { icon: Video, label: 'Video Chat', href: `/community/${id}/video-chat` },
    { icon: Link, label: 'Links', href: `/community/${id}/links` }
  ];

  return (
    <ResponsiveLayout>
      <ModernHeader />
      
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
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
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={community.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl">
                    {community.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{community.name}</h1>
                      <p className="text-gray-600 mb-4">{community.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {community.is_private ? (
                          <Badge variant="secondary">
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </Badge>
                        )}
                        {community.category && (
                          <Badge variant="outline">{community.category}</Badge>
                        )}
                        {community.tags?.map((tag, index) => (
                          <Badge key={index} variant="outline">{tag}</Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{community.member_count || 0} members</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {isOwner && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/community/${id}/settings`)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Button>
                      )}
                      
                      {isMember ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleLeaveCommunity}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Leaving...
                            </>
                          ) : (
                            'Leave Community'
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={handleJoinCommunity}
                          disabled={actionLoading}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Joining...
                            </>
                          ) : (
                            'Join Community'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Features */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  if (isMember || !community.is_private) {
                    navigate(feature.href);
                  }
                }}
              >
                <CardContent className="p-6 text-center">
                  <feature.icon className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                  <p className="font-medium">{feature.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Community Content Tabs */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="posts">Posts</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                </TabsList>
                
                <TabsContent value="about" className="mt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">About this community</h3>
                      <p className="text-gray-600">
                        {community.description || 'No description available.'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Community Guidelines</h3>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Be respectful and kind to all members</li>
                        <li>No spam or self-promotion without permission</li>
                        <li>Stay on topic and contribute meaningfully</li>
                        <li>Follow all platform terms of service</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="posts" className="mt-6">
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No posts yet. Be the first to share something!</p>
                    {isMember && (
                      <Button className="mt-4">Create Post</Button>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="resources" className="mt-6">
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No resources available yet.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default CommunityDetail;
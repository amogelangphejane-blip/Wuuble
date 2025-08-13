import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ModernHeader } from '@/components/ModernHeader';
import TeamsChat from '@/components/TeamsChat';
import { 
  ArrowLeft, 
  Users, 
  MessageCircle,
  Shield,
  Clock
} from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string | null;
  is_private: boolean;
  member_count: number;
  creator_id: string;
  created_at: string;
}

const CommunityChat = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [community, setCommunity] = useState<Community | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchCommunityDetails();
    }
  }, [id, user]);

  const fetchCommunityDetails = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      
      // Check if user is a member and get community details
      const { data: membershipData } = await supabase
        .from('community_members')
        .select(`
          *,
          communities!inner(*)
        `)
        .eq('community_id', id)
        .eq('user_id', user.id)
        .single();

      if (membershipData?.communities) {
        setCommunity(membershipData.communities);
        setIsMember(true);
      } else {
        // Try to get community details directly (for public communities)
        const { data: communityData, error } = await supabase
          .from('communities')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !communityData) {
          toast({
            title: "Access Denied",
            description: "You must be a member to access community chat.",
            variant: "destructive"
          });
          navigate(`/communities/${id}`);
          return;
        }

        setCommunity(communityData);
        setIsMember(false);
      }

    } catch (error: any) {
      console.error('Error fetching community details:', error);
      toast({
        title: "Error",
        description: "Failed to load community details. Please try again.",
        variant: "destructive"
      });
      navigate('/communities');
    } finally {
      setLoading(false);
    }
  };

  const joinCommunity = async () => {
    if (!community || !user) return;

    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: community.id,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      setIsMember(true);
      toast({
        title: "Success",
        description: "You have joined the community!"
      });

    } catch (error: any) {
      console.error('Error joining community:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join community. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading community chat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Community Not Found</h2>
            <p className="text-gray-600 mb-4">The community you're looking for doesn't exist or you don't have access.</p>
            <Button onClick={() => navigate('/communities')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Communities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isMember && community.is_private) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Private Community</h2>
            <p className="text-gray-600 mb-4">
              This is a private community. You need to be invited by a member to join.
            </p>
            <Button onClick={() => navigate('/communities')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Communities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="mb-6">
                {community.avatar_url ? (
                  <img 
                    src={community.avatar_url} 
                    alt={community.name}
                    className="w-16 h-16 rounded-full mx-auto mb-4"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold">
                    {community.name.charAt(0)}
                  </div>
                )}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{community.name}</h1>
                {community.description && (
                  <p className="text-gray-600 mb-4">{community.description}</p>
                )}
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {community.member_count} members
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Created {new Date(community.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Join to Access Chat</h3>
                <p className="text-gray-600">
                  You need to join this community to access the chat channels and participate in discussions.
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <Button onClick={joinCommunity} size="lg">
                  <Users className="w-4 h-4 mr-2" />
                  Join Community
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/communities')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ModernHeader />
      
      {/* Community Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/communities/${id}`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            {community.avatar_url ? (
              <img 
                src={community.avatar_url} 
                alt={community.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {community.name.charAt(0)}
              </div>
            )}
            
            <div>
              <h1 className="font-semibold text-lg">{community.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="w-3 h-3" />
                {community.member_count} members
                {community.is_private && (
                  <Badge variant="outline" className="ml-2">
                    <Shield className="w-3 h-3 mr-1" />
                    Private
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/communities/${id}/video-chat`)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Video Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Teams Chat */}
      <div className="flex-1 container mx-auto p-0">
        <TeamsChat
          communityId={community.id}
          className="h-full"
        />
      </div>
    </div>
  );
};

export default CommunityChat;
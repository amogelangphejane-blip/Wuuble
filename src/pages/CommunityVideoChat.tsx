import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VideoChat } from '@/components/VideoChat';
import { ModernHeader } from '@/components/ModernHeader';
import { 
  ArrowLeft, 
  Users, 
  Video,
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

const CommunityVideoChat = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [community, setCommunity] = useState<Community | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showVideoChat, setShowVideoChat] = useState(false);

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
            description: "You must be a member to access community video chat.",
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

  const startVideoChat = () => {
    if (!isMember) {
      toast({
        title: "Join Required",
        description: "You must be a community member to start video chat.",
        variant: "destructive"
      });
      return;
    }
    setShowVideoChat(true);
  };

  const exitVideoChat = () => {
    setShowVideoChat(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-bg">
        <ModernHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-bg">
        <ModernHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Community not found</h1>
          <p className="text-muted-foreground mb-8">The community you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/communities')}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Communities
          </Button>
        </div>
      </div>
    );
  }

  // Show video chat interface with Azar-style design
  if (showVideoChat) {
    return (
      <div className="relative h-screen w-full">
        {/* Community Context Header - Positioned over the video chat */}
        <div className="absolute top-4 left-4 z-50">
          <Card className="bg-black/60 backdrop-blur-md border-white/20 text-white shadow-2xl">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-sm">{community.name}</div>
                  <div className="text-xs text-white/80">Community Video Chat</div>
                </div>
                <Badge variant="outline" className="text-xs bg-green-500/20 text-green-300 border-green-500/30">
                  Member
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exit Button - Positioned over the video chat */}
        <div className="absolute top-4 right-20 z-50">
          <Button
            onClick={exitVideoChat}
            variant="ghost"
            size="sm"
            className="bg-black/60 backdrop-blur-md border-white/20 text-white hover:bg-white/20 shadow-2xl"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Exit
          </Button>
        </div>

        {/* Azar-style Video Chat Component */}
        <VideoChat />
      </div>
    );
  }

  // Show pre-chat screen with enhanced Azar-inspired styling
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20">
      <ModernHeader />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/communities/${id}`)}
            className="mb-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to {community.name}
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Community Video Chat Header with Azar-style gradients */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/25">
              <Video className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
              {community.name} Video Chat
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
              Connect with fellow community members through immersive video chat. Meet new people, share experiences, and build meaningful connections in the Azar-style experience.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Community Info Card with dark theme */}
            <Card className="bg-black/40 backdrop-blur-md border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="w-5 h-5 text-purple-400" />
                  Community Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1 text-white">{community.name}</h3>
                  <p className="text-sm text-white/70">{community.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={community.is_private ? "secondary" : "default"} className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {community.is_private ? 'Private' : 'Public'} Community
                  </Badge>
                  {isMember && (
                    <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
                      Member
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-white/60">
                  Created {new Date(community.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            {/* Safety & Guidelines Card with dark theme */}
            <Card className="bg-black/40 backdrop-blur-md border-yellow-500/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-300">
                  <Shield className="w-5 h-5" />
                  Safety Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <span className="text-white/80">Be respectful and kind to all community members</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <span className="text-white/80">No inappropriate content or behavior</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <span className="text-white/80">Report any violations using the report button</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <span className="text-white/80">18+ only - community members only</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Section with Azar-style gradients */}
          <Card className="text-center bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-purple-500/10 border-purple-500/20 backdrop-blur-md">
            <CardContent className="py-16">
              {isMember ? (
                <>
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-500/25">
                    <Video className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4 text-white">Ready to connect?</h2>
                  <p className="text-white/70 mb-8 max-w-md mx-auto text-lg">
                    Start an immersive video chat session to meet and connect with other {community.name} community members.
                  </p>
                  <Button
                    onClick={startVideoChat}
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-16 py-6 rounded-full text-xl transition-all duration-300 transform hover:scale-105 border-0 shadow-2xl shadow-purple-500/25"
                  >
                    <Video className="w-6 h-6 mr-4" />
                    Start Video Chat
                  </Button>
                  <div className="mt-6 text-sm text-white/60 flex items-center justify-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Average connection time: ~30 seconds
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Shield className="w-10 h-10 text-white/60" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4 text-white">Members Only</h2>
                  <p className="text-white/70 mb-8 max-w-md mx-auto text-lg">
                    Video chat is available to community members only. Join {community.name} to start connecting with other members.
                  </p>
                  <Button
                    onClick={() => navigate(`/communities/${id}`)}
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 px-16 py-6 rounded-full text-xl"
                  >
                    <Users className="w-6 h-6 mr-4" />
                    Join Community
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommunityVideoChat;
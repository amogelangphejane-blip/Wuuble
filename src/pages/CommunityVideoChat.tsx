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

  // Show video chat interface
  if (showVideoChat) {
    return (
      <div className="min-h-screen bg-gradient-bg relative">
                 {/* Community Context Header */}
         <div className="absolute top-4 left-4 z-50">
           <Card className="bg-card/90 backdrop-blur-sm border-border/50">
             <CardContent className="p-3">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                   <Users className="w-4 h-4 text-white" />
                 </div>
                 <div>
                   <div className="font-medium text-sm">{community.name}</div>
                   <div className="text-xs text-muted-foreground">Community Video Chat</div>
                 </div>
                 <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                   Member
                 </Badge>
               </div>
             </CardContent>
           </Card>
         </div>

        {/* Exit Button */}
        <div className="absolute top-4 right-4 z-50">
          <Button
            onClick={exitVideoChat}
            variant="outline"
            size="sm"
            className="bg-card/90 backdrop-blur-sm border-border/50"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Community
          </Button>
        </div>

        {/* Video Chat Component */}
        <VideoChat />
      </div>
    );
  }

  // Show pre-chat screen
  return (
    <div className="min-h-screen bg-gradient-bg">
      <ModernHeader />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/communities/${id}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to {community.name}
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Community Video Chat Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
              <Video className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              {community.name} Video Chat
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with fellow community members through video chat. Meet new people, share experiences, and build meaningful connections.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Community Info Card */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Community Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">{community.name}</h3>
                  <p className="text-sm text-muted-foreground">{community.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={community.is_private ? "secondary" : "default"}>
                    {community.is_private ? 'Private' : 'Public'} Community
                  </Badge>
                  {isMember && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Member
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Created {new Date(community.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            {/* Safety & Guidelines Card */}
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <Shield className="w-5 h-5" />
                  Safety Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <span>Be respectful and kind to all community members</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <span>No inappropriate content or behavior</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <span>Report any violations using the report button</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <span>18+ only - community members only</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Section */}
          <Card className="text-center bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="py-12">
              {isMember ? (
                <>
                  <Video className="w-16 h-16 text-primary mx-auto mb-6" />
                  <h2 className="text-2xl font-bold mb-4">Ready to connect?</h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Start a video chat session to meet and connect with other {community.name} community members.
                  </p>
                  <Button
                    onClick={startVideoChat}
                    size="lg"
                    className="bg-gradient-primary hover:shadow-glow text-white font-semibold px-12 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 border-0"
                  >
                    <Video className="w-5 h-5 mr-3" />
                    Start Video Chat
                  </Button>
                  <div className="mt-4 text-xs text-muted-foreground">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Average connection time: ~30 seconds
                  </div>
                </>
              ) : (
                <>
                  <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                  <h2 className="text-2xl font-bold mb-4">Members Only</h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Video chat is available to community members only. Join {community.name} to start connecting with other members.
                  </p>
                  <Button
                    onClick={() => navigate(`/communities/${id}`)}
                    size="lg"
                    variant="outline"
                    className="px-12 py-4 rounded-full text-lg"
                  >
                    <Users className="w-5 h-5 mr-3" />
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
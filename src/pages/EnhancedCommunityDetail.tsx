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
import { CommunityDiscussion } from '@/components/CommunityDiscussion';
import { CommunityMemberCards } from '@/components/CommunityMemberCards';
import { CommunityEvents } from '@/components/CommunityEvents';
import { CommunityLeaderboard as LeaderboardComponent } from '@/components/CommunityLeaderboardComponent';
import { CommunityAboutSection } from '@/components/CommunityAboutSection';
import { CommunitySubscription } from '@/components/CommunitySubscription';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  Trophy,
  Settings,
  ArrowLeft,
  Globe,
  Lock,
  Crown,
  Activity,
  Info,
  DollarSign,
  CheckCircle2,
  Share2,
  Bell,
  BellOff,
  Star,
  TrendingUp,
  Clock,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  banner_url?: string;
  member_count: number;
  is_private: boolean;
  is_premium?: boolean;
  category?: string;
  created_at: string;
  creator_id: string;
  tags?: string[];
  subscription_price?: number;
  features?: string[];
  rules?: string;
  location?: string;
  website?: string;
  social_links?: {
    twitter?: string;
    discord?: string;
    github?: string;
  };
  stats?: {
    posts_count: number;
    events_count: number;
    active_members: number;
    growth_rate: number;
  };
}

const EnhancedCommunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [activeTab, setActiveTab] = useState('discussions');

  useEffect(() => {
    if (id) {
      fetchCommunity();
      checkMembership();
    }
  }, [id, user]);

  const fetchCommunity = async () => {
    try {
      setLoading(true);
      
      // Fetch real community data from Supabase
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching community:', error);
        toast({
          title: "Error",
          description: "Failed to load community details",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        setCommunity({
          ...data,
          features: data.features || ['discussions', 'events', 'leaderboard', 'resources'],
          rules: data.rules || `1. Be respectful and professional
2. No spam or self-promotion without permission
3. Share knowledge and help others
4. Keep discussions relevant
5. Report inappropriate content`,
          stats: {
            posts_count: 0, // These would come from actual post counts
            events_count: 0,
            active_members: data.member_count || 0,
            growth_rate: 0
          }
        });
        setIsOwner(user?.id === data.creator_id);
      }
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Failed to load community details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    if (!user || !id) return;

    // Mock membership check
    setIsMember(true);
    setIsSubscribed(false);
    setIsModerator(false);
  };

  const handleJoinCommunity = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (community?.is_premium && !isSubscribed) {
      setActiveTab('subscription');
      return;
    }

    try {
      setIsMember(true);
      if (community) {
        setCommunity({
          ...community,
          member_count: community.member_count + 1
        });
      }
      
      toast({
        title: "Welcome!",
        description: `You've joined ${community?.name}`,
      });
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Failed to join community",
        variant: "destructive"
      });
    }
  };

  const handleLeaveCommunity = async () => {
    try {
      setIsMember(false);
      if (community) {
        setCommunity({
          ...community,
          member_count: Math.max(0, community.member_count - 1)
        });
      }
      
      toast({
        title: "Left community",
        description: `You've left ${community?.name}`,
      });
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Failed to leave community",
        variant: "destructive"
      });
    }
  };

  const toggleNotifications = () => {
    setNotifications(!notifications);
    toast({
      title: notifications ? "Notifications disabled" : "Notifications enabled",
      description: notifications 
        ? "You won't receive updates from this community"
        : "You'll receive updates from this community",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading community...</p>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
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
    );
  }

  const tabItems = [
    { value: 'discussions', label: 'Discussions', icon: MessageSquare, count: community.stats?.posts_count },
    { value: 'members', label: 'Members', icon: Users, count: community.member_count },
    { value: 'events', label: 'Events', icon: Calendar, count: community.stats?.events_count },
    { value: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { value: 'about', label: 'About', icon: Info },
  ];

  if (community.is_premium) {
    tabItems.push({ value: 'subscription', label: 'Subscription', icon: DollarSign });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <ModernHeader />
      
      <div className="relative">
        {/* Banner */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-4 left-4">
            <Button
              variant="secondary"
              onClick={() => navigate('/communities')}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Communities
            </Button>
          </div>
        </div>

        {/* Community Info */}
        <div className="container mx-auto px-4 -mt-20 relative z-10">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-start gap-6">
                {/* Avatar */}
                <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-800 shadow-xl">
                  <AvatarImage src={community.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-3xl font-bold">
                    {community.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Details */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">{community.name}</h1>
                        {community.is_premium && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black">
                            <Crown className="w-4 h-4 mr-1" />
                            Premium
                          </Badge>
                        )}
                        {community.is_private && (
                          <Badge variant="secondary">
                            <Lock className="w-4 h-4 mr-1" />
                            Private
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
                        {community.description}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {community.tags?.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {isMember && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={toggleNotifications}
                        >
                          {notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        </Button>
                      )}
                      
                      <Button variant="outline" size="icon">
                        <Share2 className="w-4 h-4" />
                      </Button>
                      
                      {isOwner && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/community/${id}/settings`)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Button>
                      )}
                      
                      {isMember ? (
                        <Button
                          variant="outline"
                          onClick={handleLeaveCommunity}
                        >
                          Leave Community
                        </Button>
                      ) : (
                        <Button
                          onClick={handleJoinCommunity}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          {community.is_premium && !isSubscribed ? (
                            <>
                              <DollarSign className="w-4 h-4 mr-2" />
                              Subscribe ${community.subscription_price}/mo
                            </>
                          ) : (
                            <>
                              <Users className="w-4 h-4 mr-2" />
                              Join Community
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div>
                      <div className="flex items-center gap-2 text-2xl font-bold">
                        <Users className="w-5 h-5 text-blue-500" />
                        {community.member_count.toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-500">Members</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-2xl font-bold">
                        <Activity className="w-5 h-5 text-green-500" />
                        {community.stats?.active_members || 0}
                      </div>
                      <p className="text-sm text-gray-500">Active Now</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-2xl font-bold">
                        <MessageSquare className="w-5 h-5 text-purple-500" />
                        {community.stats?.posts_count || 0}
                      </div>
                      <p className="text-sm text-gray-500">Discussions</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-2xl font-bold">
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                        +{community.stats?.growth_rate || 0}%
                      </div>
                      <p className="text-sm text-gray-500">Growth</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <div className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto p-1 bg-white dark:bg-gray-800 shadow-sm">
              {tabItems.map((item) => {
                const Icon = item.icon;
                return (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">{item.label}</span>
                    {item.count !== undefined && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {item.count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="discussions" className="space-y-6">
              <CommunityDiscussion 
                communityId={community.id}
                isOwner={isOwner}
                isModerator={isModerator}
              />
            </TabsContent>

            <TabsContent value="members" className="space-y-6">
              <CommunityMemberCards
                communityId={community.id}
                isOwner={isOwner}
                isModerator={isModerator}
              />
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <CommunityEvents
                communityId={community.id}
                isOwner={isOwner}
                isModerator={isModerator}
              />
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-6">
              <LeaderboardComponent
                communityId={community.id}
              />
            </TabsContent>

            <TabsContent value="about" className="space-y-6">
              <CommunityAboutSection
                community={community}
                isOwner={isOwner}
              />
            </TabsContent>

            {community.is_premium && (
              <TabsContent value="subscription" className="space-y-6">
                <CommunitySubscription
                  community={community}
                  isSubscribed={isSubscribed}
                  onSubscribe={() => setIsSubscribed(true)}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCommunityDetail;
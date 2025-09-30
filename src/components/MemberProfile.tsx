import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Calendar,
  Crown,
  Shield,
  Mail,
  MapPin,
  Link as LinkIcon,
  Activity,
  MessageSquare,
  Heart,
  TrendingUp,
  Users,
  Award,
  Clock,
  Loader2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import ResponsiveLayout from '@/components/ResponsiveLayout';

interface MemberProfile {
  id: string;
  user_id: string;
  community_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
  profiles?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
  };
  email?: string;
}

interface ActivityStats {
  posts_count: number;
  comments_count: number;
  likes_given: number;
  likes_received: number;
  last_active: string;
}

const MemberProfile: React.FC = () => {
  const { id: communityId, memberId } = useParams<{ id: string; memberId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [member, setMember] = useState<MemberProfile | null>(null);
  const [stats, setStats] = useState<ActivityStats>({
    posts_count: 0,
    comments_count: 0,
    likes_given: 0,
    likes_received: 0,
    last_active: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && communityId && memberId) {
      fetchMemberProfile();
    }
  }, [user, communityId, memberId]);

  const fetchMemberProfile = async () => {
    if (!communityId || !memberId || !user) return;

    try {
      setLoading(true);

      // Fetch member profile
      const { data: memberData, error: memberError } = await supabase
        .from('community_members')
        .select('id, user_id, community_id, role, joined_at')
        .eq('id', memberId)
        .eq('community_id', communityId)
        .single();

      if (memberError) throw memberError;

      // Fetch user profile and email separately
      if (memberData) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, bio')
          .eq('user_id', memberData.user_id)
          .single();

        // Get email from auth.users metadata
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(memberData.user_id);

        setMember({
          ...memberData,
          role: memberData.role as 'owner' | 'admin' | 'moderator' | 'member',
          profiles: profileData || undefined,
          email: authUser?.email || 'No email'
        } as MemberProfile);
      }

      // Fetch activity stats (mock data for now - can be replaced with real queries)
      // In a real app, you'd query posts, comments, likes tables
      setStats({
        posts_count: Math.floor(Math.random() * 50),
        comments_count: Math.floor(Math.random() * 100),
        likes_given: Math.floor(Math.random() * 200),
        likes_received: Math.floor(Math.random() * 150),
        last_active: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching member profile:', error);
      toast({
        title: "Error",
        description: "Failed to load member profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (): string => {
    return member?.profiles?.display_name || 
           member?.email?.split('@')[0] || 
           'Unknown User';
  };

  const getAvatarUrl = (): string => {
    return member?.profiles?.avatar_url || '';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Crown className="w-3 h-3 mr-1" />
            Owner
          </Badge>
        );
      case 'admin':
      case 'moderator':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Shield className="w-3 h-3 mr-1" />
            Moderator
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Member
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <ResponsiveLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  if (!member) {
    return (
      <ResponsiveLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Member not found</h3>
            <Button onClick={() => navigate(`/community/${communityId}/members`)}>
              Back to Members
            </Button>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/community/${communityId}/members`)}
              className="gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Members
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-800">
                  <AvatarImage src={getAvatarUrl()} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl">
                    {getDisplayName().substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {getDisplayName()}
                    </h1>
                    {getRoleBadge(member.role)}
                  </div>

                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {member.profiles?.bio && (
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {member.profiles.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="default">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <Button size="sm" variant="outline">
                      <Heart className="w-4 h-4 mr-2" />
                      Follow
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.posts_count}
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Posts</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.comments_count}
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Comments</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Heart className="w-5 h-5 text-red-600" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.likes_received}
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Likes Received</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.likes_given}
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Likes Given</p>
              </CardContent>
            </Card>
          </div>

          {/* Activity Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="posts">Posts</TabsTrigger>
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Last Active</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDistanceToNow(new Date(stats.last_active), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Contribution Score</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {stats.posts_count + stats.comments_count + stats.likes_given} points
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Member Since</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(member.joined_at), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="posts" className="mt-4">
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No posts yet. Recent posts will appear here.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="comments" className="mt-4">
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No comments yet. Recent comments will appear here.
                    </p>
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

export default MemberProfile;
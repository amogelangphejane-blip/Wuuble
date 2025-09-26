import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Info, Users, Calendar, Globe, Lock, Shield, Target, Award, TrendingUp } from 'lucide-react';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { ModernHeader } from '@/components/ModernHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

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

const CommunityAbout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberStats, setMemberStats] = useState({
    activeToday: 0,
    newThisWeek: 0,
    totalPosts: 0
  });

  useEffect(() => {
    if (id) {
      fetchCommunity();
      fetchMemberStats();
    }
  }, [id]);

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
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberStats = async () => {
    // Mock stats for now
    setMemberStats({
      activeToday: Math.floor(Math.random() * 50) + 10,
      newThisWeek: Math.floor(Math.random() * 20) + 5,
      totalPosts: Math.floor(Math.random() * 500) + 100
    });
  };

  if (!id) {
    return (
      <ResponsiveLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p>Invalid community ID</p>
        </div>
      </ResponsiveLayout>
    );
  }

  if (loading) {
    return (
      <ResponsiveLayout>
        <ModernHeader />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ResponsiveLayout>
    );
  }

  if (!community) {
    return (
      <ResponsiveLayout>
        <ModernHeader />
        <div className="min-h-screen flex items-center justify-center">
          <Card>
            <CardContent className="text-center py-8">
              <h2 className="text-2xl font-bold mb-4">Community Not Found</h2>
              <Button onClick={() => navigate('/communities')}>
                Back to Communities
              </Button>
            </CardContent>
          </Card>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <ModernHeader />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate(`/community/${id}`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">About {community.name}</h1>
            <p className="text-gray-600">Learn more about our community</p>
          </div>

          <div className="space-y-6">
            {/* Community Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Community Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{community.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Created</p>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(community.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Privacy</p>
                    <div className="flex items-center gap-2">
                      {community.is_private ? (
                        <>
                          <Lock className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Private</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Public</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {community.category && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Category</p>
                    <Badge variant="secondary">{community.category}</Badge>
                  </div>
                )}

                {community.tags && community.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {community.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Community Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold">{community.member_count}</p>
                    <p className="text-sm text-gray-500">Total Members</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold">{memberStats.activeToday}</p>
                    <p className="text-sm text-gray-500">Active Today</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Award className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold">{memberStats.newThisWeek}</p>
                    <p className="text-sm text-gray-500">New This Week</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <p className="text-2xl font-bold">{memberStats.totalPosts}</p>
                    <p className="text-sm text-gray-500">Total Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  Community Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">1</span>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Be Respectful</p>
                      <p className="text-sm text-gray-600">Treat all members with respect and kindness. No harassment or hate speech.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">2</span>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Stay On Topic</p>
                      <p className="text-sm text-gray-600">Keep discussions relevant to the community's purpose and goals.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">3</span>
                    </div>
                    <div>
                      <p className="font-medium mb-1">No Spam</p>
                      <p className="text-sm text-gray-600">Avoid self-promotion without permission. Share valuable content only.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">4</span>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Protect Privacy</p>
                      <p className="text-sm text-gray-600">Don't share personal information of other members without consent.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">5</span>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Follow Platform Rules</p>
                      <p className="text-sm text-gray-600">Adhere to all platform terms of service and community standards.</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Community Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-yellow-600" />
                  Our Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                    <div>
                      <p className="font-medium">Foster Learning & Growth</p>
                      <p className="text-sm text-gray-600 mt-1">Create an environment where members can learn from each other and grow together.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                    <div>
                      <p className="font-medium">Build Meaningful Connections</p>
                      <p className="text-sm text-gray-600 mt-1">Help members network and form lasting professional and personal relationships.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                    <div>
                      <p className="font-medium">Share Knowledge & Resources</p>
                      <p className="text-sm text-gray-600 mt-1">Encourage the sharing of valuable insights, experiences, and resources.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default CommunityAbout;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Users,
  Search,
  Crown,
  Shield,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

interface Member {
  id: string;
  user_id: string;
  community_id: string;
  role: string;
  joined_at: string;
  display_name: string;
  avatar_url: string | null;
  email: string;
}

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  creator_id: string;
}

const CommunityMembersSimple: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');

  useEffect(() => {
    if (user && id) {
      fetchData();
    }
  }, [user, id]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(member => {
        const name = member.display_name || member.email || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredMembers(filtered);
    }
  }, [searchQuery, members]);

  const fetchData = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);

      // Fetch community
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (communityError) throw communityError;
      setCommunity(communityData);

      // Try member_profiles first
      const { data: profilesData, error: profilesError } = await supabase
        .from('member_profiles')
        .select('*')
        .eq('community_id', id)
        .eq('status', 'active');

      console.log('📊 Member Profiles Query:', {
        communityId: id,
        profilesData,
        profilesError,
        count: profilesData?.length
      });

      // Use member_profiles if available
      if (!profilesError && profilesData && profilesData.length > 0) {
        console.log('✅ Using member_profiles data:', profilesData);
        const enrichedMembers = profilesData.map((profile) => ({
          id: profile.id,
          user_id: profile.user_id,
          community_id: profile.community_id,
          role: profile.role,
          joined_at: profile.joined_at,
          display_name: profile.display_name || 'Member',
          avatar_url: profile.avatar_url,
          email: ''
        }));
        
        console.log('✅ Set members:', enrichedMembers);
        setMembers(enrichedMembers);
        setFilteredMembers(enrichedMembers);
      } else {
        console.log('⚠️ No member_profiles found, trying community_members...');
        // Fallback to community_members
        const { data: membersData, error: membersError } = await supabase
          .from('community_members')
          .select('*')
          .eq('community_id', id);
        
        console.log('📊 Community Members Query:', {
          membersData,
          membersError,
          count: membersData?.length
        });

        if (membersError) {
          console.error('Error fetching members:', membersError);
          // If both fail, at least show the creator
          const creatorMember = {
            id: 'creator-' + communityData.creator_id,
            user_id: communityData.creator_id,
            community_id: id,
            role: 'creator',
            joined_at: communityData.created_at || new Date().toISOString(),
            display_name: 'Community Creator',
            avatar_url: null,
            email: ''
          };
          setMembers([creatorMember]);
          setFilteredMembers([creatorMember]);
        } else {
          // Get profiles for members
          const enrichedMembers = await Promise.all(
            (membersData || []).map(async (member) => {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('display_name, avatar_url')
                .eq('user_id', member.user_id)
                .single();

              return {
                id: member.id,
                user_id: member.user_id,
                community_id: member.community_id,
                role: member.role,
                joined_at: member.joined_at,
                display_name: profileData?.display_name || 'Member',
                avatar_url: profileData?.avatar_url || null,
                email: ''
              };
            })
          );

          setMembers(enrichedMembers);
          setFilteredMembers(enrichedMembers);
        }
      }

      // Set current user role
      const currentMember = members.find(m => m.user_id === user.id);
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
      } else if (communityData.creator_id === user.id) {
        setCurrentUserRole('creator');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === 'creator' || role === 'owner') return <Crown className="w-4 h-4 text-yellow-500" />;
    if (role === 'moderator' || role === 'admin') return <Shield className="w-4 h-4 text-blue-500" />;
    return null;
  };

  const getRoleBadge = (role: string) => {
    if (role === 'creator' || role === 'owner') {
      return <Badge className="bg-yellow-100 text-yellow-800">Creator</Badge>;
    }
    if (role === 'moderator' || role === 'admin') {
      return <Badge className="bg-blue-100 text-blue-800">Moderator</Badge>;
    }
    return <Badge variant="secondary">Member</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading members...</p>
        </motion.div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Community not found</h3>
          <Button onClick={() => navigate('/communities')}>
            Back to Communities
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-40 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate(`/community/${id}`)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {community.name}
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl text-white shadow-lg">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Members</h1>
              <p className="text-gray-600 mt-1">
                {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Members Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredMembers.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <Users className="h-24 w-24 mx-auto mb-6 text-gray-300" />
              <h3 className="text-2xl font-semibold mb-3 text-gray-700">No members found</h3>
              <p className="text-gray-500">
                {searchQuery ? 'Try adjusting your search.' : 'This community has no members yet.'}
              </p>
            </div>
          ) : (
            filteredMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: { 
                    delay: Math.min(index * 0.05, 0.5),
                    type: "spring"
                  }
                }}
              >
                <Card className="overflow-hidden hover:shadow-xl transition-all">
                  <div className="h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                  
                  <CardContent className="relative -mt-10 pb-6">
                    <Avatar className="w-20 h-20 border-4 border-white mx-auto mb-4">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl">
                        {(member.display_name || 'A').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <p className="font-semibold text-lg">{member.display_name || 'Anonymous'}</p>
                        {getRoleIcon(member.role)}
                      </div>
                      
                      <div className="flex justify-center">
                        {getRoleBadge(member.role)}
                      </div>
                      
                      <p className="text-sm text-gray-600">{member.email}</p>
                      
                      <p className="text-xs text-gray-500">
                        Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CommunityMembersSimple;
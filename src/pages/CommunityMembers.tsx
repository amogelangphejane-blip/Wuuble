import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Users, 
  TrendingUp, 
  Activity, 
  Award, 
  Grid3X3, 
  List,
  BarChart3,
  UserPlus,
  Settings,
  Eye,
  Crown,
  Shield
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { validateAvatarUrl } from '@/lib/utils';

// Enhanced components
import EnhancedMemberCard from '@/components/EnhancedMemberCard';
import MemberFilters from '@/components/MemberFilters';
import MemberInvitation from '@/components/MemberInvitation';

// Types and services
import { 
  EnhancedCommunityMember, 
  MemberFilter, 
  MemberStats, 
  MemberBadge 
} from '@/types/members';
import { MemberService } from '@/services/memberService';

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

const CommunityMembers = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<EnhancedCommunityMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<EnhancedCommunityMember[]>([]);
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
  const [availableBadges, setAvailableBadges] = useState<MemberBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<'member' | 'moderator' | 'creator'>('member');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('members');
  
  // Filters state
  const [filters, setFilters] = useState<MemberFilter>({
    search: '',
    role: 'all',
    status: 'all',
    joined: 'all',
    badges: []
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchCommunityAndMembers();
    }
  }, [user, id]);

  useEffect(() => {
    applyFilters();
  }, [filters, members]);

  const fetchCommunityAndMembers = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);

      // Fetch community details
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (communityError) {
        console.error('Error fetching community:', communityError);
        navigate('/communities');
        return;
      }

      setCommunity(communityData);
      setIsCreator(communityData.creator_id === user.id);

      // Get current user's role
      const { data: userMembership } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', id)
        .eq('user_id', user.id)
        .single();

      if (userMembership) {
        setCurrentUserRole(
          communityData.creator_id === user.id ? 'creator' : userMembership.role
        );
      }

      // Fetch enhanced members data
      const enhancedMembers = await MemberService.getEnhancedMembers(id);
      setMembers(enhancedMembers);
      setFilteredMembers(enhancedMembers);

      // Fetch member statistics
      const stats = await MemberService.getMemberStats(id);
      setMemberStats(stats);

      // Fetch available badges
      const { data: badges } = await supabase
        .from('member_badges')
        .select('*')
        .eq('community_id', id);
      
      setAvailableBadges(badges || []);

    } catch (error) {
      console.error('Error fetching community details:', error);
      toast({
        title: "Error",
        description: "Failed to load community members.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...members];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(member => {
        const displayName = member.profiles?.display_name || '';
        const bio = member.member_bio || '';
        return displayName.toLowerCase().includes(searchTerm) ||
               bio.toLowerCase().includes(searchTerm);
      });
    }

    // Apply role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter(member => member.role === filters.role);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      switch (filters.status) {
        case 'online':
          filtered = filtered.filter(member => member.is_online);
          break;
        case 'recently_active':
          filtered = filtered.filter(member => member.is_recently_active);
          break;
        case 'offline':
          filtered = filtered.filter(member => !member.is_online && !member.is_recently_active);
          break;
      }
    }

    // Apply join date filter
    if (filters.joined !== 'all') {
      const now = new Date();
      let dateThreshold: Date;
      
      switch (filters.joined) {
        case 'today':
          dateThreshold = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateThreshold = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          dateThreshold = new Date(0);
      }
      
      filtered = filtered.filter(member => 
        new Date(member.joined_at) >= dateThreshold
      );
    }

    // Apply badge filter
    if (filters.badges.length > 0) {
      filtered = filtered.filter(member =>
        member.badges.some(badge => filters.badges.includes(badge.id))
      );
    }

    setFilteredMembers(filtered);
  };

  const handleMemberAction = async (action: string, member: EnhancedCommunityMember) => {
    try {
      switch (action) {
        case 'message':
          // TODO: Implement messaging
          toast({
            title: "Feature Coming Soon",
            description: "Direct messaging will be available soon."
          });
          break;
        
        case 'promote':
          await MemberService.updateMemberRole(member.id, 'moderator');
          toast({
            title: "Member Promoted",
            description: `${member.profiles?.display_name} has been promoted to moderator.`
          });
          fetchCommunityAndMembers();
          break;
        
        case 'demote':
          await MemberService.updateMemberRole(member.id, 'member');
          toast({
            title: "Member Demoted",
            description: `${member.profiles?.display_name} has been demoted to member.`
          });
          fetchCommunityAndMembers();
          break;
        
        case 'remove':
          await MemberService.removeMember(member.id);
          toast({
            title: "Member Removed",
            description: `${member.profiles?.display_name} has been removed from the community.`
          });
          fetchCommunityAndMembers();
          break;
        
        case 'award_badge':
          // TODO: Implement badge awarding dialog
          toast({
            title: "Feature Coming Soon",
            description: "Badge awarding interface will be available soon."
          });
          break;
        
        default:
          console.log('Unknown action:', action);
      }
    } catch (error) {
      console.error('Error performing member action:', error);
      toast({
        title: "Error",
        description: "Failed to perform action. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading members...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Community not found</h3>
            <Button onClick={() => navigate('/communities')}>
              Back to Communities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const canInvite = currentUserRole === 'creator' || currentUserRole === 'moderator';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/communities/${id}`)}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {community.name}
              </button>
            </div>
            <div className="flex items-center gap-3">
              {canInvite && (
                <MemberInvitation
                  communityId={community.id}
                  communityName={community.name}
                  isCreator={isCreator}
                  canInvite={canInvite}
                  onInviteSent={() => fetchCommunityAndMembers()}
                />
              )}
              
              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Members</h1>
            <Badge variant="secondary" className="ml-2">
              {filteredMembers.length} of {members.length}
            </Badge>
          </div>
          <p className="text-gray-600">
            Manage and connect with members of {community.name}.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Badges
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            {/* Filters */}
            <MemberFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableBadges={availableBadges}
              memberCount={filteredMembers.length}
            />

            {/* Members Grid/List */}
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                : "space-y-4"
            }>
              {filteredMembers.map((member) => (
                <EnhancedMemberCard
                  key={member.id}
                  member={member}
                  currentUserRole={currentUserRole}
                  isCreator={isCreator}
                  onAction={handleMemberAction}
                  compact={viewMode === 'list'}
                />
              ))}
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No members found</h3>
                <p className="text-sm">
                  {filters.search || filters.role !== 'all' || filters.status !== 'all' || filters.joined !== 'all' || filters.badges.length > 0
                    ? 'Try adjusting your filters to see more members.'
                    : 'This community doesn\'t have any members yet.'}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {memberStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="text-2xl font-bold">{memberStats.total_members}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Active Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">{memberStats.active_today}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">New This Week</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="text-2xl font-bold text-purple-600">{memberStats.new_this_week}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Online Now</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-2xl font-bold">{memberStats.online_members}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <span>Creator</span>
                    </div>
                    <Badge variant="outline">
                      {members.filter(m => m.role === 'creator').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span>Moderators</span>
                    </div>
                    <Badge variant="outline">
                      {members.filter(m => m.role === 'moderator').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>Members</span>
                    </div>
                    <Badge variant="outline">
                      {members.filter(m => m.role === 'member').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableBadges.map((badge) => (
                <Card key={badge.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span style={{ color: badge.color }}>{badge.icon}</span>
                      {badge.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-3">{badge.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {members.filter(m => m.badges.some(b => b.id === badge.id)).length} earned
                      </span>
                      <Badge 
                        variant="secondary"
                        style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
                      >
                        {badge.criteria.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {availableBadges.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Award className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No badges available</h3>
                <p className="text-sm">Badges will be created automatically as your community grows.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CommunityMembers;
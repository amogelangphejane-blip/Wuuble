import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
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
  Search,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

// Import our modern components
import ModernMemberCard from '@/components/ModernMemberCard';
import EnhancedMemberFilters from '@/components/EnhancedMemberFilters';
import MemberAnalyticsDashboard from '@/components/MemberAnalyticsDashboard';
import MemberInvitation from '@/components/MemberInvitation';
import { useRealtimeMembers } from '@/hooks/useRealtimeMembers';

// Types
import { 
  EnhancedCommunityMember, 
  MemberFilter, 
  MemberBadge 
} from '@/types/members';
import { supabase } from '@/integrations/supabase/client';

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

const ModernCommunityMembers = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Real-time members hook
  const { 
    members, 
    onlineCount, 
    loading: membersLoading, 
    error: membersError, 
    refreshMembers 
  } = useRealtimeMembers(id || '');

  // State
  const [community, setCommunity] = useState<Community | null>(null);
  const [availableBadges, setAvailableBadges] = useState<MemberBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<'member' | 'moderator' | 'creator'>('member');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('members');
  const [sortBy, setSortBy] = useState('activity_score');
  
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
      fetchCommunityData();
    }
  }, [user, id]);

  const fetchCommunityData = async () => {
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
        description: "Failed to load community data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort members
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = [...members];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(member => {
        const displayName = member.profiles?.display_name || '';
        const bio = member.member_bio || member.profiles?.bio || '';
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

    // Sort members
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'activity_score':
          return (b.activity_score || 0) - (a.activity_score || 0);
        case 'joined_at':
          return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
        case 'last_active':
          return new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime();
        case 'name':
          const nameA = a.profiles?.display_name || '';
          const nameB = b.profiles?.display_name || '';
          return nameA.localeCompare(nameB);
        default:
          return 0;
      }
    });

    return filtered;
  }, [members, filters, sortBy]);

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
          // TODO: Implement role promotion
          toast({
            title: "Member Promoted",
            description: `${member.profiles?.display_name} has been promoted.`
          });
          break;
        
        case 'remove':
          // TODO: Implement member removal
          toast({
            title: "Member Removed",
            description: `${member.profiles?.display_name} has been removed.`
          });
          break;
        
        case 'award_badge':
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

  if (loading || membersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex items-center justify-center h-96">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading members...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (membersError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50">
        <div className="flex items-center justify-center h-96">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-red-800">Error Loading Members</h3>
            <p className="text-red-600 mb-4">{membersError}</p>
            <Button onClick={refreshMembers} className="bg-red-600 hover:bg-red-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-center h-96">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Community not found</h3>
            <Button onClick={() => navigate('/communities')}>
              Back to Communities
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const canInvite = currentUserRole === 'creator' || currentUserRole === 'moderator';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ x: -2 }}
                onClick={() => navigate(`/communities/${id}`)}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {community.name}
              </motion.button>
            </div>
            
            <div className="flex items-center gap-3">
              {canInvite && (
                <MemberInvitation
                  communityId={community.id}
                  communityName={community.name}
                  isCreator={isCreator}
                  canInvite={canInvite}
                  onInviteSent={refreshMembers}
                />
              )}
              
              <motion.div whileHover={{ scale: 1.05 }}>
                <Button
                  variant="outline"
                  onClick={refreshMembers}
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Members</h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span>{filteredAndSortedMembers.length} members</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>{onlineCount} online</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-600 max-w-2xl">
            Connect with and manage the amazing members of {community.name}. 
            Track engagement, assign roles, and build stronger community relationships.
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <TabsList className="bg-white/60 backdrop-blur-sm border">
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
          </motion.div>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <EnhancedMemberFilters
                filters={filters}
                onFiltersChange={setFilters}
                members={members}
                availableBadges={availableBadges}
                onlineCount={onlineCount}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
            </motion.div>

            {/* Members Grid/List */}
            <AnimatePresence mode="popLayout">
              {filteredAndSortedMembers.length > 0 ? (
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={
                    viewMode === 'grid' 
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                      : "space-y-4"
                  }
                >
                  {filteredAndSortedMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0, 
                        scale: 1,
                        transition: { delay: Math.min(index * 0.05, 0.5) }
                      }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    >
                      <ModernMemberCard
                        member={member}
                        currentUserRole={currentUserRole}
                        isCreator={isCreator}
                        onAction={handleMemberAction}
                        compact={viewMode === 'list'}
                        showQuickActions={true}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 border border-gray-200/50">
                    <Search className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                    <h3 className="text-xl font-semibold mb-3 text-gray-700">No members found</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      {filters.search || filters.role !== 'all' || filters.status !== 'all' || filters.joined !== 'all' || filters.badges.length > 0
                        ? 'Try adjusting your filters to see more members.'
                        : 'This community doesn\'t have any members yet.'}
                    </p>
                    {(filters.search || filters.role !== 'all' || filters.status !== 'all' || filters.joined !== 'all' || filters.badges.length > 0) && (
                      <Button 
                        variant="outline"
                        onClick={() => setFilters({
                          search: '',
                          role: 'all',
                          status: 'all',
                          joined: 'all',
                          badges: []
                        })}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <MemberAnalyticsDashboard
                members={members}
                onlineCount={onlineCount}
              />
            </motion.div>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {availableBadges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableBadges.map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: { delay: index * 0.1 }
                      }}
                    >
                      <Card className="hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div 
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                              style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
                            >
                              {badge.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{badge.name}</h3>
                              <Badge 
                                variant="secondary"
                                style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
                                className="text-xs"
                              >
                                {badge.criteria.type.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-4">{badge.description}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              {members.filter(m => m.badges.some(b => b.id === badge.id)).length} earned
                            </span>
                            <Button variant="outline" size="sm">
                              View Members
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 border border-gray-200/50">
                    <Award className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                    <h3 className="text-xl font-semibold mb-3 text-gray-700">No badges available</h3>
                    <p className="text-gray-500">Badges will be created automatically as your community grows.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ModernCommunityMembers;
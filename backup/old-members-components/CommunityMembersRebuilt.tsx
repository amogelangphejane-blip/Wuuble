import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Users, 
  UserPlus,
  Settings,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Activity,
  Crown,
  Shield
} from 'lucide-react';

// Import our new components
import MemberCard from '@/components/community/MemberCard';
import MemberFilters from '@/components/community/MemberFilters';
import MemberProfileDialog from '@/components/community/MemberProfileDialog';
import { useCommunityMembers, useRealtimeMembers } from '@/hooks/useCommunityMembers';

// Types
import { 
  EnhancedMemberProfile, 
  MemberFilter, 
  MemberSort,
  MemberBulkAction
} from '@/types/community-members';
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

const CommunityMembersRebuilt = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Community data
  const [community, setCommunity] = useState<Community | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'member' | 'moderator' | 'creator'>('member');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMember, setSelectedMember] = useState<EnhancedMemberProfile | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [loadingCommunity, setLoadingCommunity] = useState(true);

  // Use our hooks
  const {
    members,
    loading: membersLoading,
    error: membersError,
    statistics,
    filters,
    sort,
    pagination,
    setFilters,
    setSort,
    setPage,
    refresh,
    updateMember,
    removeMember,
    inviteMember,
    awardBadge,
    bulkAction
  } = useCommunityMembers(id || '');

  const {
    onlineCount,
    connected,
    updatePresence,
    trackActivity
  } = useRealtimeMembers(id || '');

  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch community data
  useEffect(() => {
    if (user && id) {
      fetchCommunityData();
    }
  }, [user, id]);

  const fetchCommunityData = async () => {
    if (!id || !user) return;

    try {
      setLoadingCommunity(true);

      // Fetch community details
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (communityError) {
        console.error('Error fetching community:', communityError);
        toast({
          title: "Error",
          description: "Community not found",
          variant: "destructive"
        });
        navigate('/communities');
        return;
      }

      setCommunity(communityData);

      // Determine current user's role
      if (communityData.creator_id === user.id) {
        setCurrentUserRole('creator');
      } else {
        // Check if user is moderator
        const { data: memberData } = await supabase
          .from('member_profiles')
          .select('role')
          .eq('community_id', id)
          .eq('user_id', user.id)
          .single();

        if (memberData?.role === 'moderator') {
          setCurrentUserRole('moderator');
        } else {
          setCurrentUserRole('member');
        }
      }

    } catch (error) {
      console.error('Error fetching community details:', error);
      toast({
        title: "Error",
        description: "Failed to load community data.",
        variant: "destructive"
      });
    } finally {
      setLoadingCommunity(false);
    }
  };

  // Update user presence
  useEffect(() => {
    if (user && id && connected) {
      updatePresence({
        current_page: `/community/${id}/members`,
        device_type: 'desktop'
      });
    }
  }, [user, id, connected, updatePresence]);

  // Member actions
  const handleMemberAction = useCallback(async (action: string, member: EnhancedMemberProfile) => {
    try {
      switch (action) {
        case 'message':
          // TODO: Implement messaging
          toast({
            title: "Feature Coming Soon",
            description: "Direct messaging will be available soon."
          });
          break;

        case 'follow':
          // TODO: Implement following
          toast({
            title: "Following",
            description: `You are now following ${member.display_name}`
          });
          break;

        case 'promote':
          const newRole = member.role === 'member' ? 'moderator' : 'member';
          await updateMember(member.id, { role: newRole });
          break;

        case 'demote':
          await updateMember(member.id, { role: 'member' });
          break;

        case 'remove':
          if (confirm(`Are you sure you want to remove ${member.display_name} from the community?`)) {
            await removeMember(member.id);
          }
          break;

        case 'award_badge':
          // TODO: Implement badge awarding dialog
          toast({
            title: "Feature Coming Soon",
            description: "Badge awarding interface will be available soon."
          });
          break;
      }

      // Track the action
      if (user) {
        await trackActivity({
          member_id: user.id, // Current user performing the action
          community_id: id!,
          activity_type: 'member_invited', // This should be more specific
          activity_data: { 
            action, 
            target_member: member.id,
            target_member_name: member.display_name 
          },
          points_earned: 0,
          engagement_weight: 1.0,
          occurred_at: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action}. Please try again.`,
        variant: "destructive"
      });
    }
  }, [updateMember, removeMember, trackActivity, user, id, toast]);

  const handleProfileClick = (member: EnhancedMemberProfile) => {
    setSelectedMember(member);
    setShowProfileDialog(true);
  };

  // Bulk actions
  const handleBulkAction = async (action: MemberBulkAction) => {
    if (action.member_ids.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select members first.",
        variant: "destructive"
      });
      return;
    }

    try {
      await bulkAction(action);
    } catch (error) {
      console.error('Bulk action error:', error);
    }
  };

  // Loading states
  if (authLoading || loadingCommunity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex items-center justify-center h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading community...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Error states
  if (membersError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-pink-50">
        <div className="flex items-center justify-center h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-red-800">Error Loading Members</h3>
            <p className="text-red-600 mb-6">{membersError}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={refresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => navigate('/communities')}>
                Back to Communities
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
        <div className="flex items-center justify-center h-screen">
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

  const canManage = currentUserRole === 'creator' || currentUserRole === 'moderator';
  const isCreator = currentUserRole === 'creator';

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
              <motion.button
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/community/${id}`)}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {community.name}
              </motion.button>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Real-time connection indicator */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span>{connected ? 'Live' : 'Connecting...'}</span>
              </div>

              {canManage && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    // TODO: Open invite dialog
                    toast({
                      title: "Feature Coming Soon",
                      description: "Member invitation interface will be available soon."
                    });
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Members
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={refresh}
                disabled={membersLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${membersLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              {isCreator && (
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              )}
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl text-white shadow-lg">
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                    Members
                    <Sparkles className="h-8 w-8 text-yellow-500" />
                  </h1>
                  <div className="flex items-center gap-6 text-gray-600 mt-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{statistics.total_members} total members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="font-medium">{onlineCount} online now</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span>+{statistics.new_this_week} this week</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl leading-relaxed">
                Connect with the amazing community of <span className="font-semibold text-blue-600">{community.name}</span>. 
                Discover talented members, track engagement, and build meaningful relationships.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="hidden lg:flex gap-4">
              <Card className="text-center p-4 min-w-[100px]">
                <CardContent className="p-0">
                  <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
                    <Crown className="h-5 w-5" />
                    {statistics.creators_count}
                  </div>
                  <div className="text-xs text-gray-600">Creators</div>
                </CardContent>
              </Card>
              <Card className="text-center p-4 min-w-[100px]">
                <CardContent className="p-0">
                  <div className="text-2xl font-bold text-purple-600 flex items-center justify-center gap-1">
                    <Shield className="h-5 w-5" />
                    {statistics.moderators_count}
                  </div>
                  <div className="text-xs text-gray-600">Moderators</div>
                </CardContent>
              </Card>
              <Card className="text-center p-4 min-w-[100px]">
                <CardContent className="p-0">
                  <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                    <Activity className="h-5 w-5" />
                    {Math.round(statistics.avg_activity_score)}%
                  </div>
                  <div className="text-xs text-gray-600">Avg Activity</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <MemberFilters
            filters={filters}
            sort={sort}
            members={members}
            availableBadges={[]} // TODO: Fetch available badges
            onFiltersChange={setFilters}
            onSortChange={setSort}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </motion.div>

        {/* Members Grid/List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {membersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200" />
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-16 bg-gray-200 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : members.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 border border-white/20 shadow-xl">
                <Users className="h-24 w-24 mx-auto mb-6 text-gray-300" />
                <h3 className="text-2xl font-semibold mb-3 text-gray-700">No members found</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {Object.values(filters).some(v => v !== '' && v !== 'all' && (Array.isArray(v) ? v.length > 0 : true))
                    ? 'Try adjusting your filters to see more members.'
                    : 'This community is just getting started. Be among the first to join!'}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setFilters({})}>
                    Clear Filters
                  </Button>
                  {canManage && (
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Members
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  : "space-y-4"
              )}>
                {members.map((member, index) => (
                  <motion.div
                    key={member.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: { 
                        delay: Math.min(index * 0.05, 0.5),
                        type: "spring",
                        stiffness: 100
                      }
                    }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  >
                    <MemberCard
                      member={member}
                      currentUserRole={currentUserRole}
                      currentUserId={user?.id}
                      compact={viewMode === 'list'}
                      showActions={true}
                      onProfileClick={handleProfileClick}
                      onMessage={(m) => handleMemberAction('message', m)}
                      onFollow={(m) => handleMemberAction('follow', m)}
                      onPromote={(m) => handleMemberAction('promote', m)}
                      onDemote={(m) => handleMemberAction('demote', m)}
                      onRemove={(m) => handleMemberAction('remove', m)}
                      onAwardBadge={(m) => handleMemberAction('award_badge', m)}
                    />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center items-center gap-2 mt-12"
          >
            <Button
              variant="outline"
              disabled={!pagination.has_previous}
              onClick={() => setPage(pagination.page - 1)}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              {[...Array(Math.min(pagination.total_pages, 5))].map((_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={page === pagination.page ? "default" : "outline"}
                    className="w-10 h-10 p-0"
                    onClick={() => setPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              disabled={!pagination.has_next}
              onClick={() => setPage(pagination.page + 1)}
            >
              Next
            </Button>
          </motion.div>
        )}
      </div>

      {/* Member Profile Dialog */}
      <MemberProfileDialog
        member={selectedMember}
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        currentUserRole={currentUserRole}
        currentUserId={user?.id}
        onMessage={(m) => handleMemberAction('message', m)}
        onFollow={(m) => handleMemberAction('follow', m)}
        onAwardBadge={(m) => handleMemberAction('award_badge', m)}
        onPromote={(m) => handleMemberAction('promote', m)}
        onRemove={(m) => handleMemberAction('remove', m)}
      />
    </div>
  );
};

export default CommunityMembersRebuilt;
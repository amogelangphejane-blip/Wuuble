import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SimpleMember, MemberStats, MemberFilters, Community } from '@/types/simple-members';

interface UseSimpleMembersReturn {
  members: SimpleMember[];
  community: Community | null;
  stats: MemberStats;
  loading: boolean;
  error: string | null;
  filters: MemberFilters;
  currentUserRole: 'creator' | 'moderator' | 'member';
  
  setFilters: (filters: Partial<MemberFilters>) => void;
  refreshMembers: () => Promise<void>;
  promoteMember: (memberId: string) => Promise<void>;
  demoteMember: (memberId: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
}

export const useSimpleMembers = (
  communityId: string, 
  currentUserId?: string
): UseSimpleMembersReturn => {
  const [members, setMembers] = useState<SimpleMember[]>([]);
  const [community, setCommunity] = useState<Community | null>(null);
  const [stats, setStats] = useState<MemberStats>({
    total_members: 0,
    online_now: 0,
    new_this_week: 0,
    moderators: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'creator' | 'moderator' | 'member'>('member');
  const [filters, setFiltersState] = useState<MemberFilters>({
    search: '',
    role: 'all',
    status: 'all',
  });

  const { toast } = useToast();

  // Get display name from profile data
  const getDisplayName = (profile: any, userId: string): string => {
    return profile?.display_name || `User ${userId.slice(0, 8)}`;
  };

  // Fetch community data
  const fetchCommunity = useCallback(async () => {
    if (!communityId) return null;

    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching community:', err);
      throw err;
    }
  }, [communityId]);

  // Fetch members with their user data
  const fetchMembers = useCallback(async () => {
    if (!communityId) return [];

    try {
      // Get members from community_members table
      const { data: memberData, error: memberError } = await supabase
        .from('community_members')
        .select(`
          id,
          user_id,
          community_id,
          role,
          joined_at
        `)
        .eq('community_id', communityId)
        .order('joined_at', { ascending: false });

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        return [];
      }

      // Get user profiles for each member
      const userIds = memberData.map(m => m.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio, updated_at')
        .in('id', userIds);

      if (profileError) {
        console.warn('Error fetching profiles:', profileError);
      }

      // Get auth user data - we'll use a simpler approach
      // Note: In production, you might want to store email in profiles table

      // Combine data into SimpleMember objects
      const enrichedMembers: SimpleMember[] = memberData.map(member => {
        const profile = profiles?.find(p => p.id === member.user_id);
        
        return {
          id: member.id,
          user_id: member.user_id,
          community_id: member.community_id,
          role: member.role as 'creator' | 'moderator' | 'member',
          joined_at: member.joined_at,
          last_active_at: profile?.updated_at || member.joined_at,
          is_online: false, // TODO: Implement real-time presence
          display_name: getDisplayName(profile, member.user_id),
          email: `user-${member.user_id.slice(0, 8)}@example.com`, // Placeholder email
          avatar_url: profile?.avatar_url || null,
          bio: profile?.bio || null,
        };
      });

      return enrichedMembers;
    } catch (err) {
      console.error('Error fetching members:', err);
      throw err;
    }
  }, [communityId]);

  // Calculate stats from members data
  const calculateStats = useCallback((membersData: SimpleMember[]): MemberStats => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total_members: membersData.length,
      online_now: membersData.filter(m => m.is_online).length,
      new_this_week: membersData.filter(m => new Date(m.joined_at) > weekAgo).length,
      moderators: membersData.filter(m => m.role === 'moderator' || m.role === 'creator').length,
    };
  }, []);

  // Filter members based on current filters
  const getFilteredMembers = useCallback((membersData: SimpleMember[]): SimpleMember[] => {
    return membersData.filter(member => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          member.display_name.toLowerCase().includes(searchLower) ||
          member.email.toLowerCase().includes(searchLower) ||
          (member.bio && member.bio.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Role filter
      if (filters.role !== 'all' && member.role !== filters.role) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        if (filters.status === 'online' && !member.is_online) return false;
        if (filters.status === 'offline' && member.is_online) return false;
      }

      return true;
    });
  }, [filters]);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch community and members in parallel
      const [communityData, membersData] = await Promise.all([
        fetchCommunity(),
        fetchMembers()
      ]);

      if (communityData) {
        setCommunity(communityData);
        
        // Determine current user's role
        if (currentUserId) {
          if (communityData.creator_id === currentUserId) {
            setCurrentUserRole('creator');
          } else {
            const currentMember = membersData.find(m => m.user_id === currentUserId);
            setCurrentUserRole(currentMember?.role || 'member');
          }
        }
      }

      setMembers(membersData);
      setStats(calculateStats(membersData));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load members';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [communityId, currentUserId, fetchCommunity, fetchMembers, calculateStats, toast]);

  // Refresh members data
  const refreshMembers = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Update filters
  const setFilters = useCallback((newFilters: Partial<MemberFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Promote member to moderator
  const promoteMember = useCallback(async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role: 'moderator' })
        .eq('id', memberId);

      if (error) throw error;

      // Update local state
      setMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { ...member, role: 'moderator' } 
            : member
        )
      );

      toast({
        title: "Success",
        description: "Member promoted to moderator",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to promote member';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  // Demote moderator to member
  const demoteMember = useCallback(async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role: 'member' })
        .eq('id', memberId);

      if (error) throw error;

      // Update local state
      setMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { ...member, role: 'member' } 
            : member
        )
      );

      toast({
        title: "Success",
        description: "Moderator demoted to member",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to demote member';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  // Remove member from community
  const removeMember = useCallback(async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Update local state
      setMembers(prev => prev.filter(member => member.id !== memberId));
      setStats(prev => ({
        ...prev,
        total_members: prev.total_members - 1,
      }));

      toast({
        title: "Success",
        description: "Member removed from community",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (communityId) {
      loadData();
    }
  }, [loadData]);

  // Return filtered members
  const filteredMembers = getFilteredMembers(members);

  return {
    members: filteredMembers,
    community,
    stats,
    loading,
    error,
    filters,
    currentUserRole,
    
    setFilters,
    refreshMembers,
    promoteMember,
    demoteMember,
    removeMember,
  };
};
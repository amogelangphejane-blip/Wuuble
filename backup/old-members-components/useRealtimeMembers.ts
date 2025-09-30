import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { EnhancedCommunityMember } from '@/types/members';
import { MemberService } from '@/services/memberService';

interface UseRealtimeMembersReturn {
  members: EnhancedCommunityMember[];
  onlineCount: number;
  loading: boolean;
  error: string | null;
  refreshMembers: () => Promise<void>;
}

export const useRealtimeMembers = (communityId: string): UseRealtimeMembersReturn => {
  const [members, setMembers] = useState<EnhancedCommunityMember[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);

  // Fetch initial members data
  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const membersData = await MemberService.getEnhancedMembers(communityId);
      setMembers(membersData);
      setOnlineCount(membersData.filter(m => m.is_online).length);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const refreshMembers = async () => {
    await fetchMembers();
  };

  useEffect(() => {
    if (!communityId) return;

    // Initial fetch
    fetchMembers();

    // Set up real-time subscription for member changes
    channelRef.current = supabase
      .channel(`community_members:${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_members',
          filter: `community_id=eq.${communityId}`,
        },
        async (payload) => {
          console.log('Member change detected:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              // New member joined
              const newMemberData = await MemberService.getEnhancedMembers(communityId);
              const newMember = newMemberData.find(m => m.id === payload.new.id);
              if (newMember) {
                setMembers(prev => [...prev, newMember]);
              }
              break;
              
            case 'UPDATE':
              // Member updated (role change, profile update, etc.)
              setMembers(prev => 
                prev.map(member => 
                  member.id === payload.new.id 
                    ? { ...member, ...payload.new }
                    : member
                )
              );
              break;
              
            case 'DELETE':
              // Member removed
              setMembers(prev => prev.filter(member => member.id !== payload.old.id));
              break;
          }
        }
      )
      .subscribe();

    // Set up presence tracking for online status
    presenceChannelRef.current = supabase
      .channel(`community_presence:${communityId}`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannelRef.current?.presenceState();
        const onlineUserIds = Object.keys(presenceState || {});
        
        // Update online status for all members
        setMembers(prev => 
          prev.map(member => ({
            ...member,
            is_online: onlineUserIds.includes(member.user_id),
            last_active_at: onlineUserIds.includes(member.user_id) 
              ? new Date().toISOString() 
              : member.last_active_at
          }))
        );
        
        setOnlineCount(onlineUserIds.length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User came online:', key, newPresences);
        
        // Update specific member online status
        setMembers(prev => 
          prev.map(member => 
            member.user_id === key 
              ? { 
                  ...member, 
                  is_online: true, 
                  last_active_at: new Date().toISOString() 
                }
              : member
          )
        );
        
        setOnlineCount(prev => prev + 1);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User went offline:', key, leftPresences);
        
        // Update specific member online status
        setMembers(prev => 
          prev.map(member => 
            member.user_id === key 
              ? { ...member, is_online: false }
              : member
          )
        );
        
        setOnlineCount(prev => Math.max(0, prev - 1));
      })
      .subscribe();

    // Track current user's presence
    const trackPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && presenceChannelRef.current) {
        await presenceChannelRef.current.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
      }
    };

    trackPresence();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  }, [communityId]);

  // Update presence when window focus changes
  useEffect(() => {
    const handleFocus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && presenceChannelRef.current) {
        await presenceChannelRef.current.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
      }
    };

    const handleBlur = async () => {
      if (presenceChannelRef.current) {
        await presenceChannelRef.current.untrack();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return {
    members,
    onlineCount,
    loading,
    error,
    refreshMembers
  };
};
import { useEffect, useCallback } from 'react';
import { useActivityRecorder } from './useLeaderboard';
import { ActivityType } from '@/types/leaderboard';

/**
 * Hook to automatically track user activities for leaderboard scoring
 */
export function useActivityTracker(communityId: string) {
  const { recordActivity } = useActivityRecorder(communityId);

  // Track chat message activity
  const trackChatMessage = useCallback((content: string, additionalData?: Record<string, any>) => {
    recordActivity('chat_message', {
      message_length: content.length,
      has_mentions: content.includes('@'),
      has_links: /https?:\/\//.test(content),
      ...additionalData
    }, content);
  }, [recordActivity]);

  // Track post creation
  const trackPostCreated = useCallback((postData: {
    title?: string;
    content: string;
    has_image?: boolean;
    category?: string;
  }) => {
    recordActivity('post_created', {
      content_length: postData.content.length,
      title_length: postData.title?.length || 0,
      has_image: postData.has_image || false,
      category: postData.category
    }, `${postData.title || ''}\n${postData.content}`);
  }, [recordActivity]);

  // Track comment posted
  const trackCommentPosted = useCallback((content: string, postId: string, parentCommentId?: string) => {
    recordActivity('comment_posted', {
      content_length: content.length,
      post_id: postId,
      parent_comment_id: parentCommentId,
      is_reply: !!parentCommentId
    }, content);
  }, [recordActivity]);

  // Track like given
  const trackLikeGiven = useCallback((targetType: 'post' | 'comment', targetId: string) => {
    recordActivity('like_given', {
      target_type: targetType,
      target_id: targetId
    });
  }, [recordActivity]);

  // Track video call joined
  const trackVideoCallJoined = useCallback((callData: {
    call_id: string;
    duration_minutes?: number;
    speaking_time_minutes?: number;
    camera_enabled?: boolean;
    reactions_given?: number;
    reactions_received?: number;
    audio_transcript?: string;
  }) => {
    recordActivity('video_call_joined', {
      call_id: callData.call_id,
      duration_minutes: callData.duration_minutes || 0,
      speaking_time_minutes: callData.speaking_time_minutes || 0,
      camera_enabled: callData.camera_enabled || false,
      reactions_given: callData.reactions_given || 0,
      reactions_received: callData.reactions_received || 0,
      audio_transcript: callData.audio_transcript
    });
  }, [recordActivity]);

  // Track help provided
  const trackHelpProvided = useCallback((helpData: {
    help_type: 'answer' | 'guidance' | 'resource_share' | 'mentoring';
    target_user_id?: string;
    content?: string;
    quality_rating?: number;
  }) => {
    recordActivity('help_provided', {
      help_type: helpData.help_type,
      target_user_id: helpData.target_user_id,
      quality_rating: helpData.quality_rating
    }, helpData.content);
  }, [recordActivity]);

  // Track member welcomed
  const trackMemberWelcomed = useCallback((newMemberId: string, welcomeMessage?: string) => {
    recordActivity('member_welcomed', {
      new_member_id: newMemberId,
      has_personal_message: !!welcomeMessage
    }, welcomeMessage);
  }, [recordActivity]);

  // Track event attended
  const trackEventAttended = useCallback((eventData: {
    event_id: string;
    event_type: string;
    duration_minutes?: number;
    participation_level?: 'passive' | 'active' | 'presenter';
  }) => {
    recordActivity('event_attended', {
      event_id: eventData.event_id,
      event_type: eventData.event_type,
      duration_minutes: eventData.duration_minutes || 0,
      participation_level: eventData.participation_level || 'passive'
    });
  }, [recordActivity]);

  // Track resource shared
  const trackResourceShared = useCallback((resourceData: {
    resource_type: 'link' | 'file' | 'document' | 'video' | 'other';
    title?: string;
    description?: string;
    url?: string;
    file_size?: number;
  }) => {
    recordActivity('resource_shared', {
      resource_type: resourceData.resource_type,
      title: resourceData.title,
      url: resourceData.url,
      file_size: resourceData.file_size
    }, resourceData.description);
  }, [recordActivity]);

  return {
    trackChatMessage,
    trackPostCreated,
    trackCommentPosted,
    trackLikeGiven,
    trackVideoCallJoined,
    trackHelpProvided,
    trackMemberWelcomed,
    trackEventAttended,
    trackResourceShared
  };
}

/**
 * Hook to track user engagement in real-time
 */
export function useEngagementTracker(communityId: string) {
  const { trackChatMessage, trackLikeGiven } = useActivityTracker(communityId);

  useEffect(() => {
    // Track page visibility for engagement scoring
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User returned to the page - could indicate engagement
        console.log('User engaged with community page');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Track scroll depth for engagement
  useEffect(() => {
    let maxScrollDepth = 0;
    
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.body.offsetHeight;
      const winHeight = window.innerHeight;
      const scrollPercent = scrollTop / (docHeight - winHeight);
      
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
      }
    };

    const handleBeforeUnload = () => {
      // Track engagement depth when leaving
      if (maxScrollDepth > 0.5) {
        console.log(`High engagement: ${Math.round(maxScrollDepth * 100)}% scroll depth`);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return {
    trackChatMessage,
    trackLikeGiven
  };
}

/**
 * Hook for community moderators to track moderation activities
 */
export function useModerationTracker(communityId: string) {
  const { recordActivity } = useActivityRecorder(communityId);

  const trackModerationAction = useCallback((action: {
    type: 'post_approved' | 'post_removed' | 'user_warned' | 'user_banned' | 'content_flagged';
    target_id: string;
    reason?: string;
    severity?: 'low' | 'medium' | 'high';
  }) => {
    recordActivity('help_provided', { // Using help_provided as moderation helps the community
      help_type: 'moderation',
      moderation_action: action.type,
      target_id: action.target_id,
      severity: action.severity || 'medium'
    }, action.reason);
  }, [recordActivity]);

  return {
    trackModerationAction
  };
}
import { useCallback } from 'react';
import { gamificationService } from '@/services/gamificationService';
import { ActivityType } from '@/types/gamification';
import { useAuth } from './useAuth';

/**
 * Hook for tracking gamification activities
 */
export function useGamification(communityId: string) {
  const { user } = useAuth();

  const awardPoints = useCallback(async (
    activityType: ActivityType,
    referenceId?: string
  ) => {
    if (!user) return;

    try {
      await gamificationService.awardPoints(
        communityId,
        user.id,
        activityType,
        referenceId
      );
    } catch (error) {
      console.error('Error awarding points:', error);
      // Don't throw - gamification should not break the user experience
    }
  }, [communityId, user]);

  // Track specific activities
  const trackPostCreated = useCallback((postId?: string) => {
    awardPoints('post_created', postId);
  }, [awardPoints]);

  const trackCommentPosted = useCallback((commentId?: string) => {
    awardPoints('comment_posted', commentId);
  }, [awardPoints]);

  const trackLikeGiven = useCallback((targetId?: string) => {
    awardPoints('like_given', targetId);
  }, [awardPoints]);

  const trackLikeReceived = useCallback((targetId?: string) => {
    awardPoints('like_received', targetId);
  }, [awardPoints]);

  const trackVideoCallJoined = useCallback((callId?: string) => {
    awardPoints('video_call_joined', callId);
  }, [awardPoints]);

  const trackEventAttended = useCallback((eventId?: string) => {
    awardPoints('event_attended', eventId);
  }, [awardPoints]);

  const trackResourceShared = useCallback((resourceId?: string) => {
    awardPoints('resource_shared', resourceId);
  }, [awardPoints]);

  const trackMemberJoined = useCallback(() => {
    awardPoints('member_joined');
  }, [awardPoints]);

  return {
    trackPostCreated,
    trackCommentPosted,
    trackLikeGiven,
    trackLikeReceived,
    trackVideoCallJoined,
    trackEventAttended,
    trackResourceShared,
    trackMemberJoined,
  };
}

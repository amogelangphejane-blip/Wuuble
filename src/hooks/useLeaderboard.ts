import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  UseLeaderboardReturn,
  UseUserProgressReturn,
  UseLeaderboardQueryReturn,
  LeaderboardEntry,
  UserFeedback,
  ProgressData,
  ProcessLeaderboardQueryResponse,
  LeaderboardQuery,
  UserScoreHistory,
  ActivityType
} from '@/types/leaderboard';
import { leaderboardService } from '@/services/leaderboardService';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

/**
 * Hook for managing community leaderboard data
 */
export function useLeaderboard(communityId: string, limit: number = 50): UseLeaderboardReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  
  const {
    data: leaderboard = [],
    refetch,
    isLoading: queryLoading,
    error: queryError
  } = useQuery({
    queryKey: ['leaderboard', communityId, limit],
    queryFn: () => leaderboardService.getLeaderboard(communityId, limit),
    enabled: !!communityId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  const {
    data: userPosition = null,
  } = useQuery({
    queryKey: ['user-position', communityId, user?.id],
    queryFn: () => user ? leaderboardService.getUserPosition(communityId, user.id) : null,
    enabled: !!communityId && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const refreshLeaderboard = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    leaderboard,
    userPosition,
    isLoading: isLoading || queryLoading,
    error: error || queryError,
    refreshLeaderboard
  };
}

/**
 * Hook for managing user progress and feedback
 */
export function useUserProgress(communityId: string): UseUserProgressReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user feedback
  const {
    data: feedback = [],
    refetch: refetchFeedback
  } = useQuery({
    queryKey: ['user-feedback', communityId, user?.id],
    queryFn: () => user ? leaderboardService.getUserFeedback(communityId, user.id) : [],
    enabled: !!communityId && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch user score history
  const {
    data: scoreHistory = []
  } = useQuery({
    queryKey: ['user-score-history', communityId, user?.id],
    queryFn: () => user ? leaderboardService.getUserScoreHistory(communityId, user.id, 'weekly', 12) : [],
    enabled: !!communityId && !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get user position for current score
  const {
    data: userPosition
  } = useQuery({
    queryKey: ['user-position', communityId, user?.id],
    queryFn: () => user ? leaderboardService.getUserPosition(communityId, user.id) : null,
    enabled: !!communityId && !!user?.id,
  });

  // Build progress data
  const progress: ProgressData | null = userPosition ? {
    current_score: userPosition.performance_score,
    score_history: scoreHistory.map(history => ({
      date: history.period_start,
      score: history.performance_score,
      rank: history.rank
    })),
    goals: [], // TODO: Implement goals system
    achievements: [], // TODO: Implement achievements system
    strengths: identifyStrengths(userPosition.score_breakdown),
    improvement_areas: identifyWeaknesses(userPosition.score_breakdown)
  } : null;

  // Mark feedback as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (feedbackId: string) => leaderboardService.markFeedbackAsRead(feedbackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-feedback', communityId, user?.id] });
    },
    onError: (error) => {
      console.error('Error marking feedback as read:', error);
      toast.error('Failed to mark feedback as read');
    }
  });

  // Dismiss feedback mutation
  const dismissMutation = useMutation({
    mutationFn: (feedbackId: string) => leaderboardService.dismissFeedback(feedbackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-feedback', communityId, user?.id] });
      toast.success('Feedback dismissed');
    },
    onError: (error) => {
      console.error('Error dismissing feedback:', error);
      toast.error('Failed to dismiss feedback');
    }
  });

  const markFeedbackAsRead = useCallback((feedbackId: string) => {
    markAsReadMutation.mutate(feedbackId);
  }, [markAsReadMutation]);

  const dismissFeedback = useCallback((feedbackId: string) => {
    dismissMutation.mutate(feedbackId);
  }, [dismissMutation]);

  return {
    progress,
    feedback,
    isLoading: isLoading || markAsReadMutation.isPending || dismissMutation.isPending,
    error,
    markFeedbackAsRead,
    dismissFeedback
  };
}

/**
 * Hook for the AI-powered "ask" function
 */
export function useLeaderboardQuery(communityId: string): UseLeaderboardQueryReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch query history
  const {
    data: queryHistory = []
  } = useQuery({
    queryKey: ['query-history', communityId, user?.id],
    queryFn: () => user ? leaderboardService.getUserQueryHistory(communityId, user.id) : [],
    enabled: !!communityId && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Process query mutation
  const processQueryMutation = useMutation({
    mutationFn: async (question: string): Promise<ProcessLeaderboardQueryResponse> => {
      if (!user) throw new Error('User not authenticated');
      
      const queryResult = await leaderboardService.processUserQuery(communityId, user.id, question);
      
      return {
        response: queryResult.ai_response,
        intent: queryResult.query_intent!,
        confidence: (queryResult.response_data as any)?.confidence || 0.8,
        suggested_actions: (queryResult.response_data as any)?.suggested_actions,
        follow_up_questions: (queryResult.response_data as any)?.follow_up_questions
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['query-history', communityId, user?.id] });
    },
    onError: (error) => {
      console.error('Error processing query:', error);
      toast.error('Failed to process your question. Please try again.');
    }
  });

  // Rate response mutation
  const rateResponseMutation = useMutation({
    mutationFn: ({ queryId, rating }: { queryId: string, rating: number }) => 
      leaderboardService.rateResponse(queryId, rating),
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
      queryClient.invalidateQueries({ queryKey: ['query-history', communityId, user?.id] });
    },
    onError: (error) => {
      console.error('Error rating response:', error);
      toast.error('Failed to submit rating');
    }
  });

  const askQuestion = useCallback(async (question: string): Promise<ProcessLeaderboardQueryResponse> => {
    return processQueryMutation.mutateAsync(question);
  }, [processQueryMutation]);

  const rateResponse = useCallback((queryId: string, rating: number) => {
    rateResponseMutation.mutate({ queryId, rating });
  }, [rateResponseMutation]);

  return {
    askQuestion,
    queryHistory,
    isLoading: isLoading || processQueryMutation.isPending || rateResponseMutation.isPending,
    error: error || processQueryMutation.error || rateResponseMutation.error,
    rateResponse
  };
}

/**
 * Hook for recording user activities
 */
export function useActivityRecorder(communityId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const recordActivityMutation = useMutation({
    mutationFn: async ({ 
      activityType, 
      activityData, 
      content 
    }: { 
      activityType: ActivityType;
      activityData: Record<string, any>;
      content?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      return leaderboardService.recordActivity(
        communityId,
        user.id,
        activityType,
        activityData,
        content
      );
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['leaderboard', communityId] });
      queryClient.invalidateQueries({ queryKey: ['user-position', communityId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-feedback', communityId, user?.id] });
    },
    onError: (error) => {
      console.error('Error recording activity:', error);
      // Don't show toast for activity recording errors as they happen in background
    }
  });

  const recordActivity = useCallback((
    activityType: ActivityType,
    activityData: Record<string, any> = {},
    content?: string
  ) => {
    recordActivityMutation.mutate({ activityType, activityData, content });
  }, [recordActivityMutation]);

  return {
    recordActivity,
    isRecording: recordActivityMutation.isPending
  };
}

/**
 * Hook for generating AI feedback
 */
export function useFeedbackGenerator(communityId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const generateFeedbackMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return leaderboardService.generateUserFeedback(communityId, user.id);
    },
    onSuccess: (feedback) => {
      if (feedback) {
        queryClient.invalidateQueries({ queryKey: ['user-feedback', communityId, user?.id] });
        toast.success('New personalized feedback generated!');
      }
    },
    onError: (error) => {
      console.error('Error generating feedback:', error);
      toast.error('Failed to generate feedback');
    }
  });

  const generateFeedback = useCallback(() => {
    generateFeedbackMutation.mutate();
  }, [generateFeedbackMutation]);

  return {
    generateFeedback,
    isGenerating: generateFeedbackMutation.isPending
  };
}

/**
 * Hook for leaderboard settings management
 */
export function useLeaderboardSettings(communityId: string) {
  const queryClient = useQueryClient();

  const {
    data: settings,
    isLoading
  } = useQuery({
    queryKey: ['leaderboard-settings', communityId],
    queryFn: () => leaderboardService.getLeaderboardSettings(communityId),
    enabled: !!communityId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: any) => 
      leaderboardService.updateLeaderboardSettings(communityId, newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard-settings', communityId] });
      toast.success('Leaderboard settings updated');
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  });

  const updateSettings = useCallback((newSettings: any) => {
    updateSettingsMutation.mutate(newSettings);
  }, [updateSettingsMutation]);

  return {
    settings,
    updateSettings,
    isLoading: isLoading || updateSettingsMutation.isPending
  };
}

// Helper functions
function identifyStrengths(scoreBreakdown: any): string[] {
  const scores = {
    'Chat Discussions': scoreBreakdown.chat_score,
    'Video Call Participation': scoreBreakdown.video_call_score,
    'Community Engagement': scoreBreakdown.participation_score,
    'Content Quality': scoreBreakdown.quality_multiplier * 50
  };

  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([key]) => key);
}

function identifyWeaknesses(scoreBreakdown: any): string[] {
  const scores = {
    'Chat Discussions': scoreBreakdown.chat_score,
    'Video Call Participation': scoreBreakdown.video_call_score,
    'Community Engagement': scoreBreakdown.participation_score,
    'Content Quality': scoreBreakdown.quality_multiplier * 50
  };

  return Object.entries(scores)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 2)
    .map(([key]) => key);
}
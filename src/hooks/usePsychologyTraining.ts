import { useState, useEffect, useCallback } from 'react';
import { PsychologyTrainingService } from '@/services/psychologyTrainingService';
import {
  PsychologyProfile,
  TrainingModule,
  UserTrainingProgress,
  TrainingAnalytics,
  AnalyzeConversationRequest,
  AnalyzeConversationResponse,
  AssessmentResult,
  TrainingCategory,
  TrainingDataset
} from '@/types/psychology-training';

/**
 * Hook for managing user psychology profiles
 */
export const usePsychologyProfile = (userId: string, communityId: string) => {
  const [profile, setProfile] = useState<PsychologyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const psychologyService = PsychologyTrainingService.getInstance();

  const generateProfile = useCallback(async (conversationHistory: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const newProfile = await psychologyService.generatePsychologyProfile(userId, conversationHistory);
      newProfile.community_id = communityId;
      setProfile(newProfile);
      return newProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate psychology profile';
      setError(errorMessage);
      console.error('[Psychology Profile] Error generating profile:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId, communityId, psychologyService]);

  const updateProfile = useCallback(async (updates: Partial<PsychologyProfile>) => {
    if (!profile) return;

    setIsLoading(true);
    try {
      const updatedProfile = {
        ...profile,
        ...updates,
        updated_at: new Date().toISOString()
      };
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  // Load profile on mount (in real implementation, would fetch from database)
  useEffect(() => {
    if (userId && communityId && !profile) {
      // For demo purposes, generate a default profile
      generateProfile(['Hello, I enjoy helping others and learning new things.']);
    }
  }, [userId, communityId, profile, generateProfile]);

  return {
    profile,
    isLoading,
    error,
    generateProfile,
    updateProfile
  };
};

/**
 * Hook for conversation analysis
 */
export const useConversationAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<AnalyzeConversationResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const psychologyService = PsychologyTrainingService.getInstance();

  const analyzeConversation = useCallback(async (request: AnalyzeConversationRequest): Promise<AnalyzeConversationResponse> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('[Conversation Analysis] Starting analysis:', {
        textLength: request.conversation_text.length,
        analysisFocus: request.analysis_focus
      });

      const response = await psychologyService.analyzeConversation(request);
      
      setAnalysisHistory(prev => [response, ...prev.slice(0, 9)]); // Keep last 10 analyses
      
      console.log('[Conversation Analysis] Analysis completed:', {
        quality: response.overall_assessment.conversation_quality,
        effectivenessScore: response.overall_assessment.effectiveness_score
      });

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze conversation';
      setError(errorMessage);
      console.error('[Conversation Analysis] Error:', err);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, [psychologyService]);

  const clearHistory = useCallback(() => {
    setAnalysisHistory([]);
  }, []);

  return {
    analyzeConversation,
    isAnalyzing,
    analysisHistory,
    error,
    clearHistory
  };
};

/**
 * Hook for managing training modules
 */
export const useTrainingModules = (profile?: PsychologyProfile) => {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const psychologyService = PsychologyTrainingService.getInstance();

  const loadPersonalizedModules = useCallback(async () => {
    if (!profile) return;

    setIsLoading(true);
    setError(null);

    try {
      const personalizedModules = await psychologyService.getPersonalizedTrainingModules(profile);
      setModules(personalizedModules);
      return personalizedModules;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load training modules';
      setError(errorMessage);
      console.error('[Training Modules] Error loading modules:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [profile, psychologyService]);

  const getModulesByCategory = useCallback((category: TrainingCategory) => {
    return modules.filter(module => module.category === category);
  }, [modules]);

  const getModuleById = useCallback((moduleId: string) => {
    return modules.find(module => module.id === moduleId);
  }, [modules]);

  // Load modules when profile changes
  useEffect(() => {
    if (profile) {
      loadPersonalizedModules();
    }
  }, [profile, loadPersonalizedModules]);

  return {
    modules,
    isLoading,
    error,
    loadPersonalizedModules,
    getModulesByCategory,
    getModuleById
  };
};

/**
 * Hook for training progress tracking
 */
export const useTrainingProgress = (userId: string, communityId: string) => {
  const [progress, setProgress] = useState<UserTrainingProgress[]>([]);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startModule = useCallback(async (moduleId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const newProgress: UserTrainingProgress = {
        id: `progress_${moduleId}_${userId}_${Date.now()}`,
        user_id: userId,
        community_id: communityId,
        module_id: moduleId,
        status: 'in_progress',
        progress_percentage: 0,
        completed_exercises: [],
        skill_improvements: [],
        assessment_results: [],
        time_spent_minutes: 0,
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      };

      setProgress(prev => [newProgress, ...prev.filter(p => p.module_id !== moduleId)]);
      setCurrentModule(moduleId);

      console.log('[Training Progress] Started module:', moduleId);
      return newProgress;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start training module';
      setError(errorMessage);
      console.error('[Training Progress] Error starting module:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId, communityId]);

  const updateProgress = useCallback(async (moduleId: string, updates: Partial<UserTrainingProgress>) => {
    try {
      setProgress(prev => prev.map(p => 
        p.module_id === moduleId 
          ? { ...p, ...updates, last_activity_at: new Date().toISOString() }
          : p
      ));
    } catch (err) {
      console.error('[Training Progress] Error updating progress:', err);
    }
  }, []);

  const completeExercise = useCallback(async (moduleId: string, exerciseId: string, assessment: AssessmentResult) => {
    setIsLoading(true);
    try {
      setProgress(prev => prev.map(p => {
        if (p.module_id !== moduleId) return p;

        const completedExercises = [...p.completed_exercises, exerciseId];
        const assessmentResults = [...p.assessment_results, assessment];
        
        // Calculate new progress percentage
        const totalExercises = 5; // Mock - would come from module data
        const progressPercentage = (completedExercises.length / totalExercises) * 100;
        
        const updatedProgress: UserTrainingProgress = {
          ...p,
          completed_exercises: completedExercises,
          assessment_results: assessmentResults,
          progress_percentage: progressPercentage,
          status: progressPercentage >= 100 ? 'completed' : 'in_progress',
          completed_at: progressPercentage >= 100 ? new Date().toISOString() : undefined,
          last_activity_at: new Date().toISOString()
        };

        return updatedProgress;
      }));

      console.log('[Training Progress] Completed exercise:', exerciseId, 'for module:', moduleId);
    } catch (err) {
      console.error('[Training Progress] Error completing exercise:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getProgressForModule = useCallback((moduleId: string) => {
    return progress.find(p => p.module_id === moduleId);
  }, [progress]);

  const getCompletedModules = useCallback(() => {
    return progress.filter(p => p.status === 'completed');
  }, [progress]);

  const getInProgressModules = useCallback(() => {
    return progress.filter(p => p.status === 'in_progress');
  }, [progress]);

  return {
    progress,
    currentModule,
    isLoading,
    error,
    startModule,
    updateProgress,
    completeExercise,
    getProgressForModule,
    getCompletedModules,
    getInProgressModules
  };
};

/**
 * Hook for training analytics
 */
export const useTrainingAnalytics = (userId: string, communityId: string) => {
  const [analytics, setAnalytics] = useState<TrainingAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const psychologyService = PsychologyTrainingService.getInstance();

  const generateAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const trainingAnalytics = await psychologyService.generateTrainingAnalytics(userId, communityId);
      setAnalytics(trainingAnalytics);
      
      console.log('[Training Analytics] Generated analytics:', {
        skillLevel: trainingAnalytics.overall_progress.skill_level,
        modulesCompleted: trainingAnalytics.overall_progress.modules_completed,
        averageScore: trainingAnalytics.overall_progress.average_score
      });

      return trainingAnalytics;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate training analytics';
      setError(errorMessage);
      console.error('[Training Analytics] Error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId, communityId, psychologyService]);

  const refreshAnalytics = useCallback(() => {
    return generateAnalytics();
  }, [generateAnalytics]);

  // Generate analytics on mount
  useEffect(() => {
    if (userId && communityId) {
      generateAnalytics();
    }
  }, [userId, communityId, generateAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    generateAnalytics,
    refreshAnalytics
  };
};

/**
 * Hook for training exercise evaluation
 */
export const useExerciseEvaluation = () => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationHistory, setEvaluationHistory] = useState<AssessmentResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const psychologyService = PsychologyTrainingService.getInstance();

  const evaluateResponse = useCallback(async (
    exerciseId: string,
    userResponse: any,
    expectedOutcomes: string[],
    profile?: PsychologyProfile
  ): Promise<AssessmentResult> => {
    setIsEvaluating(true);
    setError(null);

    try {
      console.log('[Exercise Evaluation] Evaluating response for exercise:', exerciseId);

      const assessment = await psychologyService.evaluateTrainingResponse(
        exerciseId,
        userResponse,
        expectedOutcomes,
        profile
      );

      setEvaluationHistory(prev => [assessment, ...prev.slice(0, 19)]); // Keep last 20 evaluations

      console.log('[Exercise Evaluation] Assessment completed:', {
        passed: assessment.passed,
        score: assessment.final_score,
        feedback: assessment.feedback.substring(0, 50) + '...'
      });

      return assessment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to evaluate exercise response';
      setError(errorMessage);
      console.error('[Exercise Evaluation] Error:', err);
      throw err;
    } finally {
      setIsEvaluating(false);
    }
  }, [psychologyService]);

  const getEvaluationsByExercise = useCallback((exerciseId: string) => {
    return evaluationHistory.filter(evaluation => evaluation.exercise_id === exerciseId);
  }, [evaluationHistory]);

  const clearEvaluationHistory = useCallback(() => {
    setEvaluationHistory([]);
  }, []);

  return {
    evaluateResponse,
    isEvaluating,
    evaluationHistory,
    error,
    getEvaluationsByExercise,
    clearEvaluationHistory
  };
};

/**
 * Hook for training datasets
 */
export const useTrainingDatasets = (category?: TrainingCategory) => {
  const [datasets, setDatasets] = useState<TrainingDataset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const psychologyService = PsychologyTrainingService.getInstance();

  const loadDatasets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const trainingDatasets = await psychologyService.getTrainingDatasets(category);
      setDatasets(trainingDatasets);
      return trainingDatasets;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load training datasets';
      setError(errorMessage);
      console.error('[Training Datasets] Error loading datasets:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [category, psychologyService]);

  const getDatasetById = useCallback((datasetId: string) => {
    return datasets.find(dataset => dataset.id === datasetId);
  }, [datasets]);

  const getDatasetsByCategory = useCallback((cat: TrainingCategory) => {
    return datasets.filter(dataset => dataset.category === cat);
  }, [datasets]);

  // Load datasets on mount or when category changes
  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  return {
    datasets,
    isLoading,
    error,
    loadDatasets,
    getDatasetById,
    getDatasetsByCategory
  };
};

/**
 * Comprehensive hook that combines all psychology training functionality
 */
export const usePsychologyTraining = (userId: string, communityId: string) => {
  const profile = usePsychologyProfile(userId, communityId);
  const conversationAnalysis = useConversationAnalysis();
  const trainingModules = useTrainingModules(profile.profile || undefined);
  const trainingProgress = useTrainingProgress(userId, communityId);
  const trainingAnalytics = useTrainingAnalytics(userId, communityId);
  const exerciseEvaluation = useExerciseEvaluation();
  const trainingDatasets = useTrainingDatasets();

  const isLoading = profile.isLoading || 
                   conversationAnalysis.isAnalyzing || 
                   trainingModules.isLoading || 
                   trainingProgress.isLoading || 
                   trainingAnalytics.isLoading || 
                   exerciseEvaluation.isEvaluating;

  const hasError = !!(profile.error || 
                     conversationAnalysis.error || 
                     trainingModules.error || 
                     trainingProgress.error || 
                     trainingAnalytics.error || 
                     exerciseEvaluation.error);

  const errors = [
    profile.error,
    conversationAnalysis.error,
    trainingModules.error,
    trainingProgress.error,
    trainingAnalytics.error,
    exerciseEvaluation.error
  ].filter(Boolean);

  return {
    // User profile
    profile: profile.profile,
    generateProfile: profile.generateProfile,
    updateProfile: profile.updateProfile,

    // Conversation analysis
    analyzeConversation: conversationAnalysis.analyzeConversation,
    analysisHistory: conversationAnalysis.analysisHistory,

    // Training modules
    modules: trainingModules.modules,
    getModulesByCategory: trainingModules.getModulesByCategory,
    getModuleById: trainingModules.getModuleById,

    // Training progress
    progress: trainingProgress.progress,
    currentModule: trainingProgress.currentModule,
    startModule: trainingProgress.startModule,
    completeExercise: trainingProgress.completeExercise,
    getProgressForModule: trainingProgress.getProgressForModule,

    // Training analytics
    analytics: trainingAnalytics.analytics,
    refreshAnalytics: trainingAnalytics.refreshAnalytics,

    // Exercise evaluation
    evaluateResponse: exerciseEvaluation.evaluateResponse,
    evaluationHistory: exerciseEvaluation.evaluationHistory,

    // Training datasets
    datasets: trainingDatasets.datasets,

    // Global state
    isLoading,
    hasError,
    errors
  };
};
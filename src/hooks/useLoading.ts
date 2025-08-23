import { useCallback } from 'react';
import { useLoadingContext } from '@/contexts/LoadingContext';

interface UseLoadingReturn {
  isLoading: boolean;
  message: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  setLoadingMessage: (message: string) => void;
  // New features
  showLoadingWithOptions: (options: {
    message?: string;
    variant?: 'default' | 'splash' | 'minimal' | 'progress';
    subMessage?: string;
    showProgress?: boolean;
    progress?: number;
  }) => void;
  updateProgress: (progress: number, message?: string, subMessage?: string) => void;
}

/**
 * Custom hook for managing loading states throughout the application
 * Now uses the global LoadingContext for state management
 * @param initialMessage - Initial loading message (for backward compatibility)
 * @returns Object with loading state and control functions
 */
export const useLoading = (initialMessage: string = "Loading..."): UseLoadingReturn => {
  const { loadingState, showLoading: contextShowLoading, hideLoading: contextHideLoading, updateProgress: contextUpdateProgress, setLoadingMessage: contextSetLoadingMessage } = useLoadingContext();

  const showLoading = useCallback((newMessage?: string) => {
    contextShowLoading({
      message: newMessage || initialMessage,
      variant: 'default',
    });
  }, [contextShowLoading, initialMessage]);

  const hideLoading = useCallback(() => {
    contextHideLoading();
  }, [contextHideLoading]);

  const setLoadingMessage = useCallback((newMessage: string) => {
    contextSetLoadingMessage(newMessage);
  }, [contextSetLoadingMessage]);

  const showLoadingWithOptions = useCallback((options: {
    message?: string;
    variant?: 'default' | 'splash' | 'minimal' | 'progress';
    subMessage?: string;
    showProgress?: boolean;
    progress?: number;
  }) => {
    contextShowLoading({
      message: options.message || initialMessage,
      variant: options.variant || 'default',
      subMessage: options.subMessage,
      showProgress: options.showProgress || false,
      progress: options.progress || 0,
    });
  }, [contextShowLoading, initialMessage]);

  const updateProgress = useCallback((progress: number, message?: string, subMessage?: string) => {
    contextUpdateProgress(progress, message, subMessage);
  }, [contextUpdateProgress]);

  return {
    isLoading: loadingState.isLoading,
    message: loadingState.message,
    showLoading,
    hideLoading,
    setLoadingMessage,
    showLoadingWithOptions,
    updateProgress,
  };
};

export default useLoading;
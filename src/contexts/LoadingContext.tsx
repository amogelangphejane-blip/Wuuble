import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingState {
  isLoading: boolean;
  message: string;
  variant: 'default' | 'splash' | 'minimal' | 'progress';
  progress: number;
  showProgress: boolean;
  subMessage?: string;
}

interface LoadingContextType {
  loadingState: LoadingState;
  showLoading: (options?: Partial<LoadingState>) => void;
  hideLoading: () => void;
  updateProgress: (progress: number, message?: string, subMessage?: string) => void;
  setLoadingMessage: (message: string, subMessage?: string) => void;
}

const defaultLoadingState: LoadingState = {
  isLoading: false,
  message: 'Loading...',
  variant: 'default',
  progress: 0,
  showProgress: false,
  subMessage: undefined,
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingState, setLoadingState] = useState<LoadingState>(defaultLoadingState);

  const showLoading = useCallback((options: Partial<LoadingState> = {}) => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      ...options,
    }));
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
    }));
  }, []);

  const updateProgress = useCallback((progress: number, message?: string, subMessage?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
      ...(message && { message }),
      ...(subMessage && { subMessage }),
      variant: prev.variant === 'default' ? 'progress' : prev.variant,
      showProgress: true,
    }));
  }, []);

  const setLoadingMessage = useCallback((message: string, subMessage?: string) => {
    setLoadingState(prev => ({
      ...prev,
      message,
      ...(subMessage && { subMessage }),
    }));
  }, []);

  const contextValue: LoadingContextType = {
    loadingState,
    showLoading,
    hideLoading,
    updateProgress,
    setLoadingMessage,
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoadingContext = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
};

export default LoadingContext;
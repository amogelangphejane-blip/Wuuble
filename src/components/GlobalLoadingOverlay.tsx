import React from 'react';
import { useLoadingContext } from '@/contexts/LoadingContext';
import LoadingPage from './LoadingPage';

const GlobalLoadingOverlay: React.FC = () => {
  const { loadingState } = useLoadingContext();

  if (!loadingState.isLoading) {
    return null;
  }

  return (
    <LoadingPage
      message={loadingState.message}
      variant={loadingState.variant}
      progress={loadingState.progress}
      showProgress={loadingState.showProgress}
      subMessage={loadingState.subMessage}
    />
  );
};

export default GlobalLoadingOverlay;
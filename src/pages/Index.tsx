import { useState, useEffect } from 'react';
import LandingPage from '@/components/LandingPage';
import LoadingPage from '@/components/LoadingPage';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showTransition, setShowTransition] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Failsafe: If loading takes too long, show error and skip to main content
  useEffect(() => {
    const failsafeTimer = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Loading took too long, skipping to main content');
        setLoadingError('Loading took longer than expected');
        setIsLoading(false);
      }
    }, 10000); // 10 second failsafe

    return () => clearTimeout(failsafeTimer);
  }, [isLoading]);

  const handleLoadingComplete = () => {
    console.log('✅ Loading completed normally');
    setShowTransition(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 300); // Brief transition delay
  };

  console.log('🎯 Index component rendering, isLoading:', isLoading, 'error:', loadingError);

  if (isLoading) {
    return (
      <div className={`transition-opacity duration-300 ${showTransition ? 'opacity-0' : 'opacity-100'}`}>
        <LoadingPage onLoadingComplete={handleLoadingComplete} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {loadingError && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '0.875rem',
          zIndex: 1000
        }}>
          {loadingError}
        </div>
      )}
      <LandingPage />
    </div>
  );
};

export default Index;

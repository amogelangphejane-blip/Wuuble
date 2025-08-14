import { useState } from 'react';
import LandingPage from '@/components/LandingPage';
import LoadingPage from '@/components/LoadingPage';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showTransition, setShowTransition] = useState(false);

  const handleLoadingComplete = () => {
    setShowTransition(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 300); // Brief transition delay
  };

  if (isLoading) {
    return (
      <div className={`transition-opacity duration-300 ${showTransition ? 'opacity-0' : 'opacity-100'}`}>
        <LoadingPage onLoadingComplete={handleLoadingComplete} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <LandingPage />
    </div>
  );
};

export default Index;

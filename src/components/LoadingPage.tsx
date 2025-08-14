import { useEffect, useState } from 'react';

const LoadingPage = ({ onLoadingComplete }: { onLoadingComplete: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onLoadingComplete, 500); // Small delay before transitioning
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onLoadingComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Wobble Text */}
        <h1 className="text-8xl font-bold text-white mb-8 animate-wobble">
          wobble
        </h1>
        
        {/* Loading Bar */}
        <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden mx-auto mb-4">
          <div 
            className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Loading Text */}
        <p className="text-white/80 text-lg animate-pulse">
          Loading your experience...
        </p>
      </div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-pink-500/10 rounded-full animate-ping" />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-violet-500/10 rounded-full animate-ping animation-delay-1000" />
        <div className="absolute top-3/4 left-1/3 w-16 h-16 bg-blue-500/10 rounded-full animate-ping animation-delay-2000" />
      </div>
    </div>
  );
};

export default LoadingPage;
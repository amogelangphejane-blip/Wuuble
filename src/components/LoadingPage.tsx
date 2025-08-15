import { useEffect, useState } from 'react';
import { Users, Sparkles, Crown, Diamond } from 'lucide-react';

const LoadingPage = ({ onLoadingComplete }: { onLoadingComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  
  const loadingPhases = [
    "Connecting elite minds...",
    "Building premium networks...",
    "Curating exclusive experiences...",
    "Preparing your sanctuary..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onLoadingComplete, 800); // Longer delay for smooth transition
          return 100;
        }
        
        // Update phase based on progress
        const newPhase = Math.floor(prev / 25);
        if (newPhase !== currentPhase && newPhase < loadingPhases.length) {
          setCurrentPhase(newPhase);
        }
        
        return prev + 1.5; // Slightly slower for premium feel
      });
    }, 60);

    return () => clearInterval(interval);
  }, [onLoadingComplete, currentPhase]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Premium Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-3xl animate-pulse animation-delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      <div className="text-center z-10 max-w-md mx-auto px-6">
        {/* Elite Logo Section */}
        <div className="mb-8 md:mb-12 relative">
          <div className="relative inline-flex items-center justify-center">
            {/* Premium Logo Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-30 animate-network-glow" />
            
            {/* Main Logo */}
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4 md:p-6 animate-connect-pulse">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Wuuble
              </h1>
            </div>
          </div>
          
          {/* Elite Badge */}
          <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1.5 md:p-2 animate-bounce">
            <Crown className="w-3 h-3 md:w-4 md:h-4 text-white" />
          </div>
        </div>

        {/* Connection Network Visualization */}
        <div className="mb-6 md:mb-8 relative h-20 md:h-24 flex items-center justify-center">
          <svg className="w-full h-full max-w-sm md:max-w-md" viewBox="0 0 300 100">
            {/* Network Nodes */}
            <circle cx="50" cy="50" r="6" fill="url(#nodeGradient)" className="animate-connect-pulse md:r-8" />
            <circle cx="150" cy="30" r="4" fill="url(#nodeGradient)" className="animate-connect-pulse animation-delay-500 md:r-6" />
            <circle cx="250" cy="50" r="6" fill="url(#nodeGradient)" className="animate-connect-pulse animation-delay-1000 md:r-8" />
            <circle cx="100" cy="70" r="3" fill="url(#nodeGradient)" className="animate-connect-pulse animation-delay-1500 md:r-5" />
            <circle cx="200" cy="75" r="4" fill="url(#nodeGradient)" className="animate-connect-pulse animation-delay-2000 md:r-6" />
            
            {/* Connection Lines */}
            <line x1="50" y1="50" x2="150" y2="30" stroke="url(#lineGradient)" strokeWidth="1.5" className="animate-connect-line md:stroke-2" opacity="0.7" />
            <line x1="150" y1="30" x2="250" y2="50" stroke="url(#lineGradient)" strokeWidth="1.5" className="animate-connect-line animation-delay-500 md:stroke-2" opacity="0.7" />
            <line x1="50" y1="50" x2="100" y2="70" stroke="url(#lineGradient)" strokeWidth="1.5" className="animate-connect-line animation-delay-1000 md:stroke-2" opacity="0.7" />
            <line x1="100" y1="70" x2="200" y2="75" stroke="url(#lineGradient)" strokeWidth="1.5" className="animate-connect-line animation-delay-1500 md:stroke-2" opacity="0.7" />
            <line x1="200" y1="75" x2="250" y2="50" stroke="url(#lineGradient)" strokeWidth="1.5" className="animate-connect-line animation-delay-2000 md:stroke-2" opacity="0.7" />
            
            {/* Gradients Definition */}
            <defs>
              <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity="1" />
                <stop offset="100%" stopColor="#EC4899" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Premium Loading Bar */}
        <div className="mb-4 md:mb-6">
          <div className="w-64 md:w-80 h-2 md:h-3 bg-white/10 backdrop-blur-sm rounded-full overflow-hidden mx-auto border border-white/20">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          
          {/* Progress Percentage */}
          <div className="mt-2 md:mt-3 text-white/60 text-xs md:text-sm font-medium">
            {Math.round(progress)}%
          </div>
        </div>
        
        {/* Dynamic Loading Text */}
        <div className="mb-3 md:mb-4 h-6 md:h-8 flex items-center justify-center">
          <p className="text-white/90 text-base md:text-lg font-medium animate-fade-in-up flex items-center gap-2">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-purple-400 animate-spin" />
            <span className="hidden sm:inline">{loadingPhases[currentPhase]}</span>
            <span className="sm:hidden">Loading...</span>
          </p>
        </div>

        {/* Elite Features Preview */}
        <div className="flex justify-center gap-2 md:gap-4 text-white/40 text-xs">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span className="hidden sm:inline">Elite Network</span>
          </div>
          <div className="flex items-center gap-1">
            <Diamond className="w-3 h-3" />
            <span className="hidden sm:inline">Premium Experience</span>
          </div>
          <div className="flex items-center gap-1">
            <Crown className="w-3 h-3" />
            <span className="hidden sm:inline">Exclusive Access</span>
          </div>
        </div>
      </div>

      {/* Floating Premium Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-40" />
        <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-ping animation-delay-1000 opacity-40" />
        <div className="absolute top-2/3 left-1/6 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping animation-delay-2000 opacity-40" />
        <div className="absolute top-1/6 right-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-ping animation-delay-3000 opacity-40" />
      </div>
    </div>
  );
};

export default LoadingPage;
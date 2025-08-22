import React from 'react';

const SimpleLoadingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        {/* Simple Wuuble logo/text without animations */}
        <div className="mb-12">
          <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            Wuuble
          </h1>
        </div>

        {/* Simple loading spinner without framer-motion */}
        <div className="mb-8">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 border-r-purple-500 rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Simple loading text */}
        <div className="text-white/70 text-lg font-medium">
          <span className="animate-pulse">
            Loading your experience...
          </span>
        </div>

        {/* Simple progress bar */}
        <div className="mt-8 mx-auto max-w-xs">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full w-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleLoadingPage;
import React, { useState, useEffect } from 'react';
import LoadingPage from '../components/LoadingPage';
import { Button } from '../components/ui/button';

const LoadingDemo: React.FC = () => {
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Auto-hide loading after 4 seconds for demo purposes
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [showLoading]);

  if (showLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="text-white">
          <h1 className="text-4xl font-bold mb-4">Welcome to Wuuble!</h1>
          <p className="text-lg text-white/70 mb-8">Loading complete - ready to explore</p>
        </div>
        
        <Button
          onClick={() => setShowLoading(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          Show Loading Page Again
        </Button>
        
        <div className="mt-12 text-white/50 text-sm">
          <p>This is a demo of the modern loading page component</p>
          <p>Click the button above to see the loading animation again</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingDemo;
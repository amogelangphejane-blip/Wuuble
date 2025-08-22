import React, { useState, useEffect } from 'react';
import LoadingPage from '../components/LoadingPage';
import SimpleLoadingPage from '../components/SimpleLoadingPage';
import { Button } from '../components/ui/button';

const LoadingDemo: React.FC = () => {
  const [showLoading, setShowLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useSimpleVersion, setUseSimpleVersion] = useState(false);

  useEffect(() => {
    console.log('🎯 LoadingDemo component mounted');
    
    // Auto-hide loading after 4 seconds for demo purposes
    const timer = setTimeout(() => {
      console.log('⏰ Auto-hiding loading page after 4 seconds');
      setShowLoading(false);
    }, 4000);

    return () => {
      console.log('🧹 LoadingDemo cleanup');
      clearTimeout(timer);
    };
  }, [showLoading]);

  // Error boundary-like behavior
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 JavaScript error detected:', event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-red-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Loading Page Error</h1>
          <p className="text-lg mb-8">An error occurred while loading the page</p>
          <Button onClick={() => {
            setHasError(false);
            setShowLoading(true);
          }}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (showLoading) {
    try {
      console.log('🎨 Rendering loading page, useSimpleVersion:', useSimpleVersion);
      return useSimpleVersion ? <SimpleLoadingPage /> : <LoadingPage />;
    } catch (error) {
      console.error('🚨 Error rendering loading page:', error);
      setHasError(true);
      return null;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="text-white">
          <h1 className="text-4xl font-bold mb-4">Welcome to Wuuble!</h1>
          <p className="text-lg text-white/70 mb-8">Loading complete - ready to explore</p>
        </div>
        
        <div className="space-x-4">
          <Button
            onClick={() => {
              console.log('🔄 Showing loading page again (animated version)');
              setUseSimpleVersion(false);
              setShowLoading(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Show Animated Loading
          </Button>
          
          <Button
            onClick={() => {
              console.log('🔄 Showing loading page again (simple version)');
              setUseSimpleVersion(true);
              setShowLoading(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Show Simple Loading
          </Button>
        </div>
        
        <div className="mt-12 text-white/50 text-sm">
          <p>This is a demo of the loading page component</p>
          <p>Try both versions to see which one works</p>
          <p>Check the browser console for any error messages</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingDemo;
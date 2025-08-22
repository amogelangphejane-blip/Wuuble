import React, { useEffect } from 'react';
import LoadingPage from '@/components/LoadingPage';
import { Button } from '@/components/ui/button';
import { useLoading } from '@/hooks/useLoading';

const LoadingDemo: React.FC = () => {
  const { isLoading, message, showLoading, hideLoading } = useLoading("Preparing your Wuuble experience...");

  // Auto-hide loading after 5 seconds for demo
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        hideLoading();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, hideLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-bold text-white mb-8">
            Wuuble Loading Page Demo
          </h1>
          
          <div className="space-y-4">
            <Button 
              onClick={() => showLoading()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Show Loading Page'}
            </Button>
            
            <p className="text-gray-300">
              Click the button above to see the modern loading page with Wuuble branding
            </p>
          </div>
          
          <div className="mt-12 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-semibold text-white mb-4">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <h3 className="text-purple-400 font-medium">Visual Elements</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Gradient background with animated elements</li>
                  <li>• Large "Wuuble" text with gradient colors</li>
                  <li>• Glowing text effect</li>
                  <li>• Dual spinning loading spinners</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-blue-400 font-medium">Animations</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Pulsing background orbs</li>
                  <li>• Bouncing loading dots</li>
                  <li>• Staggered animation delays</li>
                  <li>• Smooth transitions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <LoadingPage message={message} />
      )}
    </div>
  );
};

export default LoadingDemo;
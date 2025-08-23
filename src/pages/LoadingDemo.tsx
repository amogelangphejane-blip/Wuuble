import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLoadingContext } from '@/contexts/LoadingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSystemExample from '@/components/LoadingSystemExample';

const LoadingDemo: React.FC = () => {
  const { loadingState, showLoading, hideLoading, updateProgress } = useLoadingContext();
  const [progressDemo, setProgressDemo] = useState(false);

  // Auto-hide loading after 5 seconds for demo
  useEffect(() => {
    if (loadingState.isLoading && !progressDemo) {
      const timer = setTimeout(() => {
        hideLoading();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [loadingState.isLoading, hideLoading, progressDemo]);

  // Progress demo effect
  useEffect(() => {
    if (progressDemo && loadingState.isLoading) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          updateProgress(progress, "Complete!", "Loading finished successfully");
          setTimeout(() => {
            hideLoading();
            setProgressDemo(false);
          }, 1000);
          clearInterval(interval);
        } else {
          const messages = [
            "Initializing application...",
            "Loading user preferences...",
            "Connecting to servers...",
            "Preparing your experience...",
            "Almost ready..."
          ];
          const subMessages = [
            "Setting up your workspace",
            "Syncing data",
            "Optimizing performance",
            "Finalizing setup",
            "Just a moment more..."
          ];
          const messageIndex = Math.floor((progress / 100) * messages.length);
          updateProgress(
            progress, 
            messages[Math.min(messageIndex, messages.length - 1)],
            subMessages[Math.min(messageIndex, subMessages.length - 1)]
          );
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [progressDemo, loadingState.isLoading, updateProgress, hideLoading]);

  const demoVariants = [
    {
      variant: 'default' as const,
      title: 'Default Loading',
      description: 'Full-featured loading page with animations and branding',
      message: 'Loading your Wuuble experience...',
      subMessage: 'Please wait while we prepare everything for you'
    },
    {
      variant: 'splash' as const,
      title: 'Splash Screen',
      description: 'App startup loading screen with full branding',
      message: 'Welcome to Wuuble',
      subMessage: 'Connecting you to amazing experiences'
    },
    {
      variant: 'minimal' as const,
      title: 'Minimal Loading',
      description: 'Clean, subtle loading overlay for in-app use',
      message: 'Processing...',
    },
    {
      variant: 'progress' as const,
      title: 'Progress Loading',
      description: 'Loading with progress bar for multi-step processes',
      message: 'Setting up your account...',
      subMessage: 'This may take a few moments'
    }
  ];

  const handleProgressDemo = () => {
    setProgressDemo(true);
    showLoading({
      variant: 'progress',
      message: 'Starting setup...',
      subMessage: 'Initializing...',
      progress: 0,
      showProgress: true
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-8 mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Wuuble Loading System Demo
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Experience our enhanced loading system with multiple variants, progress tracking, and smooth animations.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          {demoVariants.map((demo) => (
            <Card key={demo.variant} className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">{demo.title}</CardTitle>
                <CardDescription className="text-gray-300">
                  {demo.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => showLoading({
                    variant: demo.variant,
                    message: demo.message,
                    subMessage: demo.subMessage,
                  })}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={loadingState.isLoading}
                >
                  {loadingState.isLoading ? 'Loading...' : `Show ${demo.title}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Progress Demo</CardTitle>
              <CardDescription className="text-gray-300">
                Watch a realistic multi-step loading process with progress updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleProgressDemo}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={loadingState.isLoading}
              >
                {loadingState.isLoading ? 'Loading...' : 'Start Progress Demo'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-300">
                Control the loading state manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={hideLoading}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                disabled={!loadingState.isLoading}
              >
                Hide Loading
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Features Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="text-purple-400 font-medium">Visual Variants</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Default - Full branding experience</li>
                  <li>• Splash - App startup screen</li>
                  <li>• Minimal - Subtle overlay</li>
                  <li>• Progress - Multi-step processes</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-blue-400 font-medium">Advanced Features</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Progress tracking (0-100%)</li>
                  <li>• Dynamic message updates</li>
                  <li>• Sub-message support</li>
                  <li>• Global state management</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-green-400 font-medium">Animations</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Pulsing background orbs</li>
                  <li>• Dual spinning loaders</li>
                  <li>• Bouncing dots animation</li>
                  <li>• Smooth progress transitions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Current Status: {loadingState.isLoading ? 'Loading Active' : 'Ready'}
            {loadingState.isLoading && loadingState.showProgress && (
              <span className="ml-2">({Math.round(loadingState.progress)}%)</span>
            )}
          </p>
        </div>

        <div className="mt-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Integration Examples
          </h2>
          <LoadingSystemExample />
        </div>
      </div>
    </div>
  );
};

export default LoadingDemo;
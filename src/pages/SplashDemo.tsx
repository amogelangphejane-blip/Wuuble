import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SplashScreen from '@/components/SplashScreen';

const SplashDemo: React.FC = () => {
  const [showSplash, setShowSplash] = useState(false);
  const [showProgressSplash, setShowProgressSplash] = useState(false);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setShowProgressSplash(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-8 mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Splash Screen Demo
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Experience app initialization with our beautiful splash screens.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Basic Splash Screen</CardTitle>
              <CardDescription className="text-gray-300">
                Simple 3-second splash screen with smooth animations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowSplash(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                disabled={showSplash || showProgressSplash}
              >
                Show Basic Splash
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Progress Splash Screen</CardTitle>
              <CardDescription className="text-gray-300">
                Splash screen with progress bar and dynamic messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowProgressSplash(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={showSplash || showProgressSplash}
              >
                Show Progress Splash
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Splash Screen Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-purple-400 font-medium">Basic Features</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Automatic timing control</li>
                  <li>• Smooth fade animations</li>
                  <li>• Customizable duration</li>
                  <li>• Completion callbacks</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-blue-400 font-medium">Advanced Features</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Progress tracking</li>
                  <li>• Dynamic message updates</li>
                  <li>• Multiple loading phases</li>
                  <li>• Branded experience</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Status: {(showSplash || showProgressSplash) ? 'Splash Active' : 'Ready'}
          </p>
        </div>
      </div>

      {/* Splash Screen Components */}
      {showSplash && (
        <SplashScreen
          duration={3000}
          showProgress={false}
          onComplete={handleSplashComplete}
        />
      )}

      {showProgressSplash && (
        <SplashScreen
          duration={4000}
          showProgress={true}
          onComplete={handleSplashComplete}
        />
      )}
    </div>
  );
};

export default SplashDemo;
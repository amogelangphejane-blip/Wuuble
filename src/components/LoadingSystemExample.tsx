import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoading } from '@/hooks/useLoading';
import { useLoadingContext } from '@/contexts/LoadingContext';

const LoadingSystemExample: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Example 1: Using the legacy hook (backward compatible)
  const { showLoading, hideLoading, updateProgress } = useLoading();
  
  // Example 2: Using the context directly (more control)
  const { showLoading: contextShowLoading } = useLoadingContext();

  // Simulate a multi-step process
  const simulateMultiStepProcess = async () => {
    setIsSimulating(true);
    
    try {
      // Step 1: Initialize
      contextShowLoading({
        variant: 'progress',
        message: 'Initializing process...',
        subMessage: 'Setting up environment',
        showProgress: true,
        progress: 0
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Loading data
      updateProgress(25, 'Loading user data...', 'Fetching from database');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Processing
      updateProgress(50, 'Processing information...', 'Analyzing user preferences');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 4: Optimizing
      updateProgress(75, 'Optimizing experience...', 'Personalizing interface');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 5: Complete
      updateProgress(100, 'Complete!', 'Ready to go');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      hideLoading();
    } catch (error) {
      hideLoading();
    } finally {
      setIsSimulating(false);
    }
  };

  // Simulate API call with minimal loading
  const simulateApiCall = async () => {
    contextShowLoading({
      variant: 'minimal',
      message: 'Saving changes...'
    });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    hideLoading();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Loading System Integration Examples</CardTitle>
          <CardDescription className="text-gray-300">
            Learn how to integrate the loading system into your components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={simulateMultiStepProcess}
              disabled={isSimulating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSimulating ? 'Processing...' : 'Multi-Step Process'}
            </Button>
            
            <Button
              onClick={simulateApiCall}
              className="bg-green-600 hover:bg-green-700"
            >
              Simulate API Call
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Code Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-purple-400 font-medium mb-2">1. Basic Usage (Legacy Hook)</h4>
              <pre className="bg-gray-900 p-4 rounded text-sm text-gray-300 overflow-x-auto">
{`import { useLoading } from '@/hooks/useLoading';

const MyComponent = () => {
  const { showLoading, hideLoading } = useLoading();
  
  const handleSubmit = async () => {
    showLoading('Saving...');
    try {
      await api.save();
    } finally {
      hideLoading();
    }
  };
  
  return <button onClick={handleSubmit}>Save</button>;
};`}
              </pre>
            </div>

            <div>
              <h4 className="text-blue-400 font-medium mb-2">2. Advanced Usage (Context)</h4>
              <pre className="bg-gray-900 p-4 rounded text-sm text-gray-300 overflow-x-auto">
{`import { useLoadingContext } from '@/contexts/LoadingContext';

const MyComponent = () => {
  const { showLoading, updateProgress, hideLoading } = useLoadingContext();
  
  const handleProcess = async () => {
    showLoading({
      variant: 'progress',
      message: 'Processing...',
      showProgress: true
    });
    
    for (let i = 0; i <= 100; i += 10) {
      updateProgress(i, \`Step \${i/10 + 1} of 10\`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    hideLoading();
  };
  
  return <button onClick={handleProcess}>Process</button>;
};`}
              </pre>
            </div>

            <div>
              <h4 className="text-green-400 font-medium mb-2">3. Splash Screen Integration</h4>
              <pre className="bg-gray-900 p-4 rounded text-sm text-gray-300 overflow-x-auto">
{`import SplashScreen from '@/components/SplashScreen';

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  
  const handleSplashComplete = () => {
    setIsInitializing(false);
  };
  
  return (
    <>
      {isInitializing && (
        <SplashScreen
          duration={3000}
          showProgress={true}
          onComplete={handleSplashComplete}
        />
      )}
      {!isInitializing && <MainApp />}
    </>
  );
};`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Available Variants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-purple-400 font-medium">default</h4>
              <p className="text-gray-300 text-sm">Full-featured loading with Wuuble branding and animations</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-blue-400 font-medium">splash</h4>
              <p className="text-gray-300 text-sm">App startup screen with welcome messaging</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-green-400 font-medium">minimal</h4>
              <p className="text-gray-300 text-sm">Clean overlay for in-app loading states</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-orange-400 font-medium">progress</h4>
              <p className="text-gray-300 text-sm">Progress bar for multi-step processes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingSystemExample;
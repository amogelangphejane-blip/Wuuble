import React, { useState, useEffect } from 'react';

const LoadingPageDiagnostic: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [showOriginalLoading, setShowOriginalLoading] = useState(false);

  useEffect(() => {
    const results: string[] = [];
    
    // Test 1: Check if React is working
    results.push('✅ React component is rendering');
    
    // Test 2: Check if useState hook works
    results.push('✅ useState hook is working');
    
    // Test 3: Check if useEffect hook works
    results.push('✅ useEffect hook is working');
    
    // Test 4: Check if framer-motion is available
    try {
      require.resolve('framer-motion');
      results.push('✅ framer-motion is available');
    } catch (error) {
      results.push('❌ framer-motion is not available: ' + error);
    }
    
    // Test 5: Check if Tailwind classes are working
    const testElement = document.createElement('div');
    testElement.className = 'bg-purple-500 text-white';
    document.body.appendChild(testElement);
    const computedStyle = window.getComputedStyle(testElement);
    if (computedStyle.backgroundColor) {
      results.push('✅ Tailwind CSS is working');
    } else {
      results.push('❌ Tailwind CSS may not be working');
    }
    document.body.removeChild(testElement);
    
    setDiagnostics(results);
  }, []);

  const testOriginalLoadingPage = () => {
    setShowOriginalLoading(true);
    setTimeout(() => setShowOriginalLoading(false), 5000);
  };

  if (showOriginalLoading) {
    // Import and render the original LoadingPage component
    const LoadingPage = React.lazy(() => import('./LoadingPage'));
    return (
      <React.Suspense fallback={<div>Loading LoadingPage component...</div>}>
        <LoadingPage />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Loading Page Diagnostic</h1>
        
        <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">System Status</h2>
          <div className="space-y-2">
            {diagnostics.map((result, index) => (
              <div key={index} className="text-white/80 font-mono text-sm">
                {result}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Test Original Loading Page</h2>
          <button
            onClick={testOriginalLoadingPage}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Test Original Loading Page (5 seconds)
          </button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Navigation</h2>
          <div className="space-y-2">
            <a 
              href="/loading-demo" 
              className="block text-purple-400 hover:text-purple-300 underline"
            >
              Go to Original Loading Demo
            </a>
            <a 
              href="/" 
              className="block text-purple-400 hover:text-purple-300 underline"
            >
              Go to Main App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPageDiagnostic;
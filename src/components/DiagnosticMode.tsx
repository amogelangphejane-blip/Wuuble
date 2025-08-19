import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DiagnosticMode = () => {
  const [diagnostics, setDiagnostics] = useState<Array<{
    test: string;
    status: 'running' | 'success' | 'error';
    message: string;
    timestamp: string;
  }>>([]);

  const addDiagnostic = (test: string, status: 'running' | 'success' | 'error', message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDiagnostics(prev => [...prev, { test, status, message, timestamp }]);
  };

  useEffect(() => {
    const runDiagnostics = async () => {
      // Test 1: Basic React rendering
      addDiagnostic('React Rendering', 'success', 'React component is rendering successfully');

      // Test 2: LocalStorage
      try {
        localStorage.setItem('diagnostic-test', 'success');
        localStorage.removeItem('diagnostic-test');
        addDiagnostic('LocalStorage', 'success', 'LocalStorage is working');
      } catch (error) {
        addDiagnostic('LocalStorage', 'error', `LocalStorage failed: ${error}`);
      }

      // Test 3: Supabase Client
      try {
        addDiagnostic('Supabase Client', 'running', 'Testing Supabase connection...');
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          addDiagnostic('Supabase Client', 'error', `Supabase error: ${error.message}`);
        } else {
          addDiagnostic('Supabase Client', 'success', 'Supabase client initialized successfully');
        }
      } catch (error) {
        addDiagnostic('Supabase Client', 'error', `Supabase connection failed: ${error}`);
      }

      // Test 4: CSS Loading
      const computedStyle = window.getComputedStyle(document.body);
      if (computedStyle.fontFamily) {
        addDiagnostic('CSS Loading', 'success', 'CSS is loading properly');
      } else {
        addDiagnostic('CSS Loading', 'error', 'CSS may not be loading');
      }

      // Test 5: Network connectivity
      try {
        addDiagnostic('Network', 'running', 'Testing network connectivity...');
        const response = await fetch('https://api.github.com/zen', { mode: 'cors' });
        if (response.ok) {
          addDiagnostic('Network', 'success', 'Network connectivity is working');
        } else {
          addDiagnostic('Network', 'error', 'Network request failed');
        }
      } catch (error) {
        addDiagnostic('Network', 'error', `Network error: ${error}`);
      }

      // Test 6: Environment
      addDiagnostic('Environment', 'success', `Running in ${import.meta.env.MODE} mode`);
    };

    runDiagnostics();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#22c55e';
      case 'error': return '#ef4444';
      case 'running': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'running': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '24px',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          🔍 App Diagnostic Mode
        </h1>
        
        <p style={{ 
          textAlign: 'center', 
          marginBottom: '2rem', 
          opacity: 0.8 
        }}>
          Running comprehensive diagnostics to identify the blank page issue...
        </p>

        <div style={{ marginBottom: '2rem' }}>
          {diagnostics.map((diagnostic, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              margin: '8px 0',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              borderLeft: `4px solid ${getStatusColor(diagnostic.status)}`
            }}>
              <span style={{ fontSize: '1.2rem', marginRight: '12px' }}>
                {getStatusIcon(diagnostic.status)}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600' }}>{diagnostic.test}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{diagnostic.message}</div>
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                {diagnostic.timestamp}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h3 style={{ marginBottom: '12px' }}>🛠️ Quick Fixes to Try:</h3>
          <ol style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>Clear browser cache and hard refresh (Ctrl+Shift+R)</li>
            <li>Check browser console for JavaScript errors</li>
            <li>Verify internet connection</li>
            <li>Try incognito/private browsing mode</li>
            <li>Check if ad blockers are interfering</li>
          </ol>
        </div>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem',
          padding: '16px',
          background: 'rgba(34, 197, 94, 0.1)',
          borderRadius: '8px'
        }}>
          <p><strong>✨ If you can see this page, React is working!</strong></p>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            The issue is likely in the app's loading sequence or authentication flow.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticMode;
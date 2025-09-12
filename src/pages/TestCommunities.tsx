import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const TestCommunities: React.FC = () => {
  console.log('🧪 TestCommunities component rendering');
  
  const { user, loading: authLoading } = useAuth();
  
  console.log('🔍 Auth Debug:', { 
    user: !!user, 
    authLoading, 
    userEmail: user?.email 
  });
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
          <p className="text-sm text-gray-500 mt-2">Debug: authLoading = {String(authLoading)}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Not Authenticated</h2>
          <p className="text-gray-600 mb-6">Please log in to access communities</p>
          <p className="text-sm text-gray-500">Debug: user = {String(!!user)}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Communities Page</h1>
      <p className="text-gray-600 mb-6">This is a minimal test version to isolate the blank page issue.</p>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <ul className="space-y-2">
          <li>✅ Component is rendering</li>
          <li>✅ React imports working</li>
          <li>✅ useAuth hook working</li>
          <li>✅ User authenticated: {user.email}</li>
          <li>✅ CSS classes applying</li>
          <li>✅ No blank page</li>
        </ul>
      </div>
      
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          <strong>Authentication is working! User: {user.email}</strong>
        </p>
        <p className="text-blue-600 mt-2">
          The issue is likely in the original Communities component's dependencies or rendering logic.
        </p>
      </div>
    </div>
  );
};

export default TestCommunities;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LoadingProvider } from '@/contexts/LoadingContext';
import GlobalLoadingOverlay from '@/components/GlobalLoadingOverlay';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

// Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import NewCommunities from '@/pages/NewCommunities';
import NewCommunityDetail from '@/pages/NewCommunityDetail';
import NewCommunityMembers from '@/pages/NewCommunityMembers';
import Messages from '@/pages/Messages';
import ProfileSettings from '@/pages/ProfileSettings';
import NotFound from '@/pages/NotFound';

// Auth wrapper component
import { useAuth, AuthProvider } from '@/hooks/useAuth';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LoadingProvider>
          <TooltipProvider>
            <Router>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Protected routes */}
                  <Route path="/communities" element={
                    <ProtectedRoute>
                      <NewCommunities />
                    </ProtectedRoute>
                  } />
                  <Route path="/community/:id" element={
                    <ProtectedRoute>
                      <NewCommunityDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/community/:id/members" element={
                    <ProtectedRoute>
                      <NewCommunityMembers />
                    </ProtectedRoute>
                  } />
                  <Route path="/messages" element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <ProfileSettings />
                    </ProtectedRoute>
                  } />
                  
                  {/* 404 page */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                
                <Toaster />
                <GlobalLoadingOverlay />
              </div>
            </Router>
          </TooltipProvider>
        </LoadingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
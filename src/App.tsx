import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LoadingProvider } from '@/contexts/LoadingContext';
import GlobalLoadingOverlay from '@/components/GlobalLoadingOverlay';

// Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import EnhancedCommunities from '@/pages/EnhancedCommunities';
import { SimpleCommunities } from '@/components/SimpleCommunities';
import SkoolStyleCommunityDetail from '@/pages/SkoolStyleCommunityDetail';
import CommunityMembersRebuilt from '@/pages/CommunityMembersRebuilt';
import SimpleCommunityCalendar from '@/pages/SimpleCommunityCalendar';
import CommunityClassroom from '@/pages/CommunityClassroom';
import CommunityLeaderboard from '@/pages/CommunityLeaderboard';
import CommunityLinksPage from '@/pages/CommunityLinksPage';
import CommunityDiscussions from '@/pages/CommunityDiscussions';
import CommunityAbout from '@/pages/CommunityAbout';
import CommunitySubscriptions from '@/pages/CommunitySubscriptions';
import CommunityPaymentSettings from '@/pages/CommunityPaymentSettings';
import Messages from '@/pages/Messages';
import ProfileSettings from '@/pages/ProfileSettings';
import PaymentMethods from '@/pages/PaymentMethods';
import { CreatorWallet } from '@/pages/CreatorWallet';
import NotFound from '@/pages/NotFound';

// Auth wrapper component
import { useAuth, AuthProvider } from '@/hooks/useAuth';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
    <AuthProvider>
      <LoadingProvider>
        <TooltipProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
            {/* Protected routes */}
            <Route path="/communities" element={
              <ProtectedRoute>
                <SimpleCommunities />
              </ProtectedRoute>
            } />
            <Route path="/community/:id" element={
              <ProtectedRoute>
                <SkoolStyleCommunityDetail />
              </ProtectedRoute>
            } />
              <Route path="/community/:id/members" element={
                <ProtectedRoute>
                  <CommunityMembersRebuilt />
                </ProtectedRoute>
              } />
              <Route path="/community/:id/calendar" element={
                <ProtectedRoute>
                  <SimpleCommunityCalendar />
                </ProtectedRoute>
              } />
              <Route path="/community/:id/classroom" element={
                <ProtectedRoute>
                  <CommunityClassroom />
                </ProtectedRoute>
              } />
              <Route path="/community/:id/leaderboard" element={
                <ProtectedRoute>
                  <CommunityLeaderboard />
                </ProtectedRoute>
              } />
              <Route path="/community/:id/discussions" element={
                <ProtectedRoute>
                  <CommunityDiscussions />
                </ProtectedRoute>
              } />
              <Route path="/community/:id/links" element={
                <ProtectedRoute>
                  <CommunityLinksPage />
                </ProtectedRoute>
              } />
              <Route path="/community/:id/about" element={
                <ProtectedRoute>
                  <CommunityAbout />
                </ProtectedRoute>
              } />
              <Route path="/community/:id/subscriptions" element={
                <ProtectedRoute>
                  <CommunitySubscriptions />
                </ProtectedRoute>
              } />
              <Route path="/community/:id/payment-settings" element={
                <ProtectedRoute>
                  <CommunityPaymentSettings />
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
              <Route path="/payment-methods" element={
                <ProtectedRoute>
                  <PaymentMethods />
                </ProtectedRoute>
              } />
              <Route path="/creator-wallet" element={
                <ProtectedRoute>
                  <CreatorWallet />
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
  );
}

export default App;
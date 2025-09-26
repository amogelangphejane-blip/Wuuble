import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { LoadingProvider } from '@/contexts/LoadingContext';
import GlobalLoadingOverlay from '@/components/GlobalLoadingOverlay';

// Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import SimpleCommunities from '@/pages/SimpleCommunities';
import CommunityDetail from '@/pages/CommunityDetail';
import CommunityMembers from '@/pages/CommunityMembers';
import CommunityCalendar from '@/pages/CommunityCalendar';
import CommunityClassroom from '@/pages/CommunityClassroom';
import CommunityLeaderboard from '@/pages/CommunityLeaderboard';
// import CommunityLinksPage from '@/pages/CommunityLinksPage'; // Empty file
// import CommunityVideoChat from '@/pages/CommunityVideoChat'; // Empty file
import CommunitySubscriptions from '@/pages/CommunitySubscriptions';
import CommunityPaymentSettings from '@/pages/CommunityPaymentSettings';
import Messages from '@/pages/Messages';
import Chat from '@/pages/Chat';
import RandomChat from '@/pages/RandomChat';
import AzarLivestreams from '@/pages/AzarLivestreams';
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
                  <CommunityDetail />
                </ProtectedRoute>
              } />
              <Route path="/community/:id/members" element={
                <ProtectedRoute>
                  <CommunityMembers />
                </ProtectedRoute>
              } />
              <Route path="/community/:id/calendar" element={
                <ProtectedRoute>
                  <CommunityCalendar />
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
              {/* <Route path="/community/:id/links" element={
                <ProtectedRoute>
                  <CommunityLinksPage />
                </ProtectedRoute>
              } />
              <Route path="/community/:id/video-chat" element={
                <ProtectedRoute>
                  <CommunityVideoChat />
                </ProtectedRoute>
              } /> */}
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
              <Route path="/chat" element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } />
              <Route path="/random-chat" element={
                <ProtectedRoute>
                  <RandomChat />
                </ProtectedRoute>
              } />
              <Route path="/azar-livestreams" element={
                <ProtectedRoute>
                  <AzarLivestreams />
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
      </LoadingProvider>
    </AuthProvider>
  );
}

export default App;
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { LoadingProvider } from "@/contexts/LoadingContext";
import GlobalLoadingOverlay from "@/components/GlobalLoadingOverlay";
import { performanceMonitor } from "@/utils/performanceMonitor";
import { registerServiceWorker } from "@/utils/pwaUtils";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import RandomChat from "./pages/RandomChat";
import Messages from "./pages/Messages";
import Auth from "./pages/Auth";
import Communities from "./pages/Communities";
import CommunityDetail from "./pages/CommunityDetail";
import CommunityVideoChat from "./pages/CommunityVideoChat";
import CommunityCalendar from "./pages/CommunityCalendar";
import EnhancedCommunityCalendar from "./pages/EnhancedCommunityCalendar";
import CommunityClassroom from "./pages/CommunityClassroom";
import CommunityMembers from "./pages/CommunityMembers";
import CommunitySubscriptions from "./pages/CommunitySubscriptions";
import ProfileSettings from "./pages/ProfileSettings";
import ConnectVideoCall from "./pages/ConnectVideoCall";
import NotFound from "./pages/NotFound";

import CommunityLeaderboardPage from "./pages/CommunityLeaderboard";
import AzarLivestreams from "./pages/AzarLivestreams";
import LoadingDemo from "./pages/LoadingDemo";
import SplashDemo from "./pages/SplashDemo";
import { CreatorWallet } from "./pages/CreatorWallet";
import AdminPlatformSettings from "./pages/AdminPlatformSettings";



const queryClient = new QueryClient();

console.log('🚀 App.tsx loaded - all imports successful');

const App = () => {
  console.log('🎯 App component rendering');
  
  // Initialize performance monitoring and PWA
  React.useEffect(() => {
    performanceMonitor.recordPageView(window.location.pathname);
    performanceMonitor.recordFeatureUsage('app_initialization');
    
    // Register service worker for PWA functionality
    registerServiceWorker();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        themes={["light", "dark", "system", "theme-ocean", "theme-forest", "theme-sunset", "theme-purple"]}
      >
        <LoadingProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <GlobalLoadingOverlay />
              <PWAInstallPrompt />
              <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/random-chat" element={<RandomChat />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/connect-video-call" element={<ConnectVideoCall />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/communities/:id" element={<CommunityDetail />} />
                <Route path="/communities/:id/video-chat" element={<CommunityVideoChat />} />
                {/* Enhanced calendar route - new default */}
                <Route path="/communities/:id/calendar" element={<EnhancedCommunityCalendar />} />
                {/* Legacy calendar route for backward compatibility */}
                <Route path="/communities/:id/calendar/legacy" element={<CommunityCalendar />} />
                <Route path="/communities/:id/classroom" element={<CommunityClassroom />} />
                <Route path="/communities/:id/members" element={<CommunityMembers />} />
                <Route path="/communities/:id/subscriptions" element={<CommunitySubscriptions />} />
                <Route path="/communities/:id/leaderboard" element={<CommunityLeaderboardPage />} />

                <Route path="/profile" element={<ProfileSettings />} />
                <Route path="/wallet" element={<CreatorWallet />} />
                <Route path="/admin/platform-settings" element={<AdminPlatformSettings />} />
                
                {/* Azar Livestream Routes */}
                <Route path="/azar-livestreams" element={<AzarLivestreams />} />
                <Route path="/azar-livestreams/broadcast" element={<AzarLivestreams />} />
                <Route path="/azar-livestreams/:streamId" element={<AzarLivestreams />} />
                
                {/* Loading Demo Route */}
                <Route path="/loading-demo" element={<LoadingDemo />} />
                
                {/* Splash Demo Route */}
                <Route path="/splash-demo" element={<SplashDemo />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LoadingProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;

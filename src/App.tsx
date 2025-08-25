import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { LoadingProvider } from "@/contexts/LoadingContext";
import GlobalLoadingOverlay from "@/components/GlobalLoadingOverlay";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
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

import CommunityGroupCall from "./pages/CommunityGroupCall";
import TestGroupCall from "./pages/TestGroupCall";
import NotFound from "./pages/NotFound";

import CommunityLeaderboardPage from "./pages/CommunityLeaderboard";
import AzarLivestreams from "./pages/AzarLivestreams";
import LoadingDemo from "./pages/LoadingDemo";
import SplashDemo from "./pages/SplashDemo";



const queryClient = new QueryClient();

console.log('🚀 App.tsx loaded - all imports successful');

const App = () => {
  console.log('🎯 App component rendering');
  
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
              <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/connect-video-call" element={<ConnectVideoCall />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/communities/:id" element={<CommunityDetail />} />
                <Route path="/communities/:id/video-chat" element={<CommunityVideoChat />} />
                <Route 
                  path="/communities/:id/group-call" 
                  element={(() => {
                    console.log('🎯 Group call route (no callId) matched');
                    return <CommunityGroupCall />;
                  })()} 
                />
                <Route 
                  path="/communities/:id/group-call/:callId" 
                  element={(() => {
                    console.log('🎯 Group call route (with callId) matched');
                    return <CommunityGroupCall />;
                  })()} 
                />
                {/* Enhanced calendar route - new default */}
                <Route path="/communities/:id/calendar" element={<EnhancedCommunityCalendar />} />
                {/* Legacy calendar route for backward compatibility */}
                <Route path="/communities/:id/calendar/legacy" element={<CommunityCalendar />} />
                <Route path="/communities/:id/classroom" element={<CommunityClassroom />} />
                <Route path="/communities/:id/members" element={<CommunityMembers />} />
                <Route path="/communities/:id/subscriptions" element={<CommunitySubscriptions />} />
                <Route path="/communities/:id/leaderboard" element={<CommunityLeaderboardPage />} />

                <Route path="/profile" element={<ProfileSettings />} />
                
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

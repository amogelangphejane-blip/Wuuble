import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import Communities from "./pages/Communities";
import CommunityDetail from "./pages/CommunityDetail";
import CommunityCalendar from "./pages/CommunityCalendar";
import EnhancedCommunityCalendar from "./pages/EnhancedCommunityCalendar";
import CommunityClassroom from "./pages/CommunityClassroom";
import CommunityMembers from "./pages/CommunityMembers";
import ProfileSettings from "./pages/ProfileSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/communities/:id" element={<CommunityDetail />} />
              {/* Enhanced calendar route - new default */}
              <Route path="/communities/:id/calendar" element={<EnhancedCommunityCalendar />} />
              {/* Legacy calendar route for backward compatibility */}
              <Route path="/communities/:id/calendar/legacy" element={<CommunityCalendar />} />
              <Route path="/communities/:id/classroom" element={<CommunityClassroom />} />
              <Route path="/communities/:id/members" element={<CommunityMembers />} />
              <Route path="/profile" element={<ProfileSettings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

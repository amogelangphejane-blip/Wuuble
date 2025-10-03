import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Menu, 
  Home, 
  Users, 
  MessageCircle, 
  Video, 
  Settings,
  Search,
  Plus,
  Bell
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showBottomNav?: boolean;
  className?: string;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  showSidebar = true,
  showBottomNav = true,
  className
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    
    // Debounce resize to prevent re-renders when keyboard appears/disappears
    let resizeTimer: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkMobile, 250);
    };
    
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  const navigationItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      active: location.pathname === '/' || location.pathname === '/home'
    },
    {
      label: 'Communities',
      href: '/communities',
      icon: Users,
      active: location.pathname.startsWith('/communities')
    },
    {
      label: 'Messages',
      href: '/messages',
      icon: MessageCircle,
      active: location.pathname.startsWith('/messages')
    },
    {
      label: 'Video Chat',
      href: '/chat',
      icon: Video,
      active: location.pathname.startsWith('/chat')
    }
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-lg">Pompeii</span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <Button
              key={item.href}
              variant={item.active ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                item.active && "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              )}
              onClick={() => {
                navigate(item.href);
                setSidebarOpen(false);
              }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="mt-8 space-y-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-2">
            Quick Actions
          </h3>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => {
              navigate('/communities?create=true');
              setSidebarOpen(false);
            }}
          >
            <Plus className="h-4 w-4" />
            Create Community
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => {
              navigate('/chat');
              setSidebarOpen(false);
            }}
          >
            <Video className="h-4 w-4" />
            Start Video Call
          </Button>
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={() => {
            navigate('/profile');
            setSidebarOpen(false);
          }}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  );

  const BottomNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-40">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navigationItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            size="sm"
            className={cn(
              "flex flex-col items-center gap-1 h-12 px-3",
              item.active && "text-blue-600 dark:text-blue-400"
            )}
            onClick={() => navigate(item.href)}
          >
            <item.icon className={cn(
              "h-5 w-5",
              item.active && "text-blue-600 dark:text-blue-400"
            )} />
            <span className="text-xs">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Desktop Sidebar */}
      {showSidebar && !isMobile && (
        <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-30">
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Sidebar */}
      {showSidebar && isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="fixed top-4 left-4 z-50 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300",
        showSidebar && !isMobile && "ml-64",
        showBottomNav && isMobile && "pb-16"
      )}>
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {showBottomNav && isMobile && user && <BottomNavigation />}

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Button
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 z-40"
          onClick={() => navigate('/communities?create=true')}
        >
          <Plus className="h-6 w-6 text-white" />
        </Button>
      )}
    </div>
  );
};

// Hook for responsive breakpoints
export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    updateBreakpoint();
    
    // Debounce resize to prevent re-renders when keyboard appears/disappears
    let resizeTimer: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateBreakpoint, 250);
    };
    
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop'
  };
};

export default ResponsiveLayout;
import { ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Menu, 
  X, 
  Search, 
  Filter, 
  Grid3X3, 
  List,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';

interface ResponsiveCommunitiesLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  filters?: ReactNode;
  searchBar?: ReactNode;
  viewControls?: ReactNode;
  className?: string;
}

interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export const ResponsiveCommunitiesLayout = ({
  children,
  sidebar,
  filters,
  searchBar,
  viewControls,
  className
}: ResponsiveCommunitiesLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewport, setViewport] = useState<ViewportInfo>({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    deviceType: 'desktop'
  });

  // Update viewport info on resize
  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      
      setViewport({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
      });

      // Auto-close sidebar on desktop
      if (isDesktop && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, [sidebarOpen]);

  const DeviceIndicator = () => {
    const Icon = viewport.isMobile ? Smartphone : viewport.isTablet ? Tablet : Monitor;
    return (
      <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
        <Icon className="w-4 h-4" />
        <span>{viewport.deviceType} ({viewport.width}×{viewport.height})</span>
      </div>
    );
  };

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {/* Mobile Header */}
      {viewport.isMobile && (
        <div className="lg:hidden bg-white border-b sticky top-0 z-50">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold">Communities</h1>
            <div className="flex items-center gap-2">
              {filters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                >
                  <Filter className="w-4 h-4" />
                </Button>
              )}
              {sidebar && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Mobile Search */}
          {searchBar && (
            <div className="px-4 pb-4">
              {searchBar}
            </div>
          )}
        </div>
      )}

      {/* Desktop/Tablet Layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar - Hidden on mobile, overlay on tablet, fixed on desktop */}
        {sidebar && (
          <>
            {/* Mobile/Tablet Overlay */}
            {sidebarOpen && !viewport.isDesktop && (
              <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}
            
            {/* Sidebar Content */}
            <div className={cn(
              "bg-white border-r transition-transform duration-300 ease-in-out z-50",
              viewport.isDesktop ? "w-80 flex-shrink-0" : "fixed top-0 left-0 h-full w-80",
              !viewport.isDesktop && !sidebarOpen && "-translate-x-full",
              viewport.isDesktop && "translate-x-0"
            )}>
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold">Menu</h2>
                {!viewport.isDesktop && (
                  <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {/* Sidebar Content */}
              <div className="p-4">
                {sidebar}
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop Header */}
          {!viewport.isMobile && (
            <div className="bg-white border-b">
              <div className="flex items-center justify-between p-6">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Communities
                  </h1>
                  <p className="text-gray-600">Connect with like-minded people</p>
                </div>
                <div className="flex items-center gap-4">
                  <DeviceIndicator />
                  {viewControls}
                </div>
              </div>
              
              {/* Desktop Search and Filters */}
              <div className="px-6 pb-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {searchBar && <div className="flex-1">{searchBar}</div>}
                  {filters && !filtersOpen && <div className="lg:w-80">{filters}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Filters Overlay for Mobile/Tablet */}
          {filters && filtersOpen && !viewport.isDesktop && (
            <>
              <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setFiltersOpen(false)} />
              <div className="fixed top-0 right-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 ease-in-out">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="font-semibold">Filters</h2>
                  <Button variant="ghost" size="sm" onClick={() => setFiltersOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-4">
                  {filters}
                </div>
              </div>
            </>
          )}

          {/* Content Area */}
          <div className="flex-1">
            <div className={cn(
              "p-4 lg:p-6",
              viewport.isMobile && "pb-20" // Extra padding for mobile navigation
            )}>
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Viewport Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && viewport.isMobile && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded z-50">
          {viewport.width}×{viewport.height} - {viewport.deviceType}
        </div>
      )}
    </div>
  );
};

// Hook for responsive behavior
export const useResponsive = () => {
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setViewport({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  return viewport;
};

// Responsive Grid Component
export const ResponsiveGrid = ({ 
  children, 
  className,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3
}: {
  children: ReactNode;
  className?: string;
  mobileColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  const getGridCols = () => {
    if (isMobile) return `grid-cols-${mobileColumns}`;
    if (isTablet) return `grid-cols-${tabletColumns}`;
    return `grid-cols-${desktopColumns}`;
  };

  return (
    <div className={cn(
      "grid gap-4 lg:gap-6",
      getGridCols(),
      className
    )}>
      {children}
    </div>
  );
};

// Mobile-Optimized Card Component
export const ResponsiveCard = ({ 
  children, 
  className,
  onClick,
  ...props 
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}) => {
  const { isMobile } = useResponsive();
  
  return (
    <Card 
      className={cn(
        "transition-all duration-300 cursor-pointer",
        isMobile ? "hover:bg-gray-50" : "hover:shadow-lg hover:-translate-y-1",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </Card>
  );
};
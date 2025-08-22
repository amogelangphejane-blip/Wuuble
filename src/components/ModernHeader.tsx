import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  BookOpen, 
  Users, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  MessageCircle,
  ShoppingBag,
  Package,
  Library,
  Radio,
  Video,
  Home
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateAvatarUrl } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface ModernHeaderProps {
  showAuthButtons?: boolean;
}

export const ModernHeader = ({ showAuthButtons = true }: ModernHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account."
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive"
      });
    }
  };

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
      label: 'Chat',
      href: '/chat',
      icon: MessageCircle,
      active: location.pathname.startsWith('/chat')
    },
    {
      label: 'Live Streams',
      href: '/azar-livestreams',
      icon: Video,
      active: location.pathname.startsWith('/azar-livestreams')
    },
    {
      label: 'Marketplace',
      href: '/marketplace',
      icon: ShoppingBag,
      active: location.pathname.includes('/marketplace') || location.pathname.includes('/store')
    }
  ];

  const NavigationLink = ({ item, mobile = false }: { item: typeof navigationItems[0], mobile?: boolean }) => (
    <button
      onClick={() => {
        navigate(item.href);
        if (mobile) setMobileMenuOpen(false);
      }}
      className={`
        flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${item.active 
          ? 'bg-primary text-primary-foreground shadow-sm' 
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
        }
        ${mobile ? 'w-full justify-start' : ''}
      `}
    >
      <item.icon className="w-4 h-4" />
      <span>{item.label}</span>
    </button>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => navigate('/communities')}
          >
            <img 
              src="/wuuble-logo.svg" 
              alt="Wuuble Logo" 
              className="w-8 h-8"
            />
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Wuuble
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <NavigationLink key={item.href} item={item} />
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {user && showAuthButtons ? (
              <>
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={validateAvatarUrl(profile?.avatar_url)} 
                          alt={profile?.display_name || user.email || 'User'}
                          onError={() => console.warn('Header avatar failed to load:', profile?.avatar_url)}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {(profile?.display_name || user.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm">
                          {profile?.display_name || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/communities')}>
                      <Users className="mr-2 h-4 w-4" />
                      My Communities
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/seller-dashboard')}>
                      <Package className="mr-2 h-4 w-4" />
                      Seller Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/my-library')}>
                      <Library className="mr-2 h-4 w-4" />
                      My Library
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : showAuthButtons ? (
              <>
                {/* Auth Buttons */}
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/auth')}
                  className="hidden sm:inline-flex"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-hero hover:opacity-90 text-white shadow-md hover:shadow-lg transition-all"
                >
                  Get Started
                </Button>
              </>
            ) : null}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4 animate-fade-in">
            <nav className="flex flex-col space-y-2">
              {navigationItems.map((item) => (
                <NavigationLink key={item.href} item={item} mobile />
              ))}
              
              {/* Theme Toggle for Mobile */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
              
              {!user && showAuthButtons && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        navigate('/auth');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      Sign In
                    </Button>
                    <Button 
                      onClick={() => {
                        navigate('/auth');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full mt-2 bg-gradient-hero hover:opacity-90 text-white"
                    >
                      Get Started
                    </Button>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
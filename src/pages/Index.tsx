import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ModernHeader } from '@/components/ModernHeader';
import LandingPage from '@/components/LandingPage';
import Home from '@/pages/Home';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show the activity-based home page
  if (user) {
    return <Home />;
  }

  // If user is not logged in, show the landing page
  return (
    <div className="min-h-screen bg-background">
      <ModernHeader showAuthButtons={true} />
      <LandingPage />
    </div>
  );
};

export default Index;
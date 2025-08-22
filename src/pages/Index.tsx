import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LandingPage from '@/components/LandingPage';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated, redirect to random video chat
    if (!loading && user) {
      navigate('/random-video-chat');
    }
  }, [user, loading, navigate]);

  // Show landing page only for unauthenticated users
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to random video chat
  }

  return (
    <div className="animate-in fade-in duration-500">
      <LandingPage />
    </div>
  );
};

export default Index;

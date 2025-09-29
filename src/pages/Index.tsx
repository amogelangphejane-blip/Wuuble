import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ModernHeader } from '@/components/ModernHeader';
import LandingPage from '@/components/LandingPage';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is logged in, redirect to communities
  if (user) {
    navigate('/communities');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader showAuthButtons={true} />
      <LandingPage />
    </div>
  );
};

export default Index;
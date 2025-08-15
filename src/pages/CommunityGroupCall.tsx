import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { GroupVideoChat } from '@/components/GroupVideoChat';
import { ModernHeader } from '@/components/ModernHeader';
import { useToast } from '@/hooks/use-toast';

const CommunityGroupCall: React.FC = () => {
  const { communityId, callId } = useParams<{ communityId: string; callId?: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Debug logging
    console.log('CommunityGroupCall loaded with:', { communityId, callId, user: !!user, authLoading });
    
    if (!communityId) {
      setError('Community ID is missing');
    }
  }, [communityId, callId, user, authLoading]);

  const handleExit = () => {
    navigate(`/communities/${communityId}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-bg">
        <ModernHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !communityId) {
    return (
      <div className="min-h-screen bg-gradient-bg">
        <ModernHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Error</h1>
            <p className="text-muted-foreground mb-4">
              {!user ? 'Please log in to access group calls.' : 'Invalid community ID.'}
            </p>
            <button
              onClick={() => navigate(user ? '/communities' : '/auth')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              {user ? 'Back to Communities' : 'Go to Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-bg">
        <ModernHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={handleExit}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Back to Community
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <GroupVideoChat
        communityId={communityId}
        callId={callId}
        onExit={handleExit}
        useMockSignaling={true}
        maxParticipants={50}
      />
    </div>
  );
};

export default CommunityGroupCall;
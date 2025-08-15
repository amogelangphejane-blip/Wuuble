import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { GroupVideoChat } from '@/components/GroupVideoChat';
import { ModernHeader } from '@/components/ModernHeader';
import { useToast } from '@/hooks/use-toast';

console.log('🚀 CommunityGroupCall component loaded');

const CommunityGroupCall: React.FC = () => {
  console.log('🎯 CommunityGroupCall component rendering');
  
  const { id: communityId, callId } = useParams<{ id: string; callId?: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  console.log('📊 CommunityGroupCall params and state:', {
    communityId,
    callId,
    user: !!user,
    authLoading,
    pathname: window.location.pathname
  });

  useEffect(() => {
    console.log('🔄 Auth effect triggered:', { user: !!user, authLoading });
    if (!authLoading && !user) {
      console.log('🔄 Redirecting to auth...');
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Debug logging
    console.log('CommunityGroupCall loaded with:', { communityId, callId, user: !!user, authLoading });
    
    if (!communityId) {
      console.log('❌ No communityId found');
      setError('Community ID is missing');
    }
  }, [communityId, callId, user, authLoading]);

  const handleExit = () => {
    console.log('🚪 Exiting to community:', communityId);
    navigate(`/communities/${communityId}`);
  };

  console.log('🎨 About to render, current state:', {
    authLoading,
    user: !!user,
    communityId: !!communityId,
    error
  });

  if (authLoading) {
    console.log('⏳ Rendering loading state');
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
    console.log('❌ Rendering error state - missing user or communityId');
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
    console.log('❌ Rendering error state:', error);
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

  console.log('✅ Rendering GroupVideoChat component');
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
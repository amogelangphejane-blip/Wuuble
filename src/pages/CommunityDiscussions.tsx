import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import SimpleDiscussion from '@/components/SimpleDiscussion';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { ModernHeader } from '@/components/ModernHeader';

const CommunityDiscussions: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <ResponsiveLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p>Invalid community ID</p>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <ModernHeader />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Button
            variant="ghost"
            onClick={() => navigate(`/community/${id}`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Button>
          
          <SimpleDiscussion communityId={id} isOwner={false} isModerator={false} />
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default CommunityDiscussions;
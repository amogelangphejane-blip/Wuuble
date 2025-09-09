import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import CommunityLinks from '@/components/CommunityLinks';
import { CommunityLinksIcon } from '@/components/CommunityLinksIcon';
import { ArrowLeft, Home } from 'lucide-react';

const CommunityLinksPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Community Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The community you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/communities')}>
            <Home className="w-4 h-4 mr-2" />
            Browse Communities
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/communities/${id}`)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Community
            </Button>
            
            <div className="flex items-center gap-3">
              <CommunityLinksIcon variant="gradient" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community Links</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Discover and share interesting links with the community
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <CommunityLinks communityId={id} />
      </div>
    </div>
  );
};

export default CommunityLinksPage;

import React from 'react';
import { PaymentInstructionsManager } from '@/components/PaymentInstructionsManager';
import { useParams } from 'react-router-dom';

export const CommunityPaymentSettingsPage: React.FC = () => {
  const { communityId } = useParams<{ communityId: string }>();

  if (!communityId) {
    return <div>Community not found</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure payment methods and instructions for your community
          </p>
        </div>
        
        <PaymentInstructionsManager 
          communityId={communityId} 
          isAdmin={true} 
        />
      </div>
    </div>
  );
};

export default CommunityPaymentSettingsPage;
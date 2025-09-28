import React from 'react';
import { SimpleCommunityMembers } from '@/components/SimpleCommunityMembers';
import ResponsiveLayout from '@/components/ResponsiveLayout';

const CommunityMembers: React.FC = () => {
  return (
    <ResponsiveLayout>
      <SimpleCommunityMembers />
    </ResponsiveLayout>
  );
};

export default CommunityMembers;
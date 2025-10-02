import React from 'react';
import { PlatformAccountSettings } from '@/components/admin/PlatformAccountSettings';
import { StorageSetup } from '@/components/StorageSetup';

const AdminPlatformSettings: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <StorageSetup />
          <PlatformAccountSettings />
        </div>
      </div>
    </div>
  );
};

export default AdminPlatformSettings;
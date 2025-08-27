import React from 'react';
import { PlatformAccountSettings } from '@/components/admin/PlatformAccountSettings';

const AdminPlatformSettings: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <PlatformAccountSettings />
      </div>
    </div>
  );
};

export default AdminPlatformSettings;
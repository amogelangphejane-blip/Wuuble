import React from 'react';
import { DigitalMarketplace } from '@/components/DigitalMarketplace';
import { ModernHeader } from '@/components/ModernHeader';

const Marketplace: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      <main className="container mx-auto px-4 py-8">
        <DigitalMarketplace />
      </main>
    </div>
  );
};

export default Marketplace;
import { ModernHeader } from '@/components/ModernHeader';
import { SellerDashboard } from '@/components/SellerDashboard';

const SellerDashboardPage = () => {
  return (
    <div className="min-h-screen bg-gradient-bg">
      <ModernHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SellerDashboard />
      </div>
    </div>
  );
};

export default SellerDashboardPage;
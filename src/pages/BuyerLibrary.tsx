import { ModernHeader } from '@/components/ModernHeader';
import { BuyerLibrary } from '@/components/BuyerLibrary';

const BuyerLibraryPage = () => {
  return (
    <div className="min-h-screen bg-gradient-bg">
      <ModernHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BuyerLibrary />
      </div>
    </div>
  );
};

export default BuyerLibraryPage;
import React, { useState } from 'react';
import { DigitalMarketplace } from '@/components/DigitalMarketplace';
import { ModernHeader } from '@/components/ModernHeader';
import { ShoppingCartComponent } from '@/components/ShoppingCart';

const Marketplace: React.FC = () => {
  const [showCart, setShowCart] = useState(false);

  const handleCartCheckout = (items: any[]) => {
    // Handle checkout logic here
    console.log('Checkout items:', items);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-amber-50/20 to-yellow-50/30">
      <ModernHeader onCartClick={() => setShowCart(true)} />
      <main className="container mx-auto px-4 py-8">
        <DigitalMarketplace />
      </main>
      
      <ShoppingCartComponent
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={handleCartCheckout}
      />
    </div>
  );
};

export default Marketplace;
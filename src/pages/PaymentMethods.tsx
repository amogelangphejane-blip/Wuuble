import React from 'react';
import { PaymentMethodManager } from '@/components/PaymentMethodManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const PaymentMethodsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Methods</h1>
          <p className="text-muted-foreground mt-2">
            Manage your saved payment methods for faster checkout
          </p>
        </div>
        
        <PaymentMethodManager showAddButton={true} />
        
        <Card>
          <CardHeader>
            <CardTitle>Security Information</CardTitle>
            <CardDescription>
              Your payment information is secure and encrypted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>All card data is processed securely by Stripe</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Bank accounts require verification for security</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>You can remove payment methods at any time</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentMethodsPage;
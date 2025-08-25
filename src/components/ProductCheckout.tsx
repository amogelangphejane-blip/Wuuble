import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CreditCard, 
  Lock, 
  ShoppingCart, 
  Check, 
  AlertCircle,
  Download,
  Star,
  Package,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { createOrder, updateOrderStatus } from '@/services/storeService';
import { paymentService } from '@/services/paymentService';
import type { DigitalProduct, ProductOrder, CheckoutSession } from '@/types/store';

interface ProductCheckoutProps {
  product: DigitalProduct;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (order: ProductOrder) => void;
}

export const ProductCheckout: React.FC<ProductCheckoutProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'details' | 'payment' | 'processing' | 'success' | 'error'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [order, setOrder] = useState<ProductOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: user?.email || '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    }
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleCreateOrder = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase products",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createOrder(product.id, 1);
      
      if (result.success && result.data) {
        setOrder(result.data);
        setStep('payment');
      } else {
        throw new Error(result.error?.message || 'Failed to create order');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create order",
        variant: "destructive",
      });
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!order) return;

    // Validate payment data
    if (paymentMethod === 'card') {
      if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardholderName) {
        toast({
          title: "Incomplete Payment Information",
          description: "Please fill in all required payment fields",
          variant: "destructive",
        });
        return;
      }
    }

    setStep('processing');
    setLoading(true);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate payment success (90% success rate)
      const paymentSuccessful = Math.random() > 0.1;

      if (paymentSuccessful) {
        // Update order status to completed
        const result = await updateOrderStatus(order.id, 'completed');
        
        if (result.success) {
          setStep('success');
          toast({
            title: "Payment Successful!",
            description: "Your purchase is complete. You can now download your product.",
          });
          
          if (onSuccess) {
            onSuccess(order);
          }
        } else {
          throw new Error('Failed to update order status');
        }
      } else {
        // Simulate payment failure
        await updateOrderStatus(order.id, 'failed');
        throw new Error('Payment failed. Please try again with different payment method.');
      }
    } catch (error) {
      setStep('error');
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Payment processing failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('details');
    setOrder(null);
    setPaymentData({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      email: user?.email || '',
      billingAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
      }
    });
    onClose();
  };

  const renderProductDetails = () => (
    <div className="space-y-6">
      <div className="flex space-x-4">
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.title}
            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{product.title}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
            {product.description}
          </p>
          
          <div className="flex items-center space-x-4 text-sm">
            {product.seller?.user && (
              <div className="flex items-center space-x-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={product.seller.user.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {product.seller.user.user_metadata?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">
                  {product.seller.store_name || product.seller.user.user_metadata?.full_name}
                </span>
              </div>
            )}
            
            {product.rating > 0 && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{product.rating.toFixed(1)} ({product.rating_count})</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <div className="flex justify-between">
          <span>Product Price:</span>
          <span className="font-semibold">{formatPrice(product.price)}</span>
        </div>
        <div className="flex justify-between">
          <span>Quantity:</span>
          <span>1</span>
        </div>
        <div className="flex justify-between">
          <span>Processing Fee:</span>
          <span>$0.00</span>
        </div>
        <Separator />
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>{formatPrice(product.price)}</span>
        </div>
      </div>
      
      <div className="flex space-x-4">
        <Button variant="outline" onClick={handleClose} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleCreateOrder} disabled={loading} className="flex-1">
          {loading ? "Processing..." : "Continue to Payment"}
        </Button>
      </div>
    </div>
  );

  const renderPaymentForm = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>Your payment information is secure and encrypted</span>
      </div>
      
      <div className="space-y-4">
        <div className="flex space-x-4">
          <Button
            variant={paymentMethod === 'card' ? 'default' : 'outline'}
            onClick={() => setPaymentMethod('card')}
            className="flex-1"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Credit Card
          </Button>
          <Button
            variant={paymentMethod === 'paypal' ? 'default' : 'outline'}
            onClick={() => setPaymentMethod('paypal')}
            className="flex-1"
            disabled
          >
            PayPal (Coming Soon)
          </Button>
        </div>
        
        {paymentMethod === 'card' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardholder-name">Cardholder Name</Label>
              <Input
                id="cardholder-name"
                value={paymentData.cardholderName}
                onChange={(e) => setPaymentData(prev => ({ ...prev, cardholderName: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input
                id="card-number"
                value={paymentData.cardNumber}
                onChange={(e) => setPaymentData(prev => ({ ...prev, cardNumber: e.target.value }))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry-date">Expiry Date</Label>
                <Input
                  id="expiry-date"
                  value={paymentData.expiryDate}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  value={paymentData.cvv}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, cvv: e.target.value }))}
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="bg-muted p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total: {formatPrice(product.price)}</span>
          <Badge variant="secondary">Instant Download</Badge>
        </div>
      </div>
      
      <div className="flex space-x-4">
        <Button variant="outline" onClick={() => setStep('details')} className="flex-1">
          Back
        </Button>
        <Button onClick={handlePayment} disabled={loading} className="flex-1">
          {loading ? "Processing..." : `Pay ${formatPrice(product.price)}`}
        </Button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
      <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
      <p className="text-muted-foreground">
        Please wait while we process your payment securely...
      </p>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-12">
      <div className="rounded-full h-16 w-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
      <p className="text-muted-foreground mb-6">
        Your purchase is complete. You can now download your digital product.
      </p>
      
      <div className="space-y-4">
        <Button className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Download Now
        </Button>
        <Button variant="outline" onClick={handleClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="text-center py-12">
      <div className="rounded-full h-16 w-16 bg-red-100 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Payment Failed</h3>
      <p className="text-muted-foreground mb-6">
        There was an issue processing your payment. Please try again.
      </p>
      
      <div className="space-y-4">
        <Button onClick={() => setStep('payment')} className="w-full">
          Try Again
        </Button>
        <Button variant="outline" onClick={handleClose} className="w-full">
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'details' && 'Purchase Product'}
            {step === 'payment' && 'Payment Information'}
            {step === 'processing' && 'Processing Payment'}
            {step === 'success' && 'Purchase Complete'}
            {step === 'error' && 'Payment Error'}
          </DialogTitle>
          <DialogDescription>
            {step === 'details' && 'Review your purchase details'}
            {step === 'payment' && 'Enter your payment information'}
            {step === 'processing' && 'Please wait...'}
            {step === 'success' && 'Thank you for your purchase!'}
            {step === 'error' && 'Something went wrong'}
          </DialogDescription>
        </DialogHeader>
        
        {step === 'details' && renderProductDetails()}
        {step === 'payment' && renderPaymentForm()}
        {step === 'processing' && renderProcessing()}
        {step === 'success' && renderSuccess()}
        {step === 'error' && renderError()}
      </DialogContent>
    </Dialog>
  );
};
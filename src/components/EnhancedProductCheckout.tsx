import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
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
  DollarSign,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Shield,
  Smartphone,
  Wallet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { paymentService } from '@/services/paymentService';
import { cn } from '@/lib/utils';
import type { DigitalProduct, ProductOrder, CheckoutSession } from '@/types/store';

interface EnhancedProductCheckoutProps {
  product: DigitalProduct;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (order: ProductOrder) => void;
}

const PAYMENT_METHOD_ICONS = {
  credit_card: CreditCard,
  paypal: Wallet,
  apple_pay: Smartphone,
  google_pay: Smartphone,
};

const PAYMENT_METHOD_LABELS = {
  credit_card: 'Credit Card',
  paypal: 'PayPal',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
};

export const EnhancedProductCheckout: React.FC<EnhancedProductCheckoutProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'review' | 'payment' | 'processing' | 'success' | 'error'>('review');
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');
  const [order, setOrder] = useState<ProductOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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

  const totalAmount = product.price * quantity;
  const processingFee = Math.round(totalAmount * 0.029 + 0.30); // 2.9% + $0.30
  const finalTotal = totalAmount + processingFee;

  useEffect(() => {
    if (isOpen) {
      initializeCheckout();
    }
  }, [isOpen]);

  const initializeCheckout = async () => {
    try {
      // Load available payment methods
      const methods = await paymentService.getPaymentMethods();
      setAvailablePaymentMethods(methods);
      
      // Create checkout session
      const session = await paymentService.createCheckoutSession(product, quantity);
      setCheckoutSession(session);
    } catch (error) {
      toast({
        title: "Checkout Error",
        description: "Failed to initialize checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const validatePaymentData = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (paymentMethod === 'credit_card') {
      if (!paymentData.cardNumber || paymentData.cardNumber.length < 16) {
        newErrors.cardNumber = 'Valid card number is required';
      }
      if (!paymentData.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
        newErrors.expiryDate = 'Valid expiry date is required (MM/YY)';
      }
      if (!paymentData.cvv || paymentData.cvv.length < 3) {
        newErrors.cvv = 'Valid CVV is required';
      }
      if (!paymentData.cardholderName.trim()) {
        newErrors.cardholderName = 'Cardholder name is required';
      }
    }
    
    if (!paymentData.email || !/\S+@\S+\.\S+/.test(paymentData.email)) {
      newErrors.email = 'Valid email is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!user || !checkoutSession) {
      toast({
        title: "Error",
        description: "Please log in and try again",
        variant: "destructive",
      });
      return;
    }

    if (!validatePaymentData()) {
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      // Process payment
      const paymentResult = await paymentService.processPayment(
        checkoutSession.payment_intent?.id || '',
        'mock_payment_method'
      );

      if (!paymentResult.success) {
        setStep('error');
        toast({
          title: "Payment Failed",
          description: paymentResult.error || "Payment could not be processed",
          variant: "destructive",
        });
        return;
      }

      // Complete purchase
      const purchaseResult = await paymentService.completePurchase(
        product.id,
        checkoutSession.payment_intent?.id || '',
        quantity
      );

      if (purchaseResult.success && purchaseResult.order) {
        setOrder(purchaseResult.order);
        setStep('success');
        onSuccess?.(purchaseResult.order);
        
        toast({
          title: "Purchase Successful!",
          description: "Your product is ready for download",
        });
      } else {
        setStep('error');
        toast({
          title: "Purchase Failed",
          description: purchaseResult.error || "Could not complete purchase",
          variant: "destructive",
        });
      }
    } catch (error) {
      setStep('error');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!order) return;

    try {
      const downloadResult = await paymentService.getDownloadUrl(order.id);
      
      if (downloadResult.success && downloadResult.url) {
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = downloadResult.url;
        link.download = product.title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download Started",
          description: "Your file download has begun",
        });
      } else {
        toast({
          title: "Download Failed",
          description: downloadResult.error || "Could not generate download link",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Download Error",
        description: "Failed to start download",
        variant: "destructive",
      });
    }
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
  };

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Order</h2>
        <p className="text-gray-600">Confirm your purchase details</p>
      </div>

      {/* Product Details */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {product.thumbnail_url ? (
              <img
                src={product.thumbnail_url}
                alt={product.title}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="h-8 w-8 text-orange-600" />
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{product.title}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {product.description}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Digital Seller</span>
                </div>
                
                {product.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{product.rating.toFixed(1)} ({product.rating_count})</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Processing fee</span>
            <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(processingFee)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(finalTotal)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={() => setStep('payment')}
          className="bg-orange-600 hover:bg-orange-700 text-white px-8"
        >
          Continue to Payment
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Details</h2>
        <p className="text-gray-600">Choose your payment method and enter details</p>
      </div>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {availablePaymentMethods.map((method) => {
              const IconComponent = PAYMENT_METHOD_ICONS[method as keyof typeof PAYMENT_METHOD_ICONS] || CreditCard;
              const label = PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS] || method;
              
              return (
                <Button
                  key={method}
                  variant="outline"
                  className={cn(
                    "h-16 flex-col gap-2",
                    paymentMethod === method && "border-orange-500 bg-orange-50"
                  )}
                  onClick={() => setPaymentMethod(method)}
                >
                  <IconComponent className="h-6 w-6" />
                  <span className="text-sm">{label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      {paymentMethod === 'credit_card' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Card Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input
                id="card-number"
                value={paymentData.cardNumber}
                onChange={(e) => setPaymentData(prev => ({ 
                  ...prev, 
                  cardNumber: formatCardNumber(e.target.value) 
                }))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className={cn(errors.cardNumber && "border-red-500")}
              />
              {errors.cardNumber && (
                <p className="text-sm text-red-600">{errors.cardNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  value={paymentData.expiryDate}
                  onChange={(e) => setPaymentData(prev => ({ 
                    ...prev, 
                    expiryDate: formatExpiryDate(e.target.value) 
                  }))}
                  placeholder="MM/YY"
                  maxLength={5}
                  className={cn(errors.expiryDate && "border-red-500")}
                />
                {errors.expiryDate && (
                  <p className="text-sm text-red-600">{errors.expiryDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  value={paymentData.cvv}
                  onChange={(e) => setPaymentData(prev => ({ 
                    ...prev, 
                    cvv: e.target.value.replace(/\D/g, '') 
                  }))}
                  placeholder="123"
                  maxLength={4}
                  className={cn(errors.cvv && "border-red-500")}
                />
                {errors.cvv && (
                  <p className="text-sm text-red-600">{errors.cvv}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardholder-name">Cardholder Name</Label>
              <Input
                id="cardholder-name"
                value={paymentData.cardholderName}
                onChange={(e) => setPaymentData(prev => ({ 
                  ...prev, 
                  cardholderName: e.target.value 
                }))}
                placeholder="John Doe"
                className={cn(errors.cardholderName && "border-red-500")}
              />
              {errors.cardholderName && (
                <p className="text-sm text-red-600">{errors.cardholderName}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">Secure Payment</h3>
            <p className="text-sm text-green-700">
              Your payment information is encrypted and secure. We never store your card details.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('review')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Review
        </Button>
        
        <Button 
          onClick={handlePayment}
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 text-white px-8"
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Complete Purchase ({new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(finalTotal)})
        </Button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center space-y-6 py-12">
      <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
        <Loader2 className="h-12 w-12 text-orange-600 animate-spin" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
        <p className="text-gray-600">Please wait while we process your payment...</p>
      </div>
      
      <Progress value={75} className="w-full max-w-md mx-auto" />
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-6 py-12">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Check className="h-12 w-12 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600">Your purchase is complete. You can now download your product.</p>
      </div>

      {order && (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-sm">{order.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge className="bg-green-100 text-green-800">Completed</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center gap-4">
        <Button onClick={handleDownload} className="bg-orange-600 hover:bg-orange-700 text-white">
          <Download className="h-4 w-4 mr-2" />
          Download Product
        </Button>
        
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );

  const renderErrorStep = () => (
    <div className="text-center space-y-6 py-12">
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="h-12 w-12 text-red-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
        <p className="text-gray-600">There was an issue processing your payment. Please try again.</p>
      </div>

      <div className="flex justify-center gap-4">
        <Button onClick={() => setStep('payment')} className="bg-orange-600 hover:bg-orange-700 text-white">
          Try Again
        </Button>
        
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'review': return renderReviewStep();
      case 'payment': return renderPaymentStep();
      case 'processing': return renderProcessingStep();
      case 'success': return renderSuccessStep();
      case 'error': return renderErrorStep();
      default: return renderReviewStep();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Checkout
          </DialogTitle>
          <DialogDescription>
            Complete your purchase of {product.title}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {renderCurrentStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
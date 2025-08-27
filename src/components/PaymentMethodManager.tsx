import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  CreditCard, 
  Building2, 
  Wallet,
  Plus,
  MoreVertical,
  Star,
  Trash2,
  Edit,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { PaymentMethodInfo } from '@/types/subscription';
import { usePaymentMethods, usePaymentMethodVerification } from '@/hooks/usePaymentMethods';
import { AddPaymentMethodDialog } from './AddPaymentMethodDialog';
import { PaymentMethodVerificationDialog } from './PaymentMethodVerificationDialog';

interface PaymentMethodManagerProps {
  showAddButton?: boolean;
}

export const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({
  showAddButton = true
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodInfo | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { 
    paymentMethods, 
    loading, 
    error,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    actionLoading
  } = usePaymentMethods();

  const getPaymentMethodIcon = (type: PaymentMethodInfo['type']) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'paypal':
        return <Wallet className="h-5 w-5 text-blue-600" />;
      case 'bank_transfer':
        return <Building2 className="h-5 w-5 text-green-600" />;
      case 'crypto':
        return <Wallet className="h-5 w-5 text-orange-600" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getPaymentMethodDescription = (paymentMethod: PaymentMethodInfo) => {
    switch (paymentMethod.type) {
      case 'card':
        return `${paymentMethod.card_brand?.toUpperCase()} ending in ${paymentMethod.card_last4}`;
      case 'paypal':
        return paymentMethod.paypal_email || 'PayPal Account';
      case 'bank_transfer':
        return `${paymentMethod.bank_name} ending in ${paymentMethod.bank_account_last4}`;
      case 'crypto':
        return 'Cryptocurrency Wallet';
      default:
        return paymentMethod.display_name;
    }
  };

  const getStatusBadge = (paymentMethod: PaymentMethodInfo) => {
    // For bank transfers, we need to check verification status
    if (paymentMethod.type === 'bank_transfer') {
      return (
        <Badge variant="outline" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Pending Verification
        </Badge>
      );
    }
    
    if (paymentMethod.type === 'card') {
      // Check if card is expired
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      if (paymentMethod.card_exp_year && paymentMethod.card_exp_month) {
        if (paymentMethod.card_exp_year < currentYear || 
            (paymentMethod.card_exp_year === currentYear && paymentMethod.card_exp_month < currentMonth)) {
          return (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Expired
            </Badge>
          );
        }
      }
    }
    
    return (
      <Badge variant="secondary" className="text-xs">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    await setDefaultPaymentMethod(paymentMethodId);
  };

  const handleDelete = async () => {
    if (selectedPaymentMethod) {
      const success = await deletePaymentMethod(selectedPaymentMethod.id);
      if (success) {
        setShowDeleteDialog(false);
        setSelectedPaymentMethod(null);
      }
    }
  };

  const handleVerify = (paymentMethod: PaymentMethodInfo) => {
    setSelectedPaymentMethod(paymentMethod);
    setShowVerificationDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your saved payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                <div className="h-10 w-10 bg-muted rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-8 w-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your saved payment methods</CardDescription>
            </div>
            {showAddButton && (
              <Button onClick={() => setShowAddDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Method
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No payment methods</h3>
              <p className="text-muted-foreground mb-4">
                Add a payment method to make subscribing easier
              </p>
              {showAddButton && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((paymentMethod) => (
                <div 
                  key={paymentMethod.id} 
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {getPaymentMethodIcon(paymentMethod.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{paymentMethod.display_name}</h4>
                      {paymentMethod.is_default && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {getPaymentMethodDescription(paymentMethod)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(paymentMethod)}
                      {paymentMethod.type === 'bank_transfer' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerify(paymentMethod)}
                          className="text-xs h-6 px-2"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Verify
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!paymentMethod.is_default && (
                        <>
                          <DropdownMenuItem onClick={() => handleSetDefault(paymentMethod.id)}>
                            <Star className="h-4 w-4 mr-2" />
                            Set as Default
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                          setSelectedPaymentMethod(paymentMethod);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Method Dialog */}
      <AddPaymentMethodDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => setShowAddDialog(false)}
      />

      {/* Payment Method Verification Dialog */}
      <PaymentMethodVerificationDialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        paymentMethod={selectedPaymentMethod}
        onSuccess={() => setShowVerificationDialog(false)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment Method</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment method? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPaymentMethod && (
            <div className="flex items-center space-x-3 p-3 border rounded-md">
              {getPaymentMethodIcon(selectedPaymentMethod.type)}
              <div>
                <div className="font-medium">{selectedPaymentMethod.display_name}</div>
                <div className="text-sm text-muted-foreground">
                  {getPaymentMethodDescription(selectedPaymentMethod)}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1"
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="flex-1"
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentMethodManager;
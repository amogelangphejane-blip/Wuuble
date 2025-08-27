import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Building2,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2
} from 'lucide-react';
import { PaymentMethodInfo, PaymentMethodVerification } from '@/types/subscription';
import { usePaymentMethodVerification } from '@/hooks/usePaymentMethods';

interface PaymentMethodVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod: PaymentMethodInfo | null;
  onSuccess: () => void;
}

export const PaymentMethodVerificationDialog: React.FC<PaymentMethodVerificationDialogProps> = ({
  open,
  onOpenChange,
  paymentMethod,
  onSuccess
}) => {
  const [microDepositAmounts, setMicroDepositAmounts] = useState(['', '']);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  
  const {
    verifications,
    loading,
    createVerification,
    verifyMicroDeposits
  } = usePaymentMethodVerification(paymentMethod?.id);

  const latestVerification = verifications[0]; // Most recent verification

  useEffect(() => {
    if (open) {
      setMicroDepositAmounts(['', '']);
      setError(null);
    }
  }, [open]);

  const handleStartVerification = async () => {
    if (!paymentMethod) return;
    
    await createVerification('micro_deposits');
  };

  const handleVerifyAmounts = async () => {
    if (!latestVerification) return;
    
    const amounts = microDepositAmounts.map(amount => {
      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed <= 0 || parsed > 99) {
        throw new Error('Please enter valid amounts between 0.01 and 0.99');
      }
      return Math.round(parsed * 100); // Convert to cents
    });

    if (amounts.some(amount => isNaN(amount))) {
      setError('Please enter valid amounts');
      return;
    }

    setVerifying(true);
    setError(null);
    
    try {
      const success = await verifyMicroDeposits(latestVerification.id, amounts);
      if (success) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const getVerificationStatusBadge = (verification: PaymentMethodVerification) => {
    switch (verification.status) {
      case 'pending':
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'verified':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return null;
    }
  };

  const isVerificationComplete = latestVerification?.status === 'verified';
  const canStartNewVerification = !latestVerification || 
    ['failed', 'expired'].includes(latestVerification.status);
  const canVerifyAmounts = latestVerification?.status === 'pending' && 
    latestVerification.verification_type === 'micro_deposits';

  if (!paymentMethod) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verify Payment Method
          </DialogTitle>
          <DialogDescription>
            Verify your bank account to enable payments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Method Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">{paymentMethod.display_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {paymentMethod.bank_name} ending in {paymentMethod.bank_account_last4}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading verification status...</p>
            </div>
          ) : (
            <>
              {/* Current Verification Status */}
              {latestVerification && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      Verification Status
                      {getVerificationStatusBadge(latestVerification)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Method:</span>
                        <span className="capitalize">{latestVerification.verification_type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Attempts:</span>
                        <span>{latestVerification.attempts} / {latestVerification.max_attempts}</span>
                      </div>
                      {latestVerification.expires_at && (
                        <div className="flex justify-between">
                          <span>Expires:</span>
                          <span>{new Date(latestVerification.expires_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Verification Complete */}
              {isVerificationComplete && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your bank account has been successfully verified and is ready for payments.
                  </AlertDescription>
                </Alert>
              )}

              {/* Start New Verification */}
              {canStartNewVerification && (
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      We'll send two small deposits (less than $1.00 each) to your bank account. 
                      This usually takes 1-2 business days. Once you receive them, enter the amounts below to verify your account.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    onClick={handleStartVerification}
                    className="w-full"
                  >
                    Start Verification
                  </Button>
                </div>
              )}

              {/* Enter Micro Deposit Amounts */}
              {canVerifyAmounts && (
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Check your bank account for two small deposits from our service. 
                      Enter the exact amounts below (e.g., 0.32 and 0.47).
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Label>Enter the two deposit amounts:</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="amount1" className="text-sm">First Amount</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm">$</span>
                          <Input
                            id="amount1"
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="0.99"
                            placeholder="0.00"
                            value={microDepositAmounts[0]}
                            onChange={(e) => setMicroDepositAmounts([e.target.value, microDepositAmounts[1]])}
                            className="pl-6"
                            disabled={verifying}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="amount2" className="text-sm">Second Amount</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm">$</span>
                          <Input
                            id="amount2"
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="0.99"
                            placeholder="0.00"
                            value={microDepositAmounts[1]}
                            onChange={(e) => setMicroDepositAmounts([microDepositAmounts[0], e.target.value])}
                            className="pl-6"
                            disabled={verifying}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    onClick={handleVerifyAmounts}
                    className="w-full"
                    disabled={verifying || !microDepositAmounts[0] || !microDepositAmounts[1]}
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Amounts'
                    )}
                  </Button>

                  {latestVerification.attempts > 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      {latestVerification.max_attempts - latestVerification.attempts} attempts remaining
                    </p>
                  )}
                </div>
              )}

              {/* Failed Verification */}
              {latestVerification?.status === 'failed' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Verification failed after maximum attempts. You can start a new verification process.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          <Separator />

          {/* Close Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodVerificationDialog;
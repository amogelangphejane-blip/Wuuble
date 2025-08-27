import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2,
  Wallet,
  Copy,
  Clock,
  Info,
  CheckCircle
} from 'lucide-react';
import { usePaymentInstructions } from '@/hooks/usePaymentMethods';
import { useToast } from '@/hooks/use-toast';

interface PaymentInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  paymentType: 'bank_transfer' | 'crypto' | null;
  amount: number;
}

export const PaymentInstructionsDialog: React.FC<PaymentInstructionsDialogProps> = ({
  open,
  onOpenChange,
  communityId,
  paymentType,
  amount
}) => {
  const { toast } = useToast();
  const { instructions, loading, error } = usePaymentInstructions(communityId);

  const relevantInstructions = useMemo(() => {
    if (!paymentType) return [];
    return instructions.filter(instruction => instruction.payment_type === paymentType);
  }, [instructions, paymentType]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the information manually",
        variant: "destructive"
      });
    }
  };

  const formatPaymentType = (type: string) => {
    switch (type) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'crypto':
        return 'Cryptocurrency';
      default:
        return type;
    }
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'bank_transfer':
        return <Building2 className="h-5 w-5" />;
      case 'crypto':
        return <Wallet className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Instructions</DialogTitle>
            <DialogDescription>Loading payment instructions...</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {paymentType && getPaymentIcon(paymentType)}
            Payment Instructions
          </DialogTitle>
          <DialogDescription>
            Complete your payment using the information below. Your subscription will be activated once payment is confirmed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span>Subscription Amount:</span>
                <span className="text-xl font-bold">${amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
                <span>Payment Method:</span>
                <Badge variant="secondary">
                  {paymentType ? formatPaymentType(paymentType) : 'Manual Payment'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : relevantInstructions.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No payment instructions available for this method. Please contact support for assistance.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {relevantInstructions.map((instruction) => (
                <Card key={instruction.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getPaymentIcon(instruction.payment_type)}
                      {instruction.title}
                    </CardTitle>
                    <CardDescription>
                      {formatPaymentType(instruction.payment_type)} Instructions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Bank Transfer Specific Fields */}
                    {instruction.payment_type === 'bank_transfer' && (
                      <div className="space-y-3">
                        {instruction.bank_name && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Bank Name:</span>
                            <div className="flex items-center gap-2">
                              <span>{instruction.bank_name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(instruction.bank_name!, 'Bank name')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {instruction.account_name && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Account Name:</span>
                            <div className="flex items-center gap-2">
                              <span>{instruction.account_name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(instruction.account_name!, 'Account name')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {instruction.account_number && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Account Number:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{instruction.account_number}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(instruction.account_number!, 'Account number')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {instruction.routing_number && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Routing Number:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{instruction.routing_number}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(instruction.routing_number!, 'Routing number')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {instruction.swift_code && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">SWIFT Code:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{instruction.swift_code}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(instruction.swift_code!, 'SWIFT code')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {instruction.iban && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">IBAN:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{instruction.iban}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(instruction.iban!, 'IBAN')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Crypto Specific Fields */}
                    {instruction.payment_type === 'crypto' && (
                      <div className="space-y-3">
                        {instruction.crypto_type && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Cryptocurrency:</span>
                            <Badge variant="outline">{instruction.crypto_type}</Badge>
                          </div>
                        )}
                        
                        {instruction.network && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Network:</span>
                            <Badge variant="outline">{instruction.network}</Badge>
                          </div>
                        )}
                        
                        {instruction.wallet_address && (
                          <div className="space-y-2">
                            <span className="font-medium">Wallet Address:</span>
                            <div className="flex items-center gap-2 p-2 bg-muted rounded font-mono text-sm break-all">
                              <span>{instruction.wallet_address}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(instruction.wallet_address!, 'Wallet address')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <Separator />

                    {/* Instructions Text */}
                    <div>
                      <h4 className="font-medium mb-2">Instructions:</h4>
                      <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                        {instruction.instructions}
                      </div>
                    </div>

                    {/* Important Notes */}
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="font-medium">Important Notes:</div>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Include the exact payment amount: <strong>${amount.toFixed(2)}</strong></li>
                            <li>Processing time: 1-3 business days for bank transfers, 10-60 minutes for crypto</li>
                            <li>Your subscription will be activated once payment is confirmed</li>
                            <li>Keep your transaction receipt for records</li>
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Complete your payment using the instructions above</li>
                <li>Keep your transaction receipt or confirmation number</li>
                <li>Your subscription will be automatically activated once payment is confirmed</li>
                <li>You'll receive an email confirmation when your subscription is active</li>
              </ol>
            </CardContent>
          </Card>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentInstructionsDialog;
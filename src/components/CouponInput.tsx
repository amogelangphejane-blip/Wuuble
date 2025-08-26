import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Tag, 
  Check, 
  X, 
  Loader2,
  Percent,
  DollarSign
} from 'lucide-react';
import { useCoupons } from '@/hooks/useCoupons';
import { CouponValidationResult } from '@/types/subscription';

interface CouponInputProps {
  communityId: string;
  subscriptionAmount: number;
  onCouponApplied: (couponId: string, discountAmount: number, couponCode: string) => void;
  onCouponRemoved: () => void;
  disabled?: boolean;
}

export const CouponInput: React.FC<CouponInputProps> = ({
  communityId,
  subscriptionAmount,
  onCouponApplied,
  onCouponRemoved,
  disabled = false
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    couponId: string;
    discountAmount: number;
    discountType?: 'percentage' | 'fixed_amount';
    discountValue?: number;
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { validateCoupon, validatingCoupon } = useCoupons(communityId);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setValidationError(null);
    
    const result: CouponValidationResult = await validateCoupon(couponCode, subscriptionAmount);
    
    if (result.valid && result.coupon_id && result.discount_amount) {
      setAppliedCoupon({
        code: couponCode.toUpperCase(),
        couponId: result.coupon_id,
        discountAmount: result.discount_amount
      });
      onCouponApplied(result.coupon_id, result.discount_amount, couponCode.toUpperCase());
      setCouponCode('');
    } else {
      setValidationError(result.error_message || 'Invalid coupon code');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setValidationError(null);
    onCouponRemoved();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  const getDiscountDisplay = () => {
    if (!appliedCoupon) return '';
    
    return `$${appliedCoupon.discountAmount.toFixed(2)} off`;
  };

  return (
    <div className="space-y-3">
      {!appliedCoupon ? (
        <div>
          <Label htmlFor="coupon-code" className="text-sm font-medium">
            Coupon Code
          </Label>
          <div className="flex gap-2 mt-1">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="coupon-code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="Enter coupon code"
                className="pl-10"
                disabled={disabled || validatingCoupon}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim() || disabled || validatingCoupon}
            >
              {validatingCoupon ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Apply'
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Label className="text-sm font-medium">Applied Coupon</Label>
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md mt-1">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {appliedCoupon.code}
                  </Badge>
                  <span className="text-sm font-medium text-green-700">
                    {getDiscountDisplay()}
                  </span>
                </div>
                <p className="text-xs text-green-600">
                  Coupon applied successfully
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveCoupon}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {validationError && (
        <Alert variant="destructive">
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {appliedCoupon && (
        <div className="text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subscriptionAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Discount ({appliedCoupon.code}):</span>
            <span>-${appliedCoupon.discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-foreground border-t pt-1 mt-1">
            <span>Total:</span>
            <span>${(subscriptionAmount - appliedCoupon.discountAmount).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponInput;
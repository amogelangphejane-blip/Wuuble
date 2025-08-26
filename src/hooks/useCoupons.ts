import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { handleError } from '@/utils/errorHandling';
import {
  SubscriptionCoupon,
  CouponUsage,
  CreateCouponRequest,
  UpdateCouponRequest,
  CouponValidationResult,
  CouponStats
} from '@/types/subscription';

export const useCoupons = (communityId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Fetch coupons for a community
  const {
    data: coupons,
    isLoading: couponsLoading,
    error: couponsError
  } = useQuery({
    queryKey: ['coupons', communityId],
    queryFn: async () => {
      if (!communityId) return [];
      
      const { data, error } = await supabase
        .from('subscription_coupons')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SubscriptionCoupon[];
    },
    enabled: !!communityId
  });

  // Fetch active coupons only
  const {
    data: activeCoupons,
    isLoading: activeCouponsLoading
  } = useQuery({
    queryKey: ['active-coupons', communityId],
    queryFn: async () => {
      if (!communityId) return [];
      
      const { data, error } = await supabase
        .from('subscription_coupons')
        .select('*')
        .eq('community_id', communityId)
        .eq('is_active', true)
        .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SubscriptionCoupon[];
    },
    enabled: !!communityId
  });

  // Fetch coupon usage for a community
  const {
    data: couponUsage,
    isLoading: usageLoading
  } = useQuery({
    queryKey: ['coupon-usage', communityId],
    queryFn: async () => {
      if (!communityId) return [];
      
      const { data, error } = await supabase
        .from('coupon_usage')
        .select(`
          *,
          coupon:subscription_coupons(*),
          user:auth.users(email)
        `)
        .in('coupon_id', coupons?.map(c => c.id) || [])
        .order('used_at', { ascending: false });

      if (error) throw error;
      return data as (CouponUsage & { user: { email: string } })[];
    },
    enabled: !!communityId && !!coupons?.length
  });

  // Fetch coupon statistics
  const {
    data: couponStats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ['coupon-stats', communityId],
    queryFn: async () => {
      if (!communityId) return null;
      
      const { data, error } = await supabase
        .rpc('get_coupon_stats', { p_community_id: communityId });

      if (error) throw error;
      return data[0] as CouponStats;
    },
    enabled: !!communityId
  });

  // Create coupon mutation
  const createCouponMutation = useMutation({
    mutationFn: async (couponData: CreateCouponRequest) => {
      const { data, error } = await supabase
        .from('subscription_coupons')
        .insert({
          ...couponData,
          code: couponData.code.toUpperCase()
        })
        .select()
        .single();

      if (error) throw error;
      return data as SubscriptionCoupon;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['coupons', communityId] });
      queryClient.invalidateQueries({ queryKey: ['active-coupons', communityId] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats', communityId] });
      toast({
        title: "Coupon created",
        description: `Coupon "${data.code}" has been created successfully.`
      });
    },
    onError: (error) => {
      console.error('Create coupon error:', error);
      const message = handleError(error, 'Failed to create coupon');
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    }
  });

  // Update coupon mutation
  const updateCouponMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateCouponRequest }) => {
      const { data, error } = await supabase
        .from('subscription_coupons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SubscriptionCoupon;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['coupons', communityId] });
      queryClient.invalidateQueries({ queryKey: ['active-coupons', communityId] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats', communityId] });
      toast({
        title: "Coupon updated",
        description: `Coupon "${data.code}" has been updated successfully.`
      });
    },
    onError: (error) => {
      console.error('Update coupon error:', error);
      const message = handleError(error, 'Failed to update coupon');
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    }
  });

  // Delete coupon mutation
  const deleteCouponMutation = useMutation({
    mutationFn: async (couponId: string) => {
      const { error } = await supabase
        .from('subscription_coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons', communityId] });
      queryClient.invalidateQueries({ queryKey: ['active-coupons', communityId] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats', communityId] });
      toast({
        title: "Coupon deleted",
        description: "Coupon has been deleted successfully."
      });
    },
    onError: (error) => {
      console.error('Delete coupon error:', error);
      const message = handleError(error, 'Failed to delete coupon');
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    }
  });

  // Validate coupon function
  const validateCoupon = async (
    couponCode: string, 
    subscriptionAmount: number
  ): Promise<CouponValidationResult> => {
    if (!communityId || !user) {
      return { valid: false, error_message: 'Authentication required' };
    }

    setValidatingCoupon(true);
    
    try {
      const { data, error } = await supabase
        .rpc('validate_and_apply_coupon', {
          p_coupon_code: couponCode.toUpperCase(),
          p_user_id: user.id,
          p_community_id: communityId,
          p_subscription_amount: subscriptionAmount
        });

      if (error) throw error;
      
      const result = data[0] as CouponValidationResult;
      
      if (result.valid) {
        toast({
          title: "Coupon applied",
          description: `Discount of $${result.discount_amount?.toFixed(2)} applied successfully.`
        });
      } else {
        toast({
          title: "Invalid coupon",
          description: result.error_message || 'Coupon code is not valid.',
          variant: "destructive"
        });
      }
      
      return result;
    } catch (error) {
      console.error('Coupon validation error:', error);
      const errorMessage = handleError(error, 'Failed to validate coupon');
      return { valid: false, error_message: errorMessage };
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Record coupon usage function
  const recordCouponUsage = async (
    couponId: string,
    subscriptionId: string,
    discountAmount: number
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .rpc('record_coupon_usage', {
          p_coupon_id: couponId,
          p_user_id: user.id,
          p_subscription_id: subscriptionId,
          p_discount_amount: discountAmount
        });

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['coupon-usage', communityId] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats', communityId] });
      
      return data as boolean;
    } catch (error) {
      console.error('Record coupon usage error:', error);
      return false;
    }
  };

  return {
    // Data
    coupons,
    activeCoupons,
    couponUsage,
    couponStats,
    
    // Loading states
    couponsLoading,
    activeCouponsLoading,
    usageLoading,
    statsLoading,
    validatingCoupon,
    
    // Mutations
    createCoupon: createCouponMutation.mutate,
    updateCoupon: updateCouponMutation.mutate,
    deleteCoupon: deleteCouponMutation.mutate,
    isCreatingCoupon: createCouponMutation.isPending,
    isUpdatingCoupon: updateCouponMutation.isPending,
    isDeletingCoupon: deleteCouponMutation.isPending,
    
    // Functions
    validateCoupon,
    recordCouponUsage,
    
    // Errors
    couponsError
  };
};

export default useCoupons;
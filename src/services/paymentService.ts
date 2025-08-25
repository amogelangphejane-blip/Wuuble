import { supabase } from '@/integrations/supabase/client';
import type { DigitalProduct, ProductOrder, CheckoutSession, PaymentIntent } from '@/types/store';

// Mock payment service - replace with actual Stripe/PayPal integration
export class PaymentService {
  private static instance: PaymentService;
  
  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  // Create a checkout session
  async createCheckoutSession(
    product: DigitalProduct,
    quantity: number = 1
  ): Promise<CheckoutSession> {
    const totalAmount = product.price * quantity;
    
    // In a real implementation, this would create a Stripe checkout session
    // or PayPal payment intent
    const paymentIntent = await this.createPaymentIntent(totalAmount);
    
    return {
      product_id: product.id,
      quantity,
      total_amount: totalAmount,
      payment_intent: paymentIntent,
    };
  }

  // Create payment intent (mock implementation)
  private async createPaymentIntent(amount: number): Promise<PaymentIntent> {
    // Mock payment intent - in production, this would call Stripe API
    return {
      id: `pi_mock_${Date.now()}`,
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      status: 'requires_payment_method',
      client_secret: `pi_mock_${Date.now()}_secret`,
    };
  }

  // Process payment (mock implementation)
  async processPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> {
    // Mock payment processing
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 90% success rate
        const success = Math.random() > 0.1;
        
        if (success) {
          resolve({ success: true });
        } else {
          resolve({ 
            success: false, 
            error: 'Payment failed. Please try again.' 
          });
        }
      }, 2000); // Simulate processing time
    });
  }

  // Complete purchase and create order
  async completePurchase(
    productId: string,
    paymentIntentId: string,
    quantity: number = 1
  ): Promise<{ success: boolean; order?: ProductOrder; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get product details
      const { data: product, error: productError } = await supabase
        .from('digital_products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (productError || !product) {
        return { success: false, error: 'Product not found' };
      }

      const totalAmount = product.price * quantity;

      // Create order record
      const { data: order, error: orderError } = await supabase
        .from('product_orders')
        .insert({
          buyer_id: user.id,
          seller_id: product.seller_id,
          product_id: productId,
          quantity,
          unit_price: product.price,
          total_amount: totalAmount,
          status: 'completed',
          payment_intent_id: paymentIntentId,
          payment_method: 'mock_payment',
        })
        .select()
        .single();

      if (orderError) {
        return { success: false, error: orderError.message };
      }

      // Create download record
      const { error: downloadError } = await supabase
        .from('product_downloads')
        .insert({
          order_id: order.id,
          buyer_id: user.id,
          product_id: productId,
          download_count: 0,
        });

      if (downloadError) {
        console.warn('Failed to create download record:', downloadError);
      }

      return { success: true, order };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Purchase failed' 
      };
    }
  }

  // Get download URL for purchased product
  async getDownloadUrl(orderId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Verify user owns this order
      const { data: order, error: orderError } = await supabase
        .from('product_orders')
        .select(`
          *,
          product:digital_products(*)
        `)
        .eq('id', orderId)
        .eq('buyer_id', user.id)
        .eq('status', 'completed')
        .single();

      if (orderError || !order) {
        return { success: false, error: 'Order not found or not accessible' };
      }

      // Check download limits
      const { data: downloadRecord } = await supabase
        .from('product_downloads')
        .select('*')
        .eq('order_id', orderId)
        .eq('buyer_id', user.id)
        .single();

      if (downloadRecord && order.product.download_limit) {
        if (downloadRecord.download_count >= order.product.download_limit) {
          return { success: false, error: 'Download limit exceeded' };
        }
      }

      // Get signed URL for the product file
      const { data: urlData } = supabase.storage
        .from('digital-products')
        .createSignedUrl(order.product.file_url, 3600); // 1 hour expiry

      if (!urlData?.signedUrl) {
        return { success: false, error: 'Failed to generate download URL' };
      }

      // Update download count
      if (downloadRecord) {
        await supabase
          .from('product_downloads')
          .update({
            download_count: downloadRecord.download_count + 1,
            last_downloaded_at: new Date().toISOString(),
          })
          .eq('id', downloadRecord.id);
      }

      return { success: true, url: urlData.signedUrl };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get download URL' 
      };
    }
  }

  // Refund order (mock implementation)
  async refundOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Update order status to refunded
      const { error } = await supabase
        .from('product_orders')
        .update({ status: 'refunded' })
        .eq('id', orderId)
        .eq('seller_id', user.id); // Only seller can refund

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Refund failed' 
      };
    }
  }

  // Get payment methods (mock implementation)
  async getPaymentMethods(): Promise<string[]> {
    return ['credit_card', 'paypal', 'apple_pay', 'google_pay'];
  }

  // Validate payment method (mock implementation)
  async validatePaymentMethod(paymentMethodId: string): Promise<boolean> {
    // Mock validation - always return true
    return Promise.resolve(true);
  }
}

export const paymentService = PaymentService.getInstance();
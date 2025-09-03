// Comprehensive Subscription Fix and Test Script
// This script identifies and fixes subscription issues
// Run this in the browser console after loading the application

console.log('🔧 Subscription Issue Fix and Test Script');
console.log('==========================================');

class SubscriptionFixer {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.testResults = {};
  }

  // Check if user is authenticated and has proper access
  async checkAuthentication() {
    console.log('👤 Checking Authentication...');
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        this.issues.push('Not authenticated - please log in first');
        return false;
      }
      
      console.log('✅ User authenticated:', user.email);
      this.user = user;
      return true;
    } catch (error) {
      this.issues.push(`Authentication check failed: ${error.message}`);
      return false;
    }
  }

  // Find or create a test community
  async ensureTestCommunity() {
    console.log('🏢 Checking for test community...');
    
    try {
      // Check if user has any communities where they are creator
      const { data: communities, error } = await supabase
        .from('communities')
        .select('id, name, creator_id, is_private')
        .eq('creator_id', this.user.id)
        .limit(1);

      if (error) throw error;

      if (communities && communities.length > 0) {
        this.testCommunity = communities[0];
        console.log('✅ Using existing community:', this.testCommunity.name);
        return true;
      }

      // Create a test community if none exists
      const { data: newCommunity, error: createError } = await supabase
        .from('communities')
        .insert({
          name: 'Test Community for Subscriptions',
          description: 'Test community created for subscription testing',
          is_private: false
        })
        .select()
        .single();

      if (createError) throw createError;

      this.testCommunity = newCommunity;
      console.log('✅ Created test community:', this.testCommunity.name);
      return true;
    } catch (error) {
      this.issues.push(`Community setup failed: ${error.message}`);
      return false;
    }
  }

  // Test subscription plan creation
  async testSubscriptionPlanCreation() {
    console.log('📝 Testing subscription plan creation...');
    
    const testPlan = {
      community_id: this.testCommunity.id,
      name: 'Test Premium Plan ' + Date.now(),
      description: 'Test plan for subscription functionality',
      price_monthly: 9.99,
      price_yearly: 99.99,
      trial_days: 7,
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      is_active: true
    };

    try {
      const { data, error } = await supabase
        .from('community_subscription_plans')
        .insert(testPlan)
        .select()
        .single();

      if (error) {
        console.error('❌ Plan creation failed:', error);
        this.testResults.planCreation = {
          success: false,
          error: error,
          errorMessage: this.processError(error)
        };
        return false;
      }

      console.log('✅ Plan created successfully:', data.name);
      this.testPlan = data;
      this.testResults.planCreation = { success: true, data };
      return true;
    } catch (error) {
      console.error('❌ Exception during plan creation:', error);
      this.testResults.planCreation = {
        success: false,
        error: error,
        errorMessage: error.message
      };
      return false;
    }
  }

  // Test subscription creation
  async testSubscriptionCreation() {
    console.log('💳 Testing subscription creation...');
    
    if (!this.testPlan) {
      console.log('⏭️ Skipping subscription test - no plan available');
      return false;
    }

    const subscriptionData = {
      community_id: this.testCommunity.id,
      plan_id: this.testPlan.id,
      billing_cycle: 'monthly',
      status: 'trial',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      trial_start: new Date().toISOString(),
      trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('community_member_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) {
        console.error('❌ Subscription creation failed:', error);
        this.testResults.subscriptionCreation = {
          success: false,
          error: error,
          errorMessage: this.processError(error)
        };
        return false;
      }

      console.log('✅ Subscription created successfully');
      this.testSubscription = data;
      this.testResults.subscriptionCreation = { success: true, data };
      return true;
    } catch (error) {
      console.error('❌ Exception during subscription creation:', error);
      this.testResults.subscriptionCreation = {
        success: false,
        error: error,
        errorMessage: error.message
      };
      return false;
    }
  }

  // Test database functions
  async testDatabaseFunctions() {
    console.log('🗄️ Testing database functions...');
    
    if (!this.testCommunity) {
      console.log('⏭️ Skipping database function tests - no community available');
      return false;
    }

    try {
      // Test has_active_subscription function
      const { data: hasActive, error: hasActiveError } = await supabase
        .rpc('has_active_subscription', {
          p_community_id: this.testCommunity.id,
          p_user_id: this.user.id
        });

      if (hasActiveError) throw hasActiveError;

      console.log('✅ has_active_subscription function works:', hasActive);

      // Test get_subscription_status function
      const { data: status, error: statusError } = await supabase
        .rpc('get_subscription_status', {
          p_community_id: this.testCommunity.id,
          p_user_id: this.user.id
        });

      if (statusError) throw statusError;

      console.log('✅ get_subscription_status function works:', status);
      
      this.testResults.databaseFunctions = { success: true, hasActive, status };
      return true;
    } catch (error) {
      console.error('❌ Database function test failed:', error);
      this.testResults.databaseFunctions = {
        success: false,
        error: error,
        errorMessage: this.processError(error)
      };
      return false;
    }
  }

  // Test payment processing
  async testPaymentProcessing() {
    console.log('💰 Testing payment processing...');
    
    if (!this.testSubscription) {
      console.log('⏭️ Skipping payment test - no subscription available');
      return false;
    }

    try {
      // Test mock payment processing
      const paymentData = {
        subscription_id: this.testSubscription.id,
        amount: 9.99,
        currency: 'USD',
        status: 'completed',
        payment_method: 'test',
        due_date: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('subscription_payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Payment record created successfully');
      this.testPayment = data;
      this.testResults.paymentProcessing = { success: true, data };
      return true;
    } catch (error) {
      console.error('❌ Payment processing test failed:', error);
      this.testResults.paymentProcessing = {
        success: false,
        error: error,
        errorMessage: this.processError(error)
      };
      return false;
    }
  }

  // Process errors to provide meaningful messages
  processError(error) {
    if (!error) return 'Unknown error';

    // Handle RLS violations
    if (error.message?.includes('violates row-level security') || error.message?.includes('RLS')) {
      return 'Access denied - insufficient permissions. Make sure you are the community creator.';
    }

    // Handle foreign key violations
    if (error.code === '23503') {
      return 'Invalid reference - the community or plan may not exist or you may not have access to it.';
    }

    // Handle unique constraint violations
    if (error.code === '23505') {
      return 'Duplicate entry - a subscription plan with this name already exists.';
    }

    // Handle check constraint violations
    if (error.message?.includes('check constraint')) {
      return 'Invalid data - please check all required fields are properly filled.';
    }

    // Return the original message or a fallback
    return error.message || error.error_description || 'An unexpected error occurred';
  }

  // Clean up test data
  async cleanup() {
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Delete test payment
      if (this.testPayment) {
        await supabase
          .from('subscription_payments')
          .delete()
          .eq('id', this.testPayment.id);
        console.log('✅ Cleaned up test payment');
      }

      // Delete test subscription
      if (this.testSubscription) {
        await supabase
          .from('community_member_subscriptions')
          .delete()
          .eq('id', this.testSubscription.id);
        console.log('✅ Cleaned up test subscription');
      }

      // Delete test plan
      if (this.testPlan) {
        await supabase
          .from('community_subscription_plans')
          .delete()
          .eq('id', this.testPlan.id);
        console.log('✅ Cleaned up test plan');
      }

      // Note: We don't delete the test community as it might be useful for further testing

    } catch (error) {
      console.warn('⚠️ Some cleanup operations failed:', error.message);
    }
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n📊 SUBSCRIPTION FUNCTIONALITY REPORT');
    console.log('=====================================');
    
    console.log('\n🎯 Test Results:');
    Object.entries(this.testResults).forEach(([test, result]) => {
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} ${test}`);
      
      if (!result.success && result.errorMessage) {
        console.log(`   Error: ${result.errorMessage}`);
      }
    });

    if (this.issues.length > 0) {
      console.log('\n⚠️ Issues Identified:');
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }

    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(r => r.success).length;
    
    console.log(`\n📈 Overall Score: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All subscription functionality tests passed!');
      console.log('✅ Your subscription system appears to be working correctly.');
    } else {
      console.log('\n💡 Recommendations:');
      
      if (!this.testResults.planCreation?.success) {
        console.log('• Check RLS policies for community_subscription_plans table');
        console.log('• Ensure you are the creator of the community');
        console.log('• Verify all required fields are provided');
      }
      
      if (!this.testResults.subscriptionCreation?.success) {
        console.log('• Check RLS policies for community_member_subscriptions table');
        console.log('• Ensure the subscription plan exists and is active');
      }
      
      if (!this.testResults.databaseFunctions?.success) {
        console.log('• Check if database functions exist and have proper permissions');
        console.log('• Run the subscription migration if not already done');
      }
      
      if (!this.testResults.paymentProcessing?.success) {
        console.log('• Check RLS policies for subscription_payments table');
        console.log('• Ensure payment service is properly configured');
      }
    }

    console.log('\n🔗 Next Steps:');
    console.log('1. Fix any failed tests based on the recommendations above');
    console.log('2. Test the subscription UI in your application');
    console.log('3. Verify error messages are user-friendly');
    console.log('4. Test the complete subscription flow from UI');
  }

  // Main test runner
  async runAllTests() {
    console.log('🚀 Starting comprehensive subscription tests...');
    
    const tests = [
      'checkAuthentication',
      'ensureTestCommunity',
      'testSubscriptionPlanCreation',
      'testSubscriptionCreation',
      'testDatabaseFunctions',
      'testPaymentProcessing'
    ];

    for (const test of tests) {
      try {
        const result = await this[test]();
        if (!result && test === 'checkAuthentication') {
          console.log('❌ Authentication failed, stopping tests');
          break;
        }
      } catch (error) {
        console.error(`❌ Test ${test} threw an exception:`, error);
        this.testResults[test] = {
          success: false,
          error: error,
          errorMessage: error.message
        };
      }
    }

    // Generate report
    this.generateReport();
    
    // Cleanup
    await this.cleanup();
    
    return this.testResults;
  }
}

// Create global instance and helper functions
window.subscriptionFixer = new SubscriptionFixer();

window.fixSubscriptionIssues = {
  runAllTests: () => window.subscriptionFixer.runAllTests(),
  checkAuth: () => window.subscriptionFixer.checkAuthentication(),
  testPlans: () => window.subscriptionFixer.testSubscriptionPlanCreation(),
  testSubscriptions: () => window.subscriptionFixer.testSubscriptionCreation(),
  testFunctions: () => window.subscriptionFixer.testDatabaseFunctions(),
  testPayments: () => window.subscriptionFixer.testPaymentProcessing(),
  cleanup: () => window.subscriptionFixer.cleanup(),
  getResults: () => window.subscriptionFixer.testResults
};

console.log('✨ Subscription Fix and Test Tools Loaded!');
console.log('🎯 Quick start: fixSubscriptionIssues.runAllTests()');
console.log('📋 Individual tests available:');
console.log('  - fixSubscriptionIssues.checkAuth()');
console.log('  - fixSubscriptionIssues.testPlans()');
console.log('  - fixSubscriptionIssues.testSubscriptions()');
console.log('  - fixSubscriptionIssues.testFunctions()');
console.log('  - fixSubscriptionIssues.testPayments()');
console.log('  - fixSubscriptionIssues.cleanup()');
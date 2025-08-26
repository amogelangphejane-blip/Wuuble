// Debug script for subscription plan creation
// Run this in the browser console to test subscription creation

console.log('🔍 Debugging Subscription Plan Creation');

// Test data that should work
const testPlanData = {
  community_id: 'test-community-id', // Replace with actual community ID
  name: 'Test Premium Plan',
  description: 'A test premium plan for debugging',
  price_monthly: 9.99,
  price_yearly: 99.99,
  trial_days: 7,
  features: ['Feature 1', 'Feature 2', 'Feature 3'],
  max_members: 100
};

async function testSubscriptionCreation() {
  try {
    console.log('📝 Testing with data:', testPlanData);
    
    // Check if we have supabase client
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase client not available');
      return;
    }
    
    // Test the database insert directly
    const { data, error } = await supabase
      .from('community_subscription_plans')
      .insert(testPlanData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Database error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('✅ Success! Created plan:', data);
    }
    
  } catch (error) {
    console.error('❌ Exception caught:', error);
    console.error('Error type:', typeof error);
    console.error('Error message:', error?.message);
  }
}

// Also test form validation
function testFormValidation() {
  console.log('🔍 Testing form validation scenarios...');
  
  const testCases = [
    {
      name: 'Empty name',
      data: { ...testPlanData, name: '' }
    },
    {
      name: 'No features',
      data: { ...testPlanData, features: [] }
    },
    {
      name: 'No pricing',
      data: { ...testPlanData, price_monthly: undefined, price_yearly: undefined }
    },
    {
      name: 'Invalid trial days',
      data: { ...testPlanData, trial_days: -1 }
    }
  ];
  
  testCases.forEach(testCase => {
    console.log(`Testing: ${testCase.name}`, testCase.data);
  });
}

// Export functions for manual testing
window.debugSubscription = {
  testSubscriptionCreation,
  testFormValidation,
  testPlanData
};

console.log('🚀 Debug functions available:');
console.log('- debugSubscription.testSubscriptionCreation()');
console.log('- debugSubscription.testFormValidation()');
console.log('- debugSubscription.testPlanData');
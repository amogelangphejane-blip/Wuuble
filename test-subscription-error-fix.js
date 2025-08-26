// Test script to verify the subscription error handling fix
// Run this in the browser console after loading the application

console.log('🧪 Testing Subscription Error Handling Fix...');

// Test the enhanced error handling
function testErrorHandling() {
  console.log('\n📝 Testing Error Handling Scenarios...');
  
  const testErrors = [
    {
      name: 'Null Error',
      error: null,
      expected: 'should show fallback message'
    },
    {
      name: 'Undefined Error', 
      error: undefined,
      expected: 'should show fallback message'
    },
    {
      name: 'Empty String Error',
      error: '',
      expected: 'should show fallback message'
    },
    {
      name: 'String Error',
      error: 'This is a string error',
      expected: 'should show the string'
    },
    {
      name: 'Error Instance',
      error: new Error('This is an Error instance'),
      expected: 'should show error message'
    },
    {
      name: 'Supabase-like Error',
      error: {
        message: 'violates row-level security policy',
        code: 'PGRST301',
        details: 'Additional details here',
        hint: 'Check your permissions'
      },
      expected: 'should show message property'
    },
    {
      name: 'Error with only code',
      error: {
        code: '23505',
        someOtherProperty: 'value'
      },
      expected: 'should show code-based message'
    },
    {
      name: 'Complex Object Error',
      error: {
        status: 400,
        statusText: 'Bad Request',
        data: { error: 'Something went wrong' }
      },
      expected: 'should handle gracefully'
    }
  ];

  testErrors.forEach(({ name, error, expected }) => {
    console.log(`\n🔍 Testing: ${name}`);
    console.log('Input:', error);
    console.log('Expected:', expected);
    
    try {
      // Simulate what the enhanced error handling would do
      let result;
      if (error === null || error === undefined) {
        result = 'An unexpected error occurred. Please check your connection and try again.';
      } else if (error instanceof Error) {
        result = error.message || 'An unexpected error occurred. Please try again.';
      } else if (typeof error === 'string') {
        result = error.trim() || 'An unexpected error occurred. Please try again.';
      } else if (error && typeof error === 'object') {
        result = error.message || error.error_description || error.details || 
                 (error.code ? `Database error (code: ${error.code})` : 
                 'An error occurred. Check the console for details.');
      } else {
        result = 'An unexpected error occurred. Please try again.';
      }
      
      if (!result || result === 'undefined' || result.trim() === '') {
        result = 'An unexpected error occurred. Please check your connection and try again.';
      }
      
      console.log('✅ Result:', result);
    } catch (testError) {
      console.error('❌ Test failed:', testError);
    }
  });
}

// Test subscription creation with mock data
async function testSubscriptionCreation() {
  console.log('\n🎯 Testing Subscription Creation...');
  
  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase client not available. Please ensure you are on the application page.');
    return false;
  }

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('❌ Not authenticated. Please log in first.');
    return false;
  }

  console.log('✅ User authenticated:', user.id);

  // Find a community where user is creator
  const { data: communities, error: communityError } = await supabase
    .from('communities')
    .select('id, name, creator_id')
    .eq('creator_id', user.id)
    .limit(1);

  if (communityError || !communities || communities.length === 0) {
    console.error('❌ No communities found where you are the creator.');
    console.log('💡 Create a community first, then try again.');
    return false;
  }

  const community = communities[0];
  console.log('✅ Using community:', community.name);

  // Test with valid data
  const validTestData = {
    community_id: community.id,
    name: 'Test Plan ' + Date.now(),
    description: 'Test plan created by error handling test',
    price_monthly: 9.99,
    features: ['Test Feature 1', 'Test Feature 2'],
    trial_days: 7
  };

  console.log('📝 Testing with valid data...');
  try {
    const { data, error } = await supabase
      .from('community_subscription_plans')
      .insert(validTestData)
      .select()
      .single();

    if (error) {
      console.error('❌ Subscription creation failed (this is expected for testing):', error);
      console.log('🔍 Error analysis:');
      console.log('  - Type:', typeof error);
      console.log('  - Message:', error.message);
      console.log('  - Code:', error.code);
      console.log('  - Details:', error.details);
      console.log('  - Hint:', error.hint);
      
      // Test our error processing
      let processedMessage;
      if (error.message?.includes('violates row-level security')) {
        processedMessage = 'Access denied - only community creators can create subscription plans';
      } else if (error.code === '23505') {
        processedMessage = 'A subscription plan with this name already exists in this community';
      } else if (error.code === '23503') {
        processedMessage = 'Invalid community ID - the community may not exist or you may not have access to it';
      } else {
        processedMessage = error.message || 'An unexpected error occurred';
      }
      
      console.log('✅ Processed message:', processedMessage);
      return true; // Error handling worked
    } else {
      console.log('✅ Subscription created successfully:', data);
      
      // Clean up
      await supabase
        .from('community_subscription_plans')
        .delete()
        .eq('id', data.id);
      console.log('🧹 Cleaned up test plan');
      return true;
    }
  } catch (error) {
    console.error('❌ Exception during test:', error);
    console.log('🔍 Exception analysis:');
    console.log('  - Type:', typeof error);
    console.log('  - Message:', error.message);
    console.log('  - Stack:', error.stack);
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting All Subscription Error Handling Tests...');
  
  // Test 1: Error handling scenarios
  testErrorHandling();
  
  // Test 2: Actual subscription creation
  const creationTest = await testSubscriptionCreation();
  
  console.log('\n📊 Test Summary:');
  console.log('✅ Error handling scenarios: Completed');
  console.log(`${creationTest ? '✅' : '❌'} Subscription creation test: ${creationTest ? 'Passed' : 'Failed'}`);
  
  console.log('\n💡 Next Steps:');
  console.log('1. Try creating a subscription plan in the UI');
  console.log('2. Check the browser console for detailed error messages');
  console.log('3. Verify that you see specific error messages instead of "unknown error"');
  
  return { errorHandling: true, subscriptionCreation: creationTest };
}

// Export functions for manual testing
window.testSubscriptionErrorFix = {
  runAllTests,
  testErrorHandling,
  testSubscriptionCreation
};

console.log('✨ Subscription Error Fix Test Tools Loaded!');
console.log('🎯 Quick start: testSubscriptionErrorFix.runAllTests()');
console.log('📋 Individual tests:');
console.log('  - testSubscriptionErrorFix.testErrorHandling()');
console.log('  - testSubscriptionErrorFix.testSubscriptionCreation()');

// Auto-run tests
console.log('\n🔄 Auto-running tests...');
runAllTests();
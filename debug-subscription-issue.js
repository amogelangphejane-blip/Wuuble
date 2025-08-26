// Comprehensive subscription creation debug script
// Run this in the browser console to diagnose the "unknown error occurred" issue

console.log('🔍 Starting comprehensive subscription creation debug...');

// Test configuration
const DEBUG_CONFIG = {
  communityId: 'test-community-id', // Replace with actual community ID
  testPlanData: {
    name: 'Debug Test Plan',
    description: 'A test plan for debugging subscription creation',
    price_monthly: 9.99,
    price_yearly: 99.99,
    trial_days: 7,
    features: ['Debug Feature 1', 'Debug Feature 2'],
    max_members: 100
  }
};

// Step 1: Check Supabase client availability
function checkSupabaseClient() {
  console.log('📡 Step 1: Checking Supabase client...');
  
  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase client not available globally');
    console.log('💡 Try importing: import { supabase } from "@/integrations/supabase/client"');
    return false;
  }
  
  console.log('✅ Supabase client is available');
  console.log('🔗 Supabase URL:', supabase.supabaseUrl);
  return true;
}

// Step 2: Check user authentication
async function checkAuthentication() {
  console.log('👤 Step 2: Checking user authentication...');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Auth error:', error);
      return null;
    }
    
    if (!user) {
      console.error('❌ No authenticated user found');
      console.log('💡 Please log in first');
      return null;
    }
    
    console.log('✅ User authenticated:', user.id);
    console.log('📧 Email:', user.email);
    return user;
  } catch (error) {
    console.error('❌ Exception checking authentication:', error);
    return null;
  }
}

// Step 3: Check community access
async function checkCommunityAccess(communityId, user) {
  console.log('🏢 Step 3: Checking community access...');
  
  try {
    // Check if community exists
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, name, creator_id, is_private')
      .eq('id', communityId)
      .single();
    
    if (communityError) {
      console.error('❌ Community query error:', communityError);
      return { exists: false, isCreator: false };
    }
    
    if (!community) {
      console.error('❌ Community not found:', communityId);
      return { exists: false, isCreator: false };
    }
    
    console.log('✅ Community found:', community.name);
    
    const isCreator = community.creator_id === user.id;
    console.log('👑 Is creator:', isCreator);
    
    if (!isCreator) {
      console.warn('⚠️  User is not the community creator');
      console.log('💡 Only community creators can create subscription plans');
    }
    
    return { 
      exists: true, 
      isCreator, 
      community,
      canCreatePlans: isCreator 
    };
  } catch (error) {
    console.error('❌ Exception checking community access:', error);
    return { exists: false, isCreator: false };
  }
}

// Step 4: Test RLS policies
async function testRLSPolicies(communityId, user) {
  console.log('🔒 Step 4: Testing RLS policies...');
  
  try {
    // Test SELECT policy on subscription plans
    const { data: plans, error: selectError } = await supabase
      .from('community_subscription_plans')
      .select('*')
      .eq('community_id', communityId);
    
    if (selectError) {
      console.error('❌ RLS SELECT policy failed:', selectError);
      return false;
    }
    
    console.log('✅ RLS SELECT policy working, found', plans?.length || 0, 'plans');
    
    // Test INSERT policy with minimal data
    const testInsertData = {
      community_id: communityId,
      name: 'RLS Test Plan - DELETE ME',
      features: ['Test Feature']
    };
    
    const { data: insertTest, error: insertError } = await supabase
      .from('community_subscription_plans')
      .insert(testInsertData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ RLS INSERT policy failed:', insertError);
      console.log('🔍 Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      return false;
    }
    
    console.log('✅ RLS INSERT policy working, created test plan:', insertTest.id);
    
    // Clean up test plan
    await supabase
      .from('community_subscription_plans')
      .delete()
      .eq('id', insertTest.id);
    
    console.log('🧹 Cleaned up test plan');
    return true;
  } catch (error) {
    console.error('❌ Exception testing RLS policies:', error);
    return false;
  }
}

// Step 5: Test subscription creation with detailed error handling
async function testSubscriptionCreation(communityId, planData) {
  console.log('🎯 Step 5: Testing subscription creation...');
  
  const fullPlanData = {
    ...planData,
    community_id: communityId
  };
  
  console.log('📝 Plan data:', fullPlanData);
  
  try {
    const { data, error } = await supabase
      .from('community_subscription_plans')
      .insert(fullPlanData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Subscription creation failed:', error);
      
      // Detailed error analysis
      console.log('🔍 Error Analysis:');
      console.log('  Code:', error.code);
      console.log('  Message:', error.message);
      console.log('  Details:', error.details);
      console.log('  Hint:', error.hint);
      
      // Common error interpretations
      const errorMappings = {
        '23503': 'Foreign key constraint violation (invalid community_id)',
        '23505': 'Unique constraint violation (duplicate plan name)',
        '42501': 'Permission denied (RLS policy violation)',
        'PGRST301': 'Row Level Security policy violation'
      };
      
      const interpretation = errorMappings[error.code] || 'Unknown error type';
      console.log('  Interpretation:', interpretation);
      
      return { success: false, error, interpretation };
    }
    
    console.log('✅ Subscription creation successful!');
    console.log('📋 Created plan:', data);
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception during subscription creation:', error);
    return { success: false, error, interpretation: 'JavaScript exception' };
  }
}

// Step 6: Test database functions
async function testDatabaseFunctions(communityId, user) {
  console.log('⚙️ Step 6: Testing database functions...');
  
  try {
    // Test has_active_subscription function
    const { data: hasActiveResult, error: hasActiveError } = await supabase
      .rpc('has_active_subscription', {
        p_community_id: communityId,
        p_user_id: user.id
      });
    
    if (hasActiveError) {
      console.error('❌ has_active_subscription function error:', hasActiveError);
    } else {
      console.log('✅ has_active_subscription function working:', hasActiveResult);
    }
    
    // Test get_subscription_status function
    const { data: statusResult, error: statusError } = await supabase
      .rpc('get_subscription_status', {
        p_community_id: communityId,
        p_user_id: user.id
      });
    
    if (statusError) {
      console.error('❌ get_subscription_status function error:', statusError);
    } else {
      console.log('✅ get_subscription_status function working:', statusResult);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Exception testing database functions:', error);
    return false;
  }
}

// Main debug function
async function runComprehensiveDebug(communityId = DEBUG_CONFIG.communityId) {
  console.log('🚀 Starting comprehensive subscription debug...');
  console.log('🎯 Community ID:', communityId);
  
  const results = {
    supabaseClient: false,
    authentication: false,
    communityAccess: false,
    rlsPolicies: false,
    subscriptionCreation: false,
    databaseFunctions: false
  };
  
  // Step 1: Check Supabase client
  results.supabaseClient = checkSupabaseClient();
  if (!results.supabaseClient) return results;
  
  // Step 2: Check authentication
  const user = await checkAuthentication();
  if (!user) return results;
  results.authentication = true;
  
  // Step 3: Check community access
  const communityAccess = await checkCommunityAccess(communityId, user);
  if (!communityAccess.exists) {
    console.error('❌ Cannot proceed without valid community access');
    return results;
  }
  results.communityAccess = true;
  
  if (!communityAccess.canCreatePlans) {
    console.warn('⚠️  User cannot create subscription plans, but continuing with tests...');
  }
  
  // Step 4: Test RLS policies
  results.rlsPolicies = await testRLSPolicies(communityId, user);
  
  // Step 5: Test subscription creation
  const creationResult = await testSubscriptionCreation(communityId, DEBUG_CONFIG.testPlanData);
  results.subscriptionCreation = creationResult.success;
  
  if (!creationResult.success) {
    console.log('💡 Subscription creation failed. Error details:');
    console.log('   Error:', creationResult.error);
    console.log('   Interpretation:', creationResult.interpretation);
  }
  
  // Step 6: Test database functions
  results.databaseFunctions = await testDatabaseFunctions(communityId, user);
  
  // Summary
  console.log('\n📊 Debug Summary:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const totalPassed = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${totalPassed}/${totalTests} tests passed`);
  
  if (totalPassed === totalTests) {
    console.log('🎉 All tests passed! Subscription creation should work.');
  } else {
    console.log('⚠️  Some tests failed. Please address the issues above.');
  }
  
  return results;
}

// Export for manual testing
window.debugSubscriptionIssue = {
  runComprehensiveDebug,
  checkSupabaseClient,
  checkAuthentication,
  checkCommunityAccess,
  testRLSPolicies,
  testSubscriptionCreation,
  testDatabaseFunctions,
  DEBUG_CONFIG
};

console.log('✨ Debug tools loaded! Available functions:');
console.log('- debugSubscriptionIssue.runComprehensiveDebug(communityId)');
console.log('- debugSubscriptionIssue.checkSupabaseClient()');
console.log('- debugSubscriptionIssue.checkAuthentication()');
console.log('- debugSubscriptionIssue.checkCommunityAccess(communityId, user)');
console.log('- debugSubscriptionIssue.testRLSPolicies(communityId, user)');
console.log('- debugSubscriptionIssue.testSubscriptionCreation(communityId, planData)');
console.log('- debugSubscriptionIssue.testDatabaseFunctions(communityId, user)');
console.log('\n🎯 Quick start: debugSubscriptionIssue.runComprehensiveDebug("your-community-id")');
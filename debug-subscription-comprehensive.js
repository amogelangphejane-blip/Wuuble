// Comprehensive subscription creation debug script
// This script will help identify the exact source of the "unknown error"
// Run this in the browser console after loading the application

console.log('🔍 Starting Comprehensive Subscription Debug Analysis...');

class SubscriptionDebugger {
  constructor() {
    this.results = {};
    this.communityId = null;
    this.user = null;
  }

  // Step 1: Environment Check
  async checkEnvironment() {
    console.log('🌐 Step 1: Checking Environment...');
    
    const checks = {
      supabaseClient: typeof supabase !== 'undefined',
      reactQuery: typeof window.React !== 'undefined',
      errorHandlingUtil: false
    };

    // Check if error handling utility is available
    try {
      if (typeof window.handleError === 'function') {
        checks.errorHandlingUtil = true;
      }
    } catch (e) {
      console.log('Error handling utility not available globally');
    }

    console.log('Environment checks:', checks);
    this.results.environment = checks;
    return checks;
  }

  // Step 2: Authentication Check
  async checkAuthentication() {
    console.log('👤 Step 2: Checking Authentication...');
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Auth error:', error);
        this.results.auth = { success: false, error };
        return false;
      }
      
      if (!user) {
        console.error('❌ No authenticated user');
        this.results.auth = { success: false, error: 'No user' };
        return false;
      }
      
      console.log('✅ User authenticated:', user.id);
      this.user = user;
      this.results.auth = { success: true, user: user.id };
      return true;
    } catch (error) {
      console.error('❌ Exception checking auth:', error);
      this.results.auth = { success: false, error: error.message };
      return false;
    }
  }

  // Step 3: Find Valid Community
  async findValidCommunity() {
    console.log('🏢 Step 3: Finding Valid Community...');
    
    try {
      // Get communities where user is creator
      const { data: communities, error } = await supabase
        .from('communities')
        .select('id, name, creator_id, is_private')
        .eq('creator_id', this.user.id)
        .limit(5);

      if (error) {
        console.error('❌ Error fetching communities:', error);
        this.results.community = { success: false, error };
        return false;
      }

      if (!communities || communities.length === 0) {
        console.error('❌ No communities found where user is creator');
        this.results.community = { success: false, error: 'No communities' };
        return false;
      }

      // Use the first community
      this.communityId = communities[0].id;
      console.log('✅ Using community:', communities[0].name, '(' + this.communityId + ')');
      this.results.community = { success: true, community: communities[0] };
      return true;
    } catch (error) {
      console.error('❌ Exception finding community:', error);
      this.results.community = { success: false, error: error.message };
      return false;
    }
  }

  // Step 4: Test Direct Database Insert
  async testDirectInsert() {
    console.log('💾 Step 4: Testing Direct Database Insert...');
    
    const testData = {
      community_id: this.communityId,
      name: 'Debug Test Plan ' + Date.now(),
      description: 'Test plan for debugging',
      price_monthly: 9.99,
      features: ['Debug Feature 1', 'Debug Feature 2'],
      trial_days: 0
    };

    console.log('📝 Test data:', testData);

    try {
      const { data, error } = await supabase
        .from('community_subscription_plans')
        .insert(testData)
        .select()
        .single();

      if (error) {
        console.error('❌ Direct insert failed:', error);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        
        this.results.directInsert = { 
          success: false, 
          error: error,
          errorAnalysis: this.analyzeError(error)
        };
        return false;
      }

      console.log('✅ Direct insert successful:', data);
      this.results.directInsert = { success: true, data };
      
      // Clean up
      await supabase
        .from('community_subscription_plans')
        .delete()
        .eq('id', data.id);
      console.log('🧹 Cleaned up test plan');
      
      return true;
    } catch (error) {
      console.error('❌ Exception during direct insert:', error);
      this.results.directInsert = { 
        success: false, 
        error: error.message,
        errorAnalysis: this.analyzeError(error)
      };
      return false;
    }
  }

  // Step 5: Test Hook Function
  async testHookFunction() {
    console.log('🔗 Step 5: Testing Hook Function...');
    
    // This would simulate what the hook does
    const testData = {
      community_id: this.communityId,
      name: 'Hook Test Plan ' + Date.now(),
      description: 'Test plan for hook debugging',
      price_monthly: 9.99,
      features: ['Hook Feature 1', 'Hook Feature 2'],
      trial_days: 0
    };

    try {
      // Simulate the validation that happens in the hook
      if (!testData.community_id) {
        throw new Error('Community ID is required');
      }
      if (!testData.name || testData.name.trim() === '') {
        throw new Error('Plan name is required');
      }
      if (!testData.features || testData.features.length === 0) {
        throw new Error('At least one feature is required');
      }

      console.log('✅ Hook validation passed');

      // Now test the actual insert
      const { data, error } = await supabase
        .from('community_subscription_plans')
        .insert(testData)
        .select()
        .single();

      if (error) {
        console.error('❌ Hook insert failed:', error);
        
        // Test the error handling logic
        let processedError;
        try {
          // Try to process the error the same way the hook does
          if (error.code === '23503') {
            processedError = 'Invalid community ID - the community may not exist or you may not have access to it';
          } else if (error.code === '23505') {
            processedError = 'A subscription plan with this name already exists in this community';
          } else if (error.code === '42501') {
            processedError = 'Permission denied - you may not have permission to create subscription plans for this community';
          } else if (error.message?.includes('violates row-level security')) {
            processedError = 'Access denied - only community creators can create subscription plans';
          } else if (error.message?.includes('violates check constraint')) {
            processedError = 'Invalid data provided - please check all required fields';
          } else {
            processedError = 'Unknown error: ' + (error.message || JSON.stringify(error));
          }
          
          console.log('🔄 Processed error message:', processedError);
        } catch (processingError) {
          console.error('❌ Error processing failed:', processingError);
          processedError = 'Error processing failed';
        }

        this.results.hookFunction = { 
          success: false, 
          error: error,
          processedError,
          errorAnalysis: this.analyzeError(error)
        };
        return false;
      }

      console.log('✅ Hook function test successful:', data);
      this.results.hookFunction = { success: true, data };
      
      // Clean up
      await supabase
        .from('community_subscription_plans')
        .delete()
        .eq('id', data.id);
      console.log('🧹 Cleaned up hook test plan');
      
      return true;
    } catch (error) {
      console.error('❌ Exception during hook test:', error);
      this.results.hookFunction = { 
        success: false, 
        error: error.message,
        errorAnalysis: this.analyzeError(error)
      };
      return false;
    }
  }

  // Helper function to analyze errors
  analyzeError(error) {
    const analysis = {
      type: typeof error,
      hasMessage: !!error?.message,
      hasCode: !!error?.code,
      hasDetails: !!error?.details,
      hasHint: !!error?.hint,
      properties: Object.keys(error || {})
    };

    if (error && typeof error === 'object') {
      analysis.stringified = JSON.stringify(error);
    }

    return analysis;
  }

  // Step 6: Test Error Scenarios
  async testErrorScenarios() {
    console.log('⚠️ Step 6: Testing Error Scenarios...');
    
    const errorTests = [
      {
        name: 'Invalid Community ID',
        data: {
          community_id: '00000000-0000-0000-0000-000000000000',
          name: 'Invalid Community Test',
          features: ['Feature 1']
        }
      },
      {
        name: 'Duplicate Plan Name',
        data: {
          community_id: this.communityId,
          name: 'Duplicate Test Plan',
          features: ['Feature 1']
        },
        setupRequired: true
      },
      {
        name: 'Missing Required Fields',
        data: {
          community_id: this.communityId
          // Missing name and features
        }
      }
    ];

    const errorResults = {};
    
    for (const test of errorTests) {
      console.log(`\n🧪 Testing: ${test.name}`);
      
      try {
        // Setup for duplicate test
        if (test.setupRequired) {
          await supabase
            .from('community_subscription_plans')
            .insert({
              community_id: this.communityId,
              name: 'Duplicate Test Plan',
              features: ['Feature 1']
            });
        }

        const { data, error } = await supabase
          .from('community_subscription_plans')
          .insert(test.data)
          .select()
          .single();

        if (error) {
          console.log('✅ Expected error caught:', error.message);
          errorResults[test.name] = {
            success: true,
            error: error,
            analysis: this.analyzeError(error)
          };
        } else {
          console.log('⚠️ Unexpected success');
          errorResults[test.name] = {
            success: false,
            message: 'Expected error but got success',
            data
          };
          
          // Clean up
          if (data?.id) {
            await supabase
              .from('community_subscription_plans')
              .delete()
              .eq('id', data.id);
          }
        }

        // Cleanup for duplicate test
        if (test.setupRequired) {
          await supabase
            .from('community_subscription_plans')
            .delete()
            .eq('community_id', this.communityId)
            .eq('name', 'Duplicate Test Plan');
        }

      } catch (error) {
        console.log('✅ Expected exception caught:', error.message);
        errorResults[test.name] = {
          success: true,
          error: error.message,
          analysis: this.analyzeError(error)
        };
      }
    }

    this.results.errorScenarios = errorResults;
    return errorResults;
  }

  // Main debug function
  async runFullDebug() {
    console.log('🚀 Starting Full Subscription Debug...');
    
    const steps = [
      'checkEnvironment',
      'checkAuthentication', 
      'findValidCommunity',
      'testDirectInsert',
      'testHookFunction',
      'testErrorScenarios'
    ];

    for (const step of steps) {
      try {
        const result = await this[step]();
        if (!result && step !== 'testErrorScenarios') {
          console.log(`❌ Step ${step} failed, stopping debug process`);
          break;
        }
      } catch (error) {
        console.error(`❌ Exception in step ${step}:`, error);
        this.results[step] = { success: false, error: error.message };
        break;
      }
    }

    // Generate summary report
    this.generateReport();
    return this.results;
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n📊 COMPREHENSIVE DEBUG REPORT');
    console.log('=====================================');
    
    Object.entries(this.results).forEach(([step, result]) => {
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} ${step}`);
      
      if (!result.success && result.error) {
        console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
      }
    });

    const totalSteps = Object.keys(this.results).length;
    const passedSteps = Object.values(this.results).filter(r => r.success).length;
    
    console.log(`\n🎯 Overall Result: ${passedSteps}/${totalSteps} steps passed`);
    
    if (passedSteps < totalSteps) {
      console.log('\n💡 RECOMMENDATIONS:');
      
      if (!this.results.auth?.success) {
        console.log('• Please log in to the application first');
      }
      
      if (!this.results.community?.success) {
        console.log('• Create a community where you are the creator');
      }
      
      if (!this.results.directInsert?.success) {
        console.log('• Check database permissions and RLS policies');
        console.log('• Verify community_id exists and user has access');
      }
      
      if (!this.results.hookFunction?.success) {
        console.log('• Check the useSubscriptions hook implementation');
        console.log('• Verify error handling utility is working');
      }
    } else {
      console.log('🎉 All tests passed! Subscription creation should work correctly.');
    }

    console.log('\n📋 Full results object available as: debugger.results');
  }
}

// Create global debugger instance
window.subscriptionDebugger = new SubscriptionDebugger();

// Export convenient functions
window.debugSubscriptionComprehensive = {
  runFullDebug: () => window.subscriptionDebugger.runFullDebug(),
  checkEnvironment: () => window.subscriptionDebugger.checkEnvironment(),
  checkAuth: () => window.subscriptionDebugger.checkAuthentication(),
  findCommunity: () => window.subscriptionDebugger.findValidCommunity(),
  testInsert: () => window.subscriptionDebugger.testDirectInsert(),
  testHook: () => window.subscriptionDebugger.testHookFunction(),
  testErrors: () => window.subscriptionDebugger.testErrorScenarios(),
  getResults: () => window.subscriptionDebugger.results
};

console.log('✨ Comprehensive Subscription Debugger Loaded!');
console.log('🎯 Quick start: debugSubscriptionComprehensive.runFullDebug()');
console.log('📋 Individual tests available:');
console.log('  - debugSubscriptionComprehensive.checkEnvironment()');
console.log('  - debugSubscriptionComprehensive.checkAuth()');
console.log('  - debugSubscriptionComprehensive.findCommunity()');
console.log('  - debugSubscriptionComprehensive.testInsert()');
console.log('  - debugSubscriptionComprehensive.testHook()');
console.log('  - debugSubscriptionComprehensive.testErrors()');
console.log('  - debugSubscriptionComprehensive.getResults()');
#!/usr/bin/env node

/**
 * Leaderboard System Test Script
 * This script tests the leaderboard functionality and helps diagnose issues
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const openaiKey = process.env.VITE_OPENAI_API_KEY;

console.log('🧪 Leaderboard System Test');
console.log('==========================\n');

// Test 1: Environment Configuration
console.log('1. Testing Environment Configuration...');
console.log(`   ✓ Supabase URL: ${supabaseUrl ? 'Configured' : '❌ Missing'}`);
console.log(`   ✓ Supabase Key: ${supabaseKey ? 'Configured' : '❌ Missing'}`);
console.log(`   ✓ OpenAI Key: ${openaiKey ? 'Configured' : '⚠️  Missing (will use mock)'}`);

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Critical: Missing Supabase configuration. Cannot proceed.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseTables() {
  console.log('\n2. Testing Database Schema...');
  
  const tables = [
    'community_user_scores',
    'community_user_score_history', 
    'community_user_activities',
    'community_user_feedback',
    'community_leaderboard_queries',
    'community_leaderboard_settings'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`   ❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`   ✅ Table '${table}': Exists and accessible`);
      }
    } catch (err) {
      console.log(`   ❌ Table '${table}': ${err.message}`);
    }
  }
}

async function testLeaderboardService() {
  console.log('\n3. Testing Leaderboard Service...');
  
  try {
    // Test getting communities to find one to test with
    const { data: communities, error: commError } = await supabase
      .from('communities')
      .select('id, name')
      .limit(1);
      
    if (commError || !communities || communities.length === 0) {
      console.log('   ⚠️  No communities found to test with');
      return;
    }
    
    const testCommunityId = communities[0].id;
    console.log(`   Using test community: ${communities[0].name} (${testCommunityId})`);
    
    // Test getting leaderboard
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('community_user_scores')
      .select(`
        *,
        profiles:user_id (
          user_id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('community_id', testCommunityId)
      .order('rank', { ascending: true })
      .limit(10);
      
    if (leaderboardError) {
      console.log(`   ❌ Leaderboard query failed: ${leaderboardError.message}`);
    } else {
      console.log(`   ✅ Leaderboard query successful: ${leaderboard.length} entries found`);
    }
    
  } catch (err) {
    console.log(`   ❌ Service test failed: ${err.message}`);
  }
}

async function testAIIntegration() {
  console.log('\n4. Testing AI Integration...');
  
  if (!openaiKey) {
    console.log('   ⚠️  OpenAI API key not configured - will use mock implementation');
    console.log('   ✅ Mock AI service should work without API key');
    return;
  }
  
  console.log('   ✅ OpenAI API key configured - real AI features available');
  
  // Test a simple API call to verify the key works
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
    });
    
    if (response.ok) {
      console.log('   ✅ OpenAI API key is valid');
    } else {
      console.log(`   ❌ OpenAI API key validation failed: ${response.status}`);
    }
  } catch (err) {
    console.log(`   ❌ OpenAI API test failed: ${err.message}`);
  }
}

async function runHealthCheck() {
  console.log('\n5. Overall Health Check...');
  
  const issues = [];
  const warnings = [];
  
  // Check critical components
  if (!supabaseUrl || !supabaseKey) {
    issues.push('Missing Supabase configuration');
  }
  
  if (!openaiKey) {
    warnings.push('OpenAI API key not configured (mock will be used)');
  }
  
  // Test database connection
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1);
      
    if (error) {
      issues.push(`Database connection failed: ${error.message}`);
    }
  } catch (err) {
    issues.push(`Database connection failed: ${err.message}`);
  }
  
  console.log('\n📊 Results:');
  if (issues.length === 0) {
    console.log('   ✅ All critical systems operational');
  } else {
    console.log('   ❌ Critical Issues Found:');
    issues.forEach(issue => console.log(`      - ${issue}`));
  }
  
  if (warnings.length > 0) {
    console.log('   ⚠️  Warnings:');
    warnings.forEach(warning => console.log(`      - ${warning}`));
  }
  
  console.log('\n🎯 Next Steps:');
  if (issues.length > 0) {
    console.log('   1. Fix critical issues listed above');
    console.log('   2. Ensure database migrations are applied');
    console.log('   3. Verify environment variables in .env file');
  } else {
    console.log('   ✅ System is ready! Try these:');
    console.log('   1. Test leaderboard in the application');
    console.log('   2. Ask AI questions in the leaderboard');
    console.log('   3. Monitor browser console for any runtime errors');
  }
}

// Run all tests
async function runTests() {
  try {
    await testDatabaseTables();
    await testLeaderboardService();
    await testAIIntegration();
    await runHealthCheck();
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

runTests();
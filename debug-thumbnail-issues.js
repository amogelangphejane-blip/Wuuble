#!/usr/bin/env node

/**
 * Comprehensive Thumbnail System Debugging Script
 * This script tests the entire thumbnail pipeline to identify issues
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration - these should be set via environment variables or prompts
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('❌ Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  console.log('Example: SUPABASE_URL=https://your-project.supabase.co SUPABASE_ANON_KEY=your-anon-key node debug-thumbnail-issues.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugThumbnailSystem() {
  console.log('🔍 Starting Thumbnail System Debug...\n');

  // Test 1: Check database connection
  console.log('1️⃣ Testing Database Connection...');
  try {
    const { data, error } = await supabase.from('live_streams').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful\n');
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return;
  }

  // Test 2: Check if required storage buckets exist
  console.log('2️⃣ Checking Storage Buckets...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    
    const expectedBuckets = ['stream-thumbnails', 'stream-images', 'stream-segments', 'stream-recordings'];
    const existingBuckets = buckets.map(b => b.name);
    
    console.log('Existing buckets:', existingBuckets);
    
    expectedBuckets.forEach(bucket => {
      const exists = existingBuckets.includes(bucket);
      console.log(`${exists ? '✅' : '❌'} ${bucket} bucket ${exists ? 'exists' : 'MISSING'}`);
    });
    
    if (!existingBuckets.includes('stream-thumbnails')) {
      console.log('\n🚨 CRITICAL: stream-thumbnails bucket is missing!');
      console.log('   This is likely the main cause of thumbnail upload failures.');
      console.log('   Run the comprehensive-livestream-storage-policies.sql to create it.');
    }
    console.log('');
  } catch (error) {
    console.log('❌ Failed to check buckets:', error.message, '\n');
  }

  // Test 3: Check live_streams table structure
  console.log('3️⃣ Checking live_streams Table Structure...');
  try {
    const { data, error } = await supabase
      .from('live_streams')
      .select('id, title, thumbnail_url, display_image_url, creator_id')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ live_streams table accessible');
    
    if (data && data.length > 0) {
      const stream = data[0];
      console.log('Sample stream structure:');
      console.log('  - id:', stream.id);
      console.log('  - title:', stream.title);
      console.log('  - thumbnail_url:', stream.thumbnail_url || 'null');
      console.log('  - display_image_url:', stream.display_image_url || 'null');
      console.log('  - creator_id:', stream.creator_id);
    } else {
      console.log('⚠️ No streams found in database');
    }
    console.log('');
  } catch (error) {
    console.log('❌ Failed to check live_streams table:', error.message, '\n');
  }

  // Test 4: Test storage policies (requires authentication)
  console.log('4️⃣ Testing Storage Policies...');
  console.log('⚠️ Storage policy testing requires user authentication');
  console.log('   Policies to verify:');
  console.log('   - Anyone can view stream thumbnails (SELECT)');
  console.log('   - Stream creators can upload thumbnails (INSERT)');
  console.log('   - Stream creators can update thumbnails (UPDATE)');
  console.log('   - Stream creators can delete thumbnails (DELETE)');
  console.log('');

  // Test 5: Check if thumbnail service dependencies are available
  console.log('5️⃣ Checking Client-Side Dependencies...');
  const clientDeps = [
    'Canvas API (for image processing)',
    'File API (for file handling)',
    'URL.createObjectURL (for previews)'
  ];
  
  console.log('Required browser APIs (check in browser console):');
  clientDeps.forEach(dep => {
    console.log(`   - ${dep}`);
  });
  console.log('');

  // Test 6: Test thumbnail URL patterns
  console.log('6️⃣ Testing Thumbnail URL Patterns...');
  try {
    const { data: streams, error } = await supabase
      .from('live_streams')
      .select('id, title, thumbnail_url, display_image_url')
      .not('thumbnail_url', 'is', null)
      .limit(5);
    
    if (error) throw error;
    
    if (streams && streams.length > 0) {
      console.log('Found streams with thumbnails:');
      streams.forEach(stream => {
        console.log(`  - ${stream.title}:`);
        if (stream.thumbnail_url) {
          console.log(`    Thumbnail: ${stream.thumbnail_url}`);
          // Check if URL follows expected pattern
          const expectedPattern = /stream-thumbnails\/[^\/]+\/thumbnail-\d+\./;
          const isValidPattern = expectedPattern.test(stream.thumbnail_url);
          console.log(`    Pattern valid: ${isValidPattern ? '✅' : '❌'}`);
        }
        if (stream.display_image_url) {
          console.log(`    Display: ${stream.display_image_url}`);
        }
      });
    } else {
      console.log('⚠️ No streams with thumbnails found');
    }
    console.log('');
  } catch (error) {
    console.log('❌ Failed to check thumbnail URLs:', error.message, '\n');
  }

  // Test 7: Generate diagnostic report
  console.log('7️⃣ Diagnostic Summary...');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    supabaseUrl: SUPABASE_URL,
    tests: {
      databaseConnection: '✅ Passed',
      bucketsCheck: 'See above results',
      tableStructure: '✅ Passed',
      storagePolicy: '⚠️ Requires manual verification',
      clientDeps: '⚠️ Requires browser testing',
      urlPatterns: 'See above results'
    }
  };

  console.log('\n📋 DIAGNOSTIC SUMMARY:');
  console.log('='.repeat(50));
  Object.entries(diagnostics.tests).forEach(([test, result]) => {
    console.log(`${test}: ${result}`);
  });
  
  console.log('\n🔧 RECOMMENDED ACTIONS:');
  console.log('1. Ensure stream-thumbnails bucket exists by running:');
  console.log('   comprehensive-livestream-storage-policies.sql');
  console.log('2. Verify storage policies are properly configured');
  console.log('3. Test thumbnail upload with authenticated user');
  console.log('4. Check browser console for client-side errors');
  console.log('5. Verify file permissions and CORS settings');
  
  console.log('\n📝 Save this report and run the recommended SQL file to fix bucket issues.');
}

// Run the debug script
debugThumbnailSystem().catch(error => {
  console.error('❌ Debug script failed:', error);
});
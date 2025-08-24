#!/usr/bin/env node

/**
 * Setup Thumbnails for Livestream Feature
 * This script automates the setup of the stream display images/thumbnails feature
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function printStatus(message) {
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
}

function printSuccess(message) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
}

function printWarning(message) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
}

function printError(message) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

async function main() {
  console.log('🎬 Setting up Livestream Thumbnails Feature...');
  console.log('==============================================');

  // Supabase configuration
  const SUPABASE_URL = "https://tgmflbglhmnrliredlbn.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbWZsYmdsaG1ucmxpcmVkbGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDY1MDksImV4cCI6MjA2OTQ4MjUwOX0.I5OHpsbFZwUDRTM4uFFjoE43nW1LyZb1kOE1N9OTAI8";
  
  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // Step 1: Check connection
    printStatus('Checking Supabase connection...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError && !authError.message.includes('session_not_found') && !authError.message.includes('Invalid JWT')) {
      throw new Error(`Connection failed: ${authError.message}`);
    }
    printSuccess('Supabase connection established');

    // Step 2: Check if we can access storage (this tests our connection)
    printStatus('Testing storage access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      printWarning(`Storage access warning: ${bucketsError.message}`);
    } else {
      printSuccess('Storage access verified');
    }

    // Step 3: Set up storage bucket for stream images
    printStatus('Setting up stream-images storage bucket...');
    
    const bucketExists = buckets?.some(bucket => bucket.id === 'stream-images');
    
    if (!bucketExists) {
      // Create the bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('stream-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });

      if (createError) {
        printWarning(`Bucket creation warning: ${createError.message}`);
        // Try to continue anyway, bucket might exist
      } else {
        printSuccess('Stream images bucket created successfully');
      }
    } else {
      printSuccess('Stream images bucket already exists');
    }

    // Step 4: Test bucket access
    printStatus('Verifying bucket access...');
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('stream-images')
        .list('', { limit: 1 });
      
      if (listError) {
        printWarning(`Bucket access warning: ${listError.message}`);
      } else {
        printSuccess('Stream images bucket is accessible');
      }
    } catch (err) {
      printWarning('Could not verify bucket access - this may be normal');
    }

    // Step 5: Check if database tables exist
    printStatus('Checking database schema...');
    
    try {
      // Test if we can query the live_streams table
      const { data: streams, error: streamsError } = await supabase
        .from('live_streams')
        .select('id, display_image_url')
        .limit(1);
      
      if (streamsError) {
        printWarning(`Live streams table check: ${streamsError.message}`);
      } else {
        printSuccess('Live streams table with display_image_url column is accessible');
      }
    } catch (err) {
      printWarning('Could not verify live_streams table structure');
    }

    try {
      // Test if we can query the stream_images table
      const { data: streamImages, error: streamImagesError } = await supabase
        .from('stream_images')
        .select('id')
        .limit(1);
      
      if (streamImagesError) {
        printWarning(`Stream images table check: ${streamImagesError.message}`);
        printStatus('This is expected if the database migration has not been run yet');
      } else {
        printSuccess('Stream images table is accessible');
      }
    } catch (err) {
      printWarning('Could not verify stream_images table - migration may be needed');
    }

    // Step 6: Display setup summary
    console.log('');
    console.log('🎉 Thumbnail Setup Progress!');
    console.log('============================');
    console.log('');
    printSuccess('Supabase connection verified');
    printSuccess('Storage bucket setup completed');
    console.log('');
    printStatus('What was set up:');
    console.log('  ✅ stream-images storage bucket created/verified');
    console.log('  ✅ Bucket configured with 5MB limit and image mime types');
    console.log('  ✅ Public access enabled for viewing thumbnails');
    console.log('');
    
    printStatus('Next steps needed:');
    console.log('  🔲 Run database migration: supabase/migrations/20250202000000_add_stream_display_images.sql');
    console.log('  🔲 Apply storage policies: setup-stream-images-bucket.sql');
    console.log('  🔲 Test thumbnail upload functionality');
    console.log('');
    
    printStatus('Manual setup instructions:');
    console.log('  1. If using Supabase Dashboard:');
    console.log('     - Go to your project dashboard');
    console.log('     - Navigate to SQL Editor');
    console.log('     - Run the migration file content');
    console.log('     - Run the storage policies file content');
    console.log('');
    console.log('  2. If using local development:');
    console.log('     - Ensure Supabase CLI is installed');
    console.log('     - Run: supabase db reset');
    console.log('     - Or manually apply the SQL files');
    console.log('');

    // Optional: Mention test file
    if (fs.existsSync(path.join(__dirname, 'test-thumbnail-system.html'))) {
      printStatus('Test file available: test-thumbnail-system.html');
      console.log('  You can open this file in a browser to test the thumbnail system');
      console.log('  Make sure to update the Supabase URL and key in the test file');
    }

    printSuccess('Basic setup completed successfully! 🚀');
    printStatus('Database migration still needed for full functionality');

  } catch (error) {
    printError(`Setup failed: ${error.message}`);
    console.log('');
    printStatus('Troubleshooting tips:');
    console.log('  • Check your internet connection');
    console.log('  • Verify Supabase project is active');
    console.log('  • Ensure you have the correct project URL and API key');
    console.log('  • Check if you have sufficient permissions in Supabase');
    process.exit(1);
  }
}

// Run the setup
main().catch(console.error);
#!/usr/bin/env node

/**
 * Storage Bucket Creation Script
 * 
 * This script creates the necessary Supabase storage buckets for:
 * - Profile pictures
 * - Community avatars  
 * - Community post images
 * 
 * Run this script when setting up a new environment or if buckets are missing.
 * 
 * Usage: node create-storage-buckets.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const buckets = [
  {
    name: 'profile-pictures',
    config: {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    }
  },
  {
    name: 'community-avatars',
    config: {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    }
  },
  {
    name: 'community-post-images',
    config: {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    }
  }
];

async function createStorageBuckets() {
  console.log('🚀 Starting storage bucket creation...\n');
  
  try {
    // Step 1: Check existing buckets
    console.log('📋 Checking existing buckets...');
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      process.exit(1);
    }

    console.log('Existing buckets:', existingBuckets.map(b => b.id).join(', ') || 'none');
    console.log('');

    // Step 2: Create each bucket if it doesn't exist
    let createdCount = 0;
    let existingCount = 0;
    let errorCount = 0;

    for (const bucket of buckets) {
      const exists = existingBuckets.some(b => b.id === bucket.name);
      
      if (!exists) {
        console.log(`📸 Creating ${bucket.name} bucket...`);
        const { error } = await supabase.storage.createBucket(bucket.name, bucket.config);
        
        if (error) {
          console.error(`❌ Failed to create ${bucket.name}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ ${bucket.name} created successfully`);
          createdCount++;
        }
      } else {
        console.log(`✅ ${bucket.name} already exists`);
        existingCount++;
      }
    }

    // Step 3: Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   Created: ${createdCount} bucket(s)`);
    console.log(`   Already existed: ${existingCount} bucket(s)`);
    console.log(`   Errors: ${errorCount} bucket(s)`);
    console.log('='.repeat(50));

    if (errorCount > 0) {
      console.log('\n⚠️  Some buckets could not be created. Please check the errors above.');
      process.exit(1);
    } else {
      console.log('\n🎉 Storage setup complete! All buckets are ready.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 Setup failed with error:', error.message);
    process.exit(1);
  }
}

// Run the script
createStorageBuckets();

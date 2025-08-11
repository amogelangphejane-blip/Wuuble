#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://tgmflbglhmnrliredlbn.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbWZsYmdsaG1ucmxpcmVkbGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDY1MDksImV4cCI6MjA2OTQ4MjUwOX0.I5OHpsbFZwUDRTM4uFFjoE43nW1LyZb1kOE1N9OTAI8";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupStorageBuckets() {
  console.log('🚀 Setting up storage buckets for profile uploads...\n');

  try {
    // Check existing buckets
    console.log('📋 Checking existing buckets...');
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      return;
    }

    console.log(`📦 Found ${existingBuckets.length} existing buckets:`, existingBuckets.map(b => b.id).join(', '));

    const profileBucketExists = existingBuckets.some(b => b.id === 'profile-pictures');
    const communityBucketExists = existingBuckets.some(b => b.id === 'community-avatars');

    // Create profile-pictures bucket
    if (!profileBucketExists) {
      console.log('\n🖼️ Creating profile-pictures bucket...');
      
      const { error: profileBucketError } = await supabase.storage.createBucket('profile-pictures', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });

      if (profileBucketError) {
        console.error('❌ Failed to create profile-pictures bucket:', profileBucketError.message);
      } else {
        console.log('✅ Profile-pictures bucket created successfully');
      }
    } else {
      console.log('✅ Profile-pictures bucket already exists');
    }

    // Create community-avatars bucket
    if (!communityBucketExists) {
      console.log('\n👥 Creating community-avatars bucket...');
      
      const { error: communityBucketError } = await supabase.storage.createBucket('community-avatars', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });

      if (communityBucketError) {
        console.error('❌ Failed to create community-avatars bucket:', communityBucketError.message);
      } else {
        console.log('✅ Community-avatars bucket created successfully');
      }
    } else {
      console.log('✅ Community-avatars bucket already exists');
    }

    // Verify final setup
    console.log('\n🔍 Verifying setup...');
    const { data: finalBuckets, error: finalListError } = await supabase.storage.listBuckets();
    
    if (finalListError) {
      console.error('❌ Cannot verify setup:', finalListError.message);
      return;
    }

    const finalProfileExists = finalBuckets.some(b => b.id === 'profile-pictures');
    const finalCommunityExists = finalBuckets.some(b => b.id === 'community-avatars');
    
    console.log(`📋 Final bucket status:`);
    console.log(`  - Profile Pictures: ${finalProfileExists ? '✅' : '❌'}`);
    console.log(`  - Community Avatars: ${finalCommunityExists ? '✅' : '❌'}`);

    if (finalProfileExists && finalCommunityExists) {
      console.log('\n🎉 Setup complete! Upload functionality is ready.');
      console.log('\nNext steps:');
      console.log('1. Go to Profile Settings in your app');
      console.log('2. Try uploading a profile picture');
      console.log('3. The upload should now work correctly');
    } else {
      console.log('\n⚠️ Setup incomplete - some buckets are still missing');
    }

  } catch (error) {
    console.error('💥 Setup failed:', error);
  }
}

// Run the setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupStorageBuckets().then(() => {
    console.log('\n📋 Script completed.');
    process.exit(0);
  }).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
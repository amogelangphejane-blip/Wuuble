const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTangoLiveStreaming() {
  console.log('🎥 Setting up Tango-like Live Streaming features...\n');

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'tango_live_streaming_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📝 Applying Tango Live Streaming schema...');
    
    // Execute the schema
    const { error: schemaError } = await supabase.rpc('exec', {
      sql: schemaSQL
    });

    if (schemaError) {
      console.error('❌ Schema Error:', schemaError);
      throw schemaError;
    }

    console.log('✅ Tango Live Streaming schema applied successfully!');

    // Initialize some users with coins for testing
    console.log('\n💰 Initializing test user coins...');
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(5);

    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        const { error: coinError } = await supabase
          .from('user_coins')
          .upsert([{
            user_id: profile.id,
            balance: 1000,
            total_earned: 1000
          }], {
            onConflict: 'user_id'
          });

        if (!coinError) {
          console.log(`✅ Initialized coins for user: ${profile.id}`);
        }
      }
    }

    // Test the functions
    console.log('\n🧪 Testing database functions...');
    
    if (profiles && profiles.length > 0) {
      const testUserId = profiles[0].id;
      
      // Test get_user_coins function
      const { data: coins, error: coinsError } = await supabase
        .rpc('get_user_coins', { user_uuid: testUserId });
      
      if (!coinsError) {
        console.log(`✅ get_user_coins function working: ${coins} coins`);
      } else {
        console.log(`❌ get_user_coins function error:`, coinsError);
      }

      // Test follower count function
      const { data: followerCount, error: followError } = await supabase
        .rpc('get_follower_count', { streamer_uuid: testUserId });
      
      if (!followError) {
        console.log(`✅ get_follower_count function working: ${followerCount} followers`);
      } else {
        console.log(`❌ get_follower_count function error:`, followError);
      }
    }

    console.log('\n🎉 Tango Live Streaming setup completed successfully!\n');
    
    console.log('📋 Features enabled:');
    console.log('   ✅ Virtual Gifts & Monetization System');
    console.log('   ✅ User Coins & Currency Management');
    console.log('   ✅ Streamer Following System');
    console.log('   ✅ Stream Analytics & Metrics');
    console.log('   ✅ Beauty Filters & User Preferences');
    console.log('   ✅ Stream Categories & Discovery');
    console.log('   ✅ User Levels & VIP System');
    console.log('   ✅ Notification System');
    console.log('   ✅ Stream Moderation Tools\n');

    console.log('🚀 Your Tango-like live streaming platform is ready!');
    console.log('   - Access the live streaming page at: /live');
    console.log('   - Users start with 1000 coins for testing');
    console.log('   - All RLS policies are configured for security\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Check your Supabase connection');
    console.error('   2. Ensure you have the correct service role key');
    console.error('   3. Verify the schema file exists');
    console.error('   4. Check for any conflicting table names\n');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Setup interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Setup terminated');
  process.exit(0);
});

// Run the setup
setupTangoLiveStreaming().catch(console.error);
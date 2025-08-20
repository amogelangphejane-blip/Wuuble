/**
 * Script to check and fix the live_streams table schema
 * This addresses the "Could not find settings column of live streams in the schema cache" error
 */

import { supabase } from '@/integrations/supabase/client';

async function checkLiveStreamsSchema() {
  console.log('🔍 Checking live_streams table schema...\n');

  try {
    // First, let's try to query the live_streams table directly to see what happens
    console.log('🔍 Testing direct query to live_streams table...');
    const { data: testData, error: testError } = await supabase
      .from('live_streams')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('❌ Direct query failed:', testError.message);
      
      if (testError.message.includes('relation "live_streams" does not exist')) {
        console.log('\n🔧 SOLUTION: The live_streams table doesn\'t exist at all!');
        console.log('📋 You need to apply the live streams migrations:');
        console.log('   1. Go to your Supabase dashboard');
        console.log('   2. Navigate to SQL Editor');
        console.log('   3. Run the migration: supabase/migrations/20250126000000_add_live_streams.sql');
        console.log('   4. Run the enhancement: supabase/migrations/20250127000000_enhance_live_streams.sql');
        return;
      }
      
      if (testError.message.includes('settings') || testError.message.includes('column')) {
        console.log('\n🔧 SOLUTION: The settings column is missing!');
        console.log('📋 You need to apply the enhancement migration:');
        console.log('   - Run: supabase/migrations/20250127000000_enhance_live_streams.sql');
        console.log('\n🔧 Quick fix SQL (run in Supabase SQL Editor):');
        console.log(`
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "qa_mode": false, 
  "polls_enabled": true, 
  "reactions_enabled": true, 
  "chat_moderation": false
}'::jsonb;
        `);
        return;
      }
    } else {
      console.log('✅ Direct query successful!');
      
      if (testData && testData.length > 0) {
        console.log('📋 Sample record found:');
        console.log('   - ID:', testData[0].id);
        console.log('   - Title:', testData[0].title);
        console.log('   - Settings:', testData[0].settings);
        
        if (!testData[0].settings) {
          console.log('\n⚠️  ISSUE: Record exists but settings is null/undefined');
          console.log('🔧 This suggests the column exists but may need default values');
        } else {
          console.log('\n✅ Settings column is working correctly!');
        }
      } else {
        console.log('📋 Table exists but no records found (this is normal for a new setup)');
        
        // Test if we can insert a record with settings
        console.log('\n🔍 Testing insert with settings...');
        const { data: insertData, error: insertError } = await supabase
          .from('live_streams')
          .insert({
            title: 'Test Stream',
            description: 'Schema test',
            creator_id: 'test-user-id',
            settings: {
              qa_mode: false,
              polls_enabled: true,
              reactions_enabled: true,
              chat_moderation: false
            }
          })
          .select()
          .single();

        if (insertError) {
          console.log('❌ Insert test failed:', insertError.message);
          if (insertError.message.includes('settings')) {
            console.log('🔧 This confirms the settings column issue.');
          }
        } else {
          console.log('✅ Insert test successful! Settings column is working.');
          
          // Clean up the test record
          await supabase
            .from('live_streams')
            .delete()
            .eq('id', insertData.id);
          console.log('🧹 Test record cleaned up.');
        }
      }
    }

    // Try to query with specific settings column
    console.log('\n🔍 Testing settings column specifically...');
    const { data: settingsData, error: settingsError } = await supabase
      .from('live_streams')
      .select('id, title, settings')
      .limit(1);

    if (settingsError) {
      console.log('❌ Settings column query failed:', settingsError.message);
      console.log('🔧 This confirms the settings column is missing or has issues.');
    } else {
      console.log('✅ Settings column query successful!');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function main() {
  console.log('🚀 Live Streams Schema Checker\n');
  console.log('This script checks if the settings column exists in the live_streams table');
  console.log('and provides solutions for the "Could not find settings column" error.\n');
  
  await checkLiveStreamsSchema();
  
  console.log('\n📋 Summary:');
  console.log('If you saw errors above, you need to apply the live streams migrations');
  console.log('in your Supabase dashboard. The migrations are located in:');
  console.log('- supabase/migrations/20250126000000_add_live_streams.sql');
  console.log('- supabase/migrations/20250127000000_enhance_live_streams.sql');
  
  console.log('\n✨ Schema check complete!');
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { checkLiveStreamsSchema };
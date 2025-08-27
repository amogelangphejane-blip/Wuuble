#!/usr/bin/env node

/**
 * Setup script for the messaging system
 * This applies the messaging schema to ensure all tables and functions are properly configured
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://tgmflbglhmnrliredlbn.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Please set your Supabase service role key as an environment variable:');
  console.log('export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupMessagingSystem() {
  console.log('🚀 Setting up messaging system...');

  try {
    // Read the messaging schema SQL
    const schemaSQL = readFileSync(join(__dirname, 'create-messaging-schema.sql'), 'utf8');
    
    console.log('📝 Applying messaging schema...');
    
    // Execute the schema
    const { error } = await supabase.rpc('exec', { sql: schemaSQL });
    
    if (error) {
      console.error('❌ Error applying schema:', error);
      return;
    }

    console.log('✅ Messaging schema applied successfully');

    // Test the setup by checking if tables exist
    console.log('🔍 Verifying tables...');
    
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('count', { count: 'exact', head: true });
    
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('count', { count: 'exact', head: true });

    if (convError || msgError) {
      console.error('❌ Error verifying tables:', convError || msgError);
      return;
    }

    console.log('✅ Tables verified successfully');
    console.log(`📊 Found ${conversations?.length || 0} conversations and ${messages?.length || 0} messages`);
    
    // Test the get_or_create_conversation function
    console.log('🔧 Testing database functions...');
    
    const { data: funcTest, error: funcError } = await supabase
      .rpc('get_or_create_conversation', {
        user1_id: '00000000-0000-0000-0000-000000000001',
        user2_id: '00000000-0000-0000-0000-000000000002'
      });

    if (funcError && !funcError.message.includes('violates foreign key constraint')) {
      console.error('❌ Error testing function:', funcError);
      return;
    }

    console.log('✅ Database functions are working correctly');
    console.log('🎉 Messaging system setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupMessagingSystem().catch(console.error);
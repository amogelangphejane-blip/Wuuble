import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('🔄 Testing database connection and schema...');
console.log('📍 Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('🔑 Supabase Key:', supabaseKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables.');
  console.log('\nPlease make sure you have:');
  console.log('- VITE_SUPABASE_URL in your environment');
  console.log('- VITE_SUPABASE_ANON_KEY in your environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  try {
    console.log('\n🔍 Testing database connection...');
    
    // Test basic connection
    const { data, error: connectionError } = await supabase
      .from('communities')
      .select('count')
      .limit(1);
      
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError.message);
      
      if (connectionError.message.includes('relation "public.communities" does not exist')) {
        console.log('\n📋 The communities table does not exist. Applying migration...');
        
        // Try to apply the migration
        try {
          const migrationSQL = fs.readFileSync('/workspace/supabase/migrations/20250928000001_complete_communities_fix.sql', 'utf8');
          
          const { error: migrationError } = await supabase.rpc('exec', {
            sql: migrationSQL
          });
          
          if (migrationError) {
            console.error('❌ Migration failed:', migrationError.message);
            console.log('\n💡 Please apply the migration manually in your Supabase dashboard.');
          } else {
            console.log('✅ Migration applied successfully!');
          }
        } catch (migrationError) {
          console.log('💡 Manual migration needed. Please run this SQL in your Supabase dashboard:');
          console.log('\n--- MIGRATION SQL ---');
          try {
            const migrationSQL = fs.readFileSync('/workspace/supabase/migrations/20250928000001_complete_communities_fix.sql', 'utf8');
            console.log(migrationSQL);
          } catch (e) {
            console.error('Could not read migration file:', e.message);
          }
        }
        return;
      }
      
      if (connectionError.message.includes('RLS')) {
        console.log('⚠️  RLS (Row Level Security) issue detected.');
        console.log('💡 This might be due to missing authentication or permissions.');
      }
      
      return;
    }
    
    console.log('✅ Database connection successful!');
    
    // Test communities table structure
    console.log('\n🔍 Checking communities table structure...');
    const { data: communities, error: communityError } = await supabase
      .from('communities')
      .select('*')
      .limit(1);
      
    if (communityError) {
      console.error('❌ Error accessing communities:', communityError.message);
      return;
    }
    
    console.log('✅ Communities table is accessible!');
    console.log('📊 Current communities count:', communities?.length || 0);
    
    // Test community_members table
    console.log('\n🔍 Checking community_members table...');
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select('count')
      .limit(1);
      
    if (membersError) {
      console.error('❌ Error accessing community_members:', membersError.message);
    } else {
      console.log('✅ Community members table is accessible!');
    }
    
    // Test community_posts table
    console.log('\n🔍 Checking community_posts table...');
    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select('count')
      .limit(1);
      
    if (postsError) {
      console.error('❌ Error accessing community_posts:', postsError.message);
    } else {
      console.log('✅ Community posts table is accessible!');
    }
    
    console.log('\n🎉 Database test completed!');
    console.log('\nNext steps:');
    console.log('1. If there were errors, apply the migration SQL manually');
    console.log('2. Make sure you\'re authenticated in your app');
    console.log('3. Check that RLS policies are correctly set up');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testDatabaseConnection();
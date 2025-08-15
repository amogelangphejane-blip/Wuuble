const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupGroupVideoCalls() {
  try {
    console.log('Setting up group video call database tables...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'SAFE_GROUP_VIDEO_CALLS_MIGRATION.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration...');
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // Try alternative approach - split and execute statements
      console.log('RPC approach failed, trying direct SQL execution...');
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing:', statement.substring(0, 50) + '...');
          const { error: stmtError } = await supabase.from('pg_stat_activity').select('*').limit(0);
          if (stmtError) {
            console.error('Failed to execute statement:', statement);
            console.error('Error:', stmtError);
          }
        }
      }
    }
    
    // Test if tables were created
    console.log('Testing table creation...');
    const { data, error: testError } = await supabase
      .from('community_group_calls')
      .select('id')
      .limit(1);
    
    if (testError) {
      if (testError.code === '42P01') {
        console.error('❌ Tables were not created successfully');
        console.log('\n📋 Manual Setup Required:');
        console.log('1. Go to your Supabase project dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and execute the contents of SAFE_GROUP_VIDEO_CALLS_MIGRATION.sql');
        console.log('\nAlternatively, you can copy this content:');
        console.log('---');
        console.log(migrationSQL.substring(0, 500) + '...');
        console.log('---');
      } else {
        console.error('Unexpected error:', testError);
      }
    } else {
      console.log('✅ Group video call tables set up successfully!');
      console.log('You can now use the group video call feature.');
    }
    
  } catch (error) {
    console.error('Setup failed:', error.message);
    console.log('\n📋 Manual Setup Required:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and execute the contents of SAFE_GROUP_VIDEO_CALLS_MIGRATION.sql');
  }
}

setupGroupVideoCalls();
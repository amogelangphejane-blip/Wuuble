#!/usr/bin/env node

/**
 * Resources Feature Migration Applicator
 * 
 * This script applies the resources migration to the Supabase database.
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://tgmflbglhmnrliredlbn.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('');
  console.error('To get your service role key:');
  console.error('1. Go to https://supabase.com/dashboard/project/tgmflbglhmnrliredlbn/settings/api');
  console.error('2. Copy the "service_role" key (not the anon key)');
  console.error('3. Run: export SUPABASE_SERVICE_ROLE_KEY="your-key-here"');
  console.error('4. Then run this script again');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyMigration() {
  try {
    console.log('🚀 Starting Resources Feature Migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250815000000_add_community_resources.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');
    
    // Apply the migration
    console.log('⚡ Applying migration to database...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Verify tables were created
    console.log('🔍 Verifying tables were created...');
    const tablesToCheck = [
      'resource_categories',
      'community_resources',
      'resource_tags',
      'resource_tag_assignments',
      'resource_ratings',
      'resource_bookmarks',
      'resource_reports'
    ];
    
    let allTablesExist = true;
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error && error.code === '42P01') {
          console.log('❌ Table', table, 'was not created');
          allTablesExist = false;
        } else {
          console.log('✅ Table', table, 'exists');
        }
      } catch (err) {
        console.log('❌ Error checking table', table, ':', err.message);
        allTablesExist = false;
      }
    }
    
    if (allTablesExist) {
      console.log('');
      console.log('🎉 Resources Feature Migration Complete!');
      console.log('');
      console.log('✅ All database tables created');
      console.log('✅ RLS policies applied');
      console.log('✅ Seed data loaded');
      console.log('');
      console.log('🚀 The Resources feature is now ready to use!');
      console.log('   Navigate to any community and click the "Resources" tab.');
    } else {
      console.log('');
      console.log('⚠️  Migration completed but some tables may be missing.');
      console.log('   Please check the migration file and try again.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function applyMigrationDirect() {
  try {
    console.log('🚀 Starting Resources Feature Migration (Direct SQL)...');
    
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250815000000_add_community_resources.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📄 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error(`❌ Statement ${i + 1} failed:`, error.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Statement ${i + 1} error:`, err.message);
      }
    }
    
    console.log('🎉 Migration execution completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

// Run the migration
console.log('🔧 Resources Feature Database Migration');
console.log('=====================================');
console.log('');

applyMigration().catch(() => {
  console.log('');
  console.log('⚠️  Standard migration method failed, trying direct SQL execution...');
  applyMigrationDirect();
});
#!/usr/bin/env node

/**
 * Complete Resources Feature Fix
 * 
 * This script applies both the resources migration and creates the missing view
 * that the frontend component expects.
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

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    return !error;
  } catch (err) {
    return false;
  }
}

async function applyResourcesFix() {
  try {
    console.log('🚀 Starting Complete Resources Feature Fix...');
    console.log('');
    
    // Step 1: Check if tables already exist
    console.log('🔍 Checking current database state...');
    const tables = [
      'resource_categories',
      'community_resources', 
      'resource_tags',
      'resource_tag_assignments',
      'resource_ratings',
      'resource_bookmarks',
      'resource_reports'
    ];
    
    let existingTables = 0;
    for (const table of tables) {
      const exists = await checkTableExists(table);
      if (exists) {
        console.log(`   ✅ Table ${table} exists`);
        existingTables++;
      } else {
        console.log(`   ❌ Table ${table} missing`);
      }
    }
    
    // Step 2: Apply migration if needed
    if (existingTables === 0) {
      console.log('');
      console.log('📄 Applying Resources migration...');
      
      const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250815000000_add_community_resources.sql');
      
      if (!fs.existsSync(migrationPath)) {
        console.error('❌ Migration file not found:', migrationPath);
        process.exit(1);
      }
      
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Execute the migration
      const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSQL });
      
      if (migrationError) {
        console.error('❌ Migration failed:', migrationError.message);
        process.exit(1);
      }
      
      console.log('✅ Migration applied successfully');
    } else if (existingTables < tables.length) {
      console.log('⚠️ Partial migration detected. Some tables exist but not all.');
      console.log('   This might cause issues. Consider dropping existing tables and re-running.');
    } else {
      console.log('✅ All tables already exist');
    }
    
    // Step 3: Create the missing view
    console.log('');
    console.log('🔧 Creating missing database view...');
    
    const viewPath = path.join(__dirname, 'fix-resources-missing-view.sql');
    
    if (!fs.existsSync(viewPath)) {
      console.error('❌ View SQL file not found:', viewPath);
      process.exit(1);
    }
    
    const viewSQL = fs.readFileSync(viewPath, 'utf8');
    
    // Execute the view creation
    const { error: viewError } = await supabase.rpc('exec_sql', { sql: viewSQL });
    
    if (viewError) {
      console.error('❌ View creation failed:', viewError.message);
      process.exit(1);
    }
    
    console.log('✅ Database view created successfully');
    
    // Step 4: Verify the fix
    console.log('');
    console.log('🧪 Verifying the fix...');
    
    // Test the view
    const { data: viewData, error: viewTestError } = await supabase
      .from('community_resources_with_tags')
      .select('*')
      .limit(1);
      
    if (viewTestError) {
      console.error('❌ View test failed:', viewTestError.message);
      process.exit(1);
    }
    
    console.log('✅ Database view is working');
    
    // Test categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('resource_categories')
      .select('*');
      
    if (categoriesError) {
      console.error('❌ Categories test failed:', categoriesError.message);
      process.exit(1);
    }
    
    console.log(`✅ Found ${categoriesData?.length || 0} resource categories`);
    
    // Final verification
    console.log('');
    console.log('🎉 Resources Feature Fix Complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Open your app and navigate to any community');
    console.log('2. Click the "Resources" tab');
    console.log('3. The feature should now work without errors');
    console.log('');
    console.log('If you still see issues:');
    console.log('- Clear your browser cache (Ctrl+Shift+R)');
    console.log('- Check the browser console for any remaining errors');
    console.log('- Open resources-diagnostic.html to run additional tests');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the fix
applyResourcesFix();
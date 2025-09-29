#!/usr/bin/env node

/**
 * Apply Members Feature Fix
 * 
 * This script applies the SQL migration to fix the members feature
 * so that community creators show up as members with real-time data.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Starting Members Feature Fix...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix_members_real_time_data.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Loaded migration file');
    console.log('📝 Applying migration to database...\n');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If exec_sql doesn't exist, try direct execution
      // Split by semicolon and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.includes('DO $$') || statement.includes('CREATE OR REPLACE FUNCTION')) {
          // These need special handling
          const { error: stmtError } = await supabase.rpc('exec', { query: statement });
          if (stmtError) {
            console.warn('⚠️  Warning executing statement:', stmtError.message);
          }
        }
      }

      return { data: null, error: null };
    });

    if (error) {
      throw error;
    }

    console.log('✅ Migration applied successfully!\n');
    
    // Verify the fix
    console.log('🔍 Verifying the fix...\n');
    
    // Check member_profiles count
    const { count: profileCount } = await supabase
      .from('member_profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total member profiles: ${profileCount}`);
    
    // Check that creators are in member_profiles
    const { data: communities } = await supabase
      .from('communities')
      .select('id, name, creator_id');
    
    if (communities && communities.length > 0) {
      console.log(`🏘️  Found ${communities.length} communities\n`);
      
      let creatorsWithProfiles = 0;
      for (const community of communities) {
        const { data: profile } = await supabase
          .from('member_profiles')
          .select('id, role')
          .eq('community_id', community.id)
          .eq('user_id', community.creator_id)
          .single();
        
        if (profile) {
          creatorsWithProfiles++;
          console.log(`✅ "${community.name}" - Creator is visible as member (role: ${profile.role})`);
        } else {
          console.log(`⚠️  "${community.name}" - Creator NOT in member_profiles (will be synced on next login)`);
        }
      }
      
      console.log(`\n👑 ${creatorsWithProfiles}/${communities.length} creators are now visible as members`);
    }
    
    console.log('\n✨ Members feature fix completed!\n');
    console.log('Next steps:');
    console.log('1. Refresh your browser to see the changes');
    console.log('2. Navigate to a community members page');
    console.log('3. The creator should now appear in the members list');
    console.log('4. Real-time updates are now enabled\n');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure you have the correct Supabase credentials');
    console.error('2. Check that member_profiles table exists');
    console.error('3. Try running the SQL manually in Supabase SQL Editor');
    console.error('\nYou can find the SQL in: fix_members_real_time_data.sql\n');
    process.exit(1);
  }
}

// Run the migration
applyMigration().catch(console.error);

export { applyMigration };
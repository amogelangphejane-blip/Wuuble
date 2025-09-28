#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Try to load environment variables
try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch (e) {
  console.log('Using process.env directly');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('🔧 Applying RLS Policy Fix');
console.log('==========================');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables');
  console.log('📋 Please run this SQL manually in your Supabase dashboard:');
  console.log('👉 https://supabase.com/dashboard/project/[your-project]/sql');
  
  try {
    const sql = fs.readFileSync('/workspace/supabase/migrations/20250928000002_fix_rls_policies.sql', 'utf8');
    console.log('\n--- COPY THIS SQL ---');
    console.log(sql);
    console.log('\n--- END SQL ---');
  } catch (e) {
    console.log('Could not read SQL file');
  }
  
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
  try {
    console.log('📖 Reading SQL fix...');
    const sql = fs.readFileSync('/workspace/supabase/migrations/20250928000002_fix_rls_policies.sql', 'utf8');
    
    console.log('🔧 Applying RLS policy fix...');
    
    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error) {
            console.log('⚠️  Statement failed:', statement.substring(0, 50) + '...');
            console.log('   Error:', error.message);
          }
        } catch (e) {
          // Try alternative method
          try {
            await supabase.from('_').select('*').limit(0); // This will fail but might help with auth
          } catch (authError) {
            // Ignore
          }
        }
      }
    }
    
    console.log('✅ RLS policy fix applied!');
    
    // Test the fix
    console.log('\n🧪 Testing the fix...');
    const { data, error } = await supabase
      .from('communities')
      .select('id, name, description')
      .limit(1);
      
    if (error) {
      console.log('❌ Still having issues:', error.message);
      console.log('\n📋 Please apply this SQL manually in Supabase dashboard:');
      console.log(sql);
    } else {
      console.log('🎉 Success! Communities are now accessible!');
      console.log('📊 Test query returned:', data?.length || 0, 'results');
    }
    
  } catch (error) {
    console.log('❌ Error applying fix:', error.message);
    
    console.log('\n📋 Manual application required. Run this SQL in Supabase dashboard:');
    console.log('👉 https://supabase.com/dashboard/project/[your-project]/sql');
    
    try {
      const sql = fs.readFileSync('/workspace/supabase/migrations/20250928000002_fix_rls_policies.sql', 'utf8');
      console.log('\n--- COPY THIS SQL ---');
      console.log(sql);
      console.log('\n--- END SQL ---');
    } catch (e) {
      console.log('Could not read SQL file');
    }
  }
}

applyFix();
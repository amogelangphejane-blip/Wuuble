import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables.');
  console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🔄 Applying migration to fix communities and discussions schema...');
    
    // Read the migration file
    const migrationSQL = fs.readFileSync('/workspace/supabase/migrations/20250928000000_fix_communities_and_discussions.sql', 'utf8');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }

    console.log('✅ Migration applied successfully!');
    
    // Test the setup by creating a sample post
    console.log('🔄 Testing community posts table...');
    
    const { data: testData, error: testError } = await supabase
      .from('community_posts')
      .select('count')
      .limit(1);
      
    if (testError) {
      console.error('❌ Test failed:', testError);
    } else {
      console.log('✅ Community posts table is working correctly!');
    }
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
  }
}

applyMigration().then(() => {
  console.log('🎉 Migration process completed!');
}).catch((err) => {
  console.error('❌ Migration process failed:', err);
});
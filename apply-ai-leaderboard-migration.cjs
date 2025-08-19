#!/usr/bin/env node

/**
 * Script to apply AI Leaderboard migration to Supabase
 * Run this script to set up the required database tables
 */

const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250129000000_add_ai_leaderboard_system.sql');

function main() {
  console.log('🚀 AI Leaderboard Migration Helper');
  console.log('=====================================\n');

  // Check if migration file exists
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found at:', migrationPath);
    process.exit(1);
  }

  console.log('✅ Migration file found');
  console.log('📄 File:', migrationPath);

  // Read and display migration info
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  const lines = migrationContent.split('\n');
  const firstComment = lines.slice(0, 5).join('\n');
  
  console.log('\n📝 Migration Description:');
  console.log(firstComment);

  console.log('\n🔧 How to apply this migration:');
  console.log('\nOption 1: Using Supabase CLI (Recommended)');
  console.log('   supabase db push');

  console.log('\nOption 2: Manual application in Supabase Dashboard');
  console.log('   1. Go to your Supabase project dashboard');
  console.log('   2. Navigate to SQL Editor');
  console.log('   3. Copy and paste the migration file content');
  console.log('   4. Run the SQL');

  console.log('\nOption 3: Using this script to show the SQL');
  console.log('   node apply-ai-leaderboard-migration.js --show-sql');

  if (process.argv.includes('--show-sql')) {
    console.log('\n📋 Migration SQL:');
    console.log('='.repeat(50));
    console.log(migrationContent);
    console.log('='.repeat(50));
  }

  console.log('\n✨ After applying the migration, the following tables will be created:');
  console.log('   • community_user_scores');
  console.log('   • community_user_score_history');
  console.log('   • community_user_activities');
  console.log('   • community_user_feedback');
  console.log('   • community_leaderboard_queries');
  console.log('   • community_leaderboard_settings');
  console.log('   • ai_model_metrics');

  console.log('\n🔍 To verify the migration was applied, run this SQL query:');
  console.log(`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name LIKE 'community_%leaderboard%';
  `);

  console.log('\n🎉 Once migration is applied, the AI leaderboard system will be ready!');
}

if (require.main === module) {
  main();
}
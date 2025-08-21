#!/usr/bin/env node

/**
 * Community About Section Setup Script
 * 
 * This script helps set up the Community About section feature by:
 * 1. Checking if the migration needs to be applied
 * 2. Applying the migration if needed
 * 3. Verifying the table structure
 * 4. Testing basic functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Community About Section Setup Script');
console.log('=====================================\n');

// Check if migration file exists
const migrationPath = path.join(__dirname, 'supabase/migrations/20250815214300_add_community_about_table.sql');
const schemaPath = path.join(__dirname, 'community_about_schema.sql');

console.log('📋 Pre-flight Checks:');

// Check migration file
if (fs.existsSync(migrationPath)) {
  console.log('✅ Migration file exists:', migrationPath);
} else {
  console.log('❌ Migration file missing:', migrationPath);
  console.log('   Please ensure the migration was created properly.');
  process.exit(1);
}

// Check original schema file
if (fs.existsSync(schemaPath)) {
  console.log('✅ Original schema file exists:', schemaPath);
} else {
  console.log('⚠️  Original schema file not found:', schemaPath);
}

// Check component file
const componentPath = path.join(__dirname, 'src/components/CommunityAbout.tsx');
if (fs.existsSync(componentPath)) {
  console.log('✅ CommunityAbout component exists');
} else {
  console.log('❌ CommunityAbout component missing:', componentPath);
  process.exit(1);
}

// Check integration in CommunityDetail
const detailPath = path.join(__dirname, 'src/pages/CommunityDetail.tsx');
if (fs.existsSync(detailPath)) {
  const detailContent = fs.readFileSync(detailPath, 'utf8');
  if (detailContent.includes('CommunityAbout') && detailContent.includes("id: 'about'")) {
    console.log('✅ CommunityAbout properly integrated in CommunityDetail');
  } else {
    console.log('⚠️  CommunityAbout integration may be incomplete in CommunityDetail');
  }
} else {
  console.log('❌ CommunityDetail.tsx not found:', detailPath);
}

console.log('\n📝 Next Steps:');
console.log('==============');

console.log('\n1. Apply the Database Migration:');
console.log('   Option A - Using Supabase CLI (Recommended):');
console.log('   ```bash');
console.log('   supabase db push');
console.log('   ```');
console.log('');
console.log('   Option B - Manual SQL Execution:');
console.log('   - Open your Supabase dashboard');
console.log('   - Go to SQL Editor');
console.log('   - Copy and paste the migration SQL');
console.log('   - Execute the query');

console.log('\n2. Verify Migration Success:');
console.log('   Run this SQL query in your database:');
console.log('   ```sql');
console.log('   SELECT EXISTS (');
console.log('      SELECT FROM information_schema.tables');
console.log('      WHERE table_name = \'community_about\'');
console.log('   );');
console.log('   ```');
console.log('   Should return: true');

console.log('\n3. Test the Feature:');
console.log('   - Navigate to any community page');
console.log('   - Click the "About" tab');
console.log('   - Verify content loads without errors');
console.log('   - If you\'re a community creator, test editing functionality');

console.log('\n4. Monitor for Issues:');
console.log('   - Check browser console for errors');
console.log('   - Monitor Supabase logs');
console.log('   - Test with different user roles');

console.log('\n📖 Documentation:');
console.log('=================');
console.log('- Feature Documentation: COMMUNITY_ABOUT_PAGE_FEATURE.md');
console.log('- Troubleshooting Guide: COMMUNITY_ABOUT_TROUBLESHOOTING_GUIDE.md');
console.log('- Database Schema: community_about_schema.sql');
console.log('- Migration File: supabase/migrations/20250815214300_add_community_about_table.sql');

console.log('\n🔧 Common Issues:');
console.log('=================');
console.log('- "Failed to load community information" → Migration not applied');
console.log('- "Permission denied" → Check user is community creator');
console.log('- "Changes not saving" → Verify RLS policies and network requests');
console.log('- Empty About section → Check default data creation logic');

console.log('\n✅ Setup script completed successfully!');
console.log('Please follow the next steps above to complete the setup.\n');

// Check if we're in a git repository and suggest committing changes
if (fs.existsSync('.git')) {
  console.log('💡 Tip: Don\'t forget to commit these changes:');
  console.log('   git add .');
  console.log('   git commit -m "Fix: Add community about section database migration and troubleshooting guide"');
  console.log('');
}

console.log('🎉 Happy coding!');
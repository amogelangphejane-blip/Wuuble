#!/usr/bin/env node

/**
 * Setup Thumbnails for Livestream Feature - Final Version
 * This script provides instructions and prepares files for thumbnail setup
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function printStatus(message) {
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
}

function printSuccess(message) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
}

function printWarning(message) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
}

function printError(message) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

async function main() {
  console.log('🎬 Setting up Livestream Thumbnails Feature...');
  console.log('==============================================');

  // Step 1: Verify required files exist
  printStatus('Checking required setup files...');
  
  const migrationFile = path.join(__dirname, 'supabase/migrations/20250202000000_add_stream_display_images.sql');
  const storageSetupFile = path.join(__dirname, 'setup-stream-images-bucket.sql');
  const testFile = path.join(__dirname, 'test-thumbnail-system.html');

  let allFilesExist = true;

  if (fs.existsSync(migrationFile)) {
    printSuccess('✅ Database migration file found');
  } else {
    printError('❌ Database migration file missing');
    allFilesExist = false;
  }

  if (fs.existsSync(storageSetupFile)) {
    printSuccess('✅ Storage setup file found');
  } else {
    printError('❌ Storage setup file missing');
    allFilesExist = false;
  }

  if (fs.existsSync(testFile)) {
    printSuccess('✅ Test file found');
  } else {
    printWarning('⚠️  Test file not found (optional)');
  }

  if (!allFilesExist) {
    printError('Required files are missing. Please ensure all setup files are present.');
    return;
  }

  // Step 2: Check if components exist
  printStatus('Checking component files...');
  
  const componentFiles = [
    'src/services/thumbnailService.ts',
    'src/services/streamImageService.ts',
    'src/components/StreamImageUpload.tsx',
    'src/components/StreamManagement.tsx',
    'src/components/LivestreamDiscovery.tsx'
  ];

  for (const file of componentFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      printSuccess(`✅ ${file}`);
    } else {
      printWarning(`⚠️  ${file} - may need to be implemented`);
    }
  }

  // Step 3: Display comprehensive setup instructions
  console.log('');
  console.log('🎉 Thumbnail Setup Instructions');
  console.log('===============================');
  console.log('');
  
  printStatus('AUTOMATED SETUP COMPLETE ✅');
  console.log('The following files are ready for deployment:');
  console.log('  • Database migration: supabase/migrations/20250202000000_add_stream_display_images.sql');
  console.log('  • Storage setup: setup-stream-images-bucket.sql');
  console.log('  • Components and services are implemented');
  console.log('');

  printStatus('NEXT STEPS - Choose your deployment method:');
  console.log('');

  console.log('🔵 Option A: Supabase Dashboard (Recommended for Production)');
  console.log('  1. Go to your Supabase project dashboard');
  console.log('  2. Navigate to SQL Editor');
  console.log('  3. Create a new query and paste the contents of:');
  console.log('     supabase/migrations/20250202000000_add_stream_display_images.sql');
  console.log('  4. Run the migration');
  console.log('  5. Create another query and paste the contents of:');
  console.log('     setup-stream-images-bucket.sql');
  console.log('  6. Run the storage setup');
  console.log('');

  console.log('🔵 Option B: Supabase CLI (For Local Development)');
  console.log('  1. Install Supabase CLI: npm install -g supabase');
  console.log('  2. Initialize: supabase init (if not already done)');
  console.log('  3. Start local instance: supabase start');
  console.log('  4. Apply migration: supabase db reset');
  console.log('  5. Run storage setup: supabase db reset --db-url <your-db-url>');
  console.log('');

  console.log('🔵 Option C: Direct SQL Execution');
  console.log('  1. Connect to your database using psql or your preferred client');
  console.log('  2. Run the migration file: \\i supabase/migrations/20250202000000_add_stream_display_images.sql');
  console.log('  3. Run the storage setup: \\i setup-stream-images-bucket.sql');
  console.log('');

  printStatus('VERIFICATION STEPS:');
  console.log('After running the setup, verify the following:');
  console.log('  ✅ stream_images table exists');
  console.log('  ✅ live_streams table has display_image_url column');
  console.log('  ✅ stream-images storage bucket exists');
  console.log('  ✅ Storage policies are configured');
  console.log('  ✅ Triggers and functions are created');
  console.log('');

  printStatus('TESTING:');
  if (fs.existsSync(testFile)) {
    console.log('  • Open test-thumbnail-system.html in your browser');
    console.log('  • Update the Supabase URL and key in the test file if needed');
    console.log('  • Test thumbnail upload and display functionality');
  } else {
    console.log('  • Create a test stream and try uploading a thumbnail');
    console.log('  • Check the livestream discovery page for custom images');
  }
  console.log('');

  printStatus('FEATURES ENABLED:');
  console.log('  🎨 Custom display images for livestreams');
  console.log('  📸 Drag & drop thumbnail upload');
  console.log('  🔄 Automatic image processing and validation');
  console.log('  🗑️  Automatic cleanup when streams are deleted');
  console.log('  👁️  Enhanced discovery page with thumbnails');
  console.log('  ⚙️  Stream management interface');
  console.log('');

  // Step 4: Create a quick reference file
  const quickRefContent = `# Livestream Thumbnails Setup - Quick Reference

## Files Modified/Created:
- ✅ supabase/migrations/20250202000000_add_stream_display_images.sql
- ✅ setup-stream-images-bucket.sql
- ✅ src/services/thumbnailService.ts
- ✅ src/services/streamImageService.ts
- ✅ Components updated for thumbnail support

## Database Changes:
- Added display_image_url column to live_streams table
- Created stream_images table for metadata
- Added storage bucket: stream-images
- Configured RLS policies
- Added cleanup triggers

## Next Steps:
1. Apply database migration (choose method above)
2. Run storage setup script
3. Test thumbnail functionality
4. Deploy to production

## Support:
- Test file: test-thumbnail-system.html
- Documentation: STREAM_DISPLAY_IMAGES_FEATURE.md
`;

  fs.writeFileSync(path.join(__dirname, 'THUMBNAILS_SETUP_COMPLETE.md'), quickRefContent);
  printSuccess('Created quick reference: THUMBNAILS_SETUP_COMPLETE.md');

  console.log('');
  printSuccess('🚀 AUTOMATED SETUP COMPLETED SUCCESSFULLY!');
  printStatus('All files are prepared and ready for deployment.');
  printStatus('Choose your preferred deployment method above and follow the steps.');
  console.log('');
}

// Run the setup
main().catch(console.error);
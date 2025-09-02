#!/usr/bin/env node

/**
 * Setup script for website improvements
 * Run this after implementing the new features
 */

import { promises as fs } from 'fs';
import path from 'path';

const setupImprovements = async () => {
  console.log('🚀 Setting up website improvements...');

  try {
    // 1. Generate sitemap
    console.log('📄 Generating sitemap...');
    const { generateSitemap } = await import('./src/utils/sitemapGenerator.ts');
    const sitemap = await generateSitemap();
    await fs.writeFile('./public/sitemap.xml', sitemap);
    console.log('✅ Sitemap generated');

    // 2. Create PWA icons (placeholder - you'll need actual icon files)
    console.log('🎨 Setting up PWA icons...');
    const iconsDir = './public/assets';
    await fs.mkdir(iconsDir, { recursive: true });
    
    // You'll need to add actual icon files here
    console.log('📝 Note: Add icon-192.png and icon-512.png to /public/assets/');
    console.log('📝 Note: Add apple-touch-icon.png to /public/assets/');
    console.log('📝 Note: Add og-image.jpg to /public/assets/');

    // 3. Update package.json with new scripts
    console.log('📦 Updating package.json...');
    const packageJsonPath = './package.json';
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    // Add new scripts if they don't exist
    if (!packageJson.scripts['build:pwa']) {
      packageJson.scripts['build:pwa'] = 'vite build && npm run generate-sw';
    }
    if (!packageJson.scripts['generate-sitemap']) {
      packageJson.scripts['generate-sitemap'] = 'node setup-improvements.js';
    }
    
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Package.json updated');

    // 4. Setup environment variables template
    console.log('🔧 Creating environment template...');
    const envTemplate = `# Analytics and Performance
VITE_ANALYTICS_ENDPOINT=your_analytics_endpoint_here
VITE_GTM_ID=your_google_tag_manager_id

# PWA Configuration
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
VITE_VAPID_PRIVATE_KEY=your_vapid_private_key

# App Configuration
VITE_APP_URL=https://pompeii.app
VITE_APP_NAME=Pompeii
`;
    
    await fs.writeFile('./.env.example', envTemplate);
    console.log('✅ Environment template created');

    console.log('\n🎉 Setup complete! Next steps:');
    console.log('1. Run the database migration: create-achievements-system.sql');
    console.log('2. Add actual PWA icon files to /public/assets/');
    console.log('3. Configure your analytics endpoint in .env');
    console.log('4. Test the PWA installation prompt');
    console.log('5. Deploy and test all new features');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupImprovements();
}

export { setupImprovements };
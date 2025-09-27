#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Deployment Verification Script\n');

// Check if build succeeded
const distPath = path.join(__dirname, 'dist');
const distExists = fs.existsSync(distPath);

console.log('📁 Build Output Check:');
if (distExists) {
  console.log('  ✅ dist/ directory exists');
  
  const indexPath = path.join(distPath, 'index.html');
  const indexExists = fs.existsSync(indexPath);
  
  if (indexExists) {
    console.log('  ✅ index.html exists');
    
    // Check for essential assets
    const assetsPath = path.join(distPath, 'assets');
    if (fs.existsSync(assetsPath)) {
      const assets = fs.readdirSync(assetsPath);
      const jsFiles = assets.filter(f => f.endsWith('.js'));
      const cssFiles = assets.filter(f => f.endsWith('.css'));
      
      console.log(`  ✅ ${jsFiles.length} JavaScript files`);
      console.log(`  ✅ ${cssFiles.length} CSS files`);
      
      // Check bundle sizes
      jsFiles.forEach(file => {
        const filePath = path.join(assetsPath, file);
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`    📦 ${file}: ${sizeKB}KB`);
      });
    }
  } else {
    console.log('  ❌ index.html missing');
  }
} else {
  console.log('  ❌ dist/ directory missing - run npm run build first');
  process.exit(1);
}

console.log('\n📋 Package.json Check:');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log('  ✅ package.json exists');
  console.log(`  📦 App name: ${packageJson.name}`);
  console.log(`  🏷️ Version: ${packageJson.version}`);
  
  // Check essential scripts
  const scripts = packageJson.scripts || {};
  const requiredScripts = ['build', 'dev', 'preview'];
  
  requiredScripts.forEach(script => {
    if (scripts[script]) {
      console.log(`  ✅ ${script} script: ${scripts[script]}`);
    } else {
      console.log(`  ❌ ${script} script missing`);
    }
  });
} else {
  console.log('  ❌ package.json missing');
}

console.log('\n🔧 Configuration Check:');

// Check vercel.json
const vercelPath = path.join(__dirname, 'vercel.json');
if (fs.existsSync(vercelPath)) {
  console.log('  ✅ vercel.json exists');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  
  if (vercelConfig.rewrites) {
    console.log('  ✅ SPA rewrites configured');
  }
  
  if (vercelConfig.buildCommand) {
    console.log(`  ✅ Build command: ${vercelConfig.buildCommand}`);
  }
} else {
  console.log('  ⚠️ vercel.json missing (optional)');
}

// Check vite.config.ts
const viteConfigPath = path.join(__dirname, 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  console.log('  ✅ vite.config.ts exists');
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  if (viteConfig.includes('manualChunks')) {
    console.log('  ✅ Bundle optimization configured');
  }
  
  if (viteConfig.includes('resolve')) {
    console.log('  ✅ Path aliases configured');
  }
}

console.log('\n🌍 Environment Variables:');
const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`  ✅ ${envVar}: Set`);
  } else {
    console.log(`  ⚠️ ${envVar}: Not set (required for production)`);
  }
});

console.log('\n📊 Bundle Analysis:');
if (distExists) {
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const assets = fs.readdirSync(assetsPath);
    const totalSize = assets.reduce((total, file) => {
      const filePath = path.join(assetsPath, file);
      return total + fs.statSync(filePath).size;
    }, 0);
    
    const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
    console.log(`  📦 Total bundle size: ${totalMB}MB`);
    
    if (totalSize < 5 * 1024 * 1024) { // 5MB
      console.log('  ✅ Bundle size is reasonable');
    } else {
      console.log('  ⚠️ Bundle size is large - consider further optimization');
    }
  }
}

console.log('\n🎯 Deployment Readiness:');

let readyForDeployment = distExists;
let score = 0;
let maxScore = 0;

const checks = [
  { name: 'Build succeeds', condition: distExists, weight: 3 },
  { name: 'Assets exist', condition: fs.existsSync(path.join(distPath, 'assets')), weight: 2 },
  { name: 'Configuration present', condition: fs.existsSync(vercelPath), weight: 1 },
  { name: 'Dependencies installed', condition: fs.existsSync(path.join(__dirname, 'node_modules')), weight: 2 },
];

checks.forEach(check => {
  maxScore += check.weight;
  if (check.condition) {
    score += check.weight;
    console.log(`  ✅ ${check.name}`);
  } else {
    console.log(`  ❌ ${check.name}`);
  }
});

const percentage = Math.round((score / maxScore) * 100);
console.log(`\n📈 Deployment Score: ${score}/${maxScore} (${percentage}%)`);

if (percentage >= 80) {
  console.log('🎉 READY FOR DEPLOYMENT!');
  console.log('\n🚀 Next Steps:');
  console.log('  1. Set environment variables on your hosting platform');
  console.log('  2. Connect your repository or upload dist/ folder');
  console.log('  3. Deploy and test in production');
} else {
  console.log('⚠️ Deployment not recommended - please fix issues above');
}

console.log('\n💡 Quick Deploy Commands:');
console.log('  Vercel: npx vercel --prod');
console.log('  Netlify: npx netlify deploy --prod --dir=dist');
console.log('  Manual: Upload dist/ folder to your hosting service');

console.log('\n🔗 Helpful Links:');
console.log('  📚 Troubleshooting: /DEPLOYMENT_FIX_GUIDE.md');
console.log('  🏘️ Communities Status: /COMMUNITIES_FEATURE_STATUS.md');
console.log('  📅 Calendar Guide: /CALENDAR_TROUBLESHOOTING_GUIDE.md');
console.log('  🛠️ Debug Tool: /debug-communities-feature.html');
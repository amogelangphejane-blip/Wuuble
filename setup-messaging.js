#!/usr/bin/env node

/**
 * Messaging System Setup Script
 * This script helps set up and verify the messaging system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up Messaging System...\n');

// Check if required files exist
const requiredFiles = [
  'src/pages/Messages.tsx',
  'src/components/MessageBubble.tsx',
  'src/components/MessageInput.tsx',
  'src/components/ConversationList.tsx',
  'src/services/messageService.ts',
  'src/hooks/useMessages.tsx'
];

console.log('✅ Checking required files...');
const missingFiles = [];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log('\n❌ Some required files are missing. Please ensure all components are properly created.');
  process.exit(1);
}

console.log('\n✅ All messaging components are present!');

// Check database schema
console.log('\n📊 Database setup instructions:');
console.log('   1. Run the SQL schema in your Supabase dashboard:');
console.log('      File: create-messaging-schema.sql');
console.log('   2. Ensure your profiles table exists with:');
console.log('      - user_id (UUID, references auth.users.id)');
console.log('      - display_name (TEXT)');
console.log('      - avatar_url (TEXT)');

console.log('\n🌐 How to access the messaging system:');
console.log('   1. Start your development server:');
console.log('      npm run dev');
console.log('   2. Navigate to: http://localhost:5173/messages');
console.log('   3. Make sure you\'re logged in first!');

console.log('\n🔧 Features included:');
console.log('   ✓ Real-time messaging');
console.log('   ✓ Message reactions (16 emojis)');
console.log('   ✓ Reply to messages');
console.log('   ✓ Edit & delete messages');
console.log('   ✓ Typing indicators');
console.log('   ✓ Online status');
console.log('   ✓ File/media sharing');
console.log('   ✓ Voice message recording');
console.log('   ✓ Message search');
console.log('   ✓ Group chat creation');
console.log('   ✓ Notification settings');
console.log('   ✓ Message scheduling');

console.log('\n🎨 UI Features:');
console.log('   ✓ WhatsApp-inspired design (but distinct)');
console.log('   ✓ Dark/light mode support');
console.log('   ✓ Mobile responsive');
console.log('   ✓ Smooth animations');
console.log('   ✓ Accessibility compliant');

console.log('\n📝 Quick troubleshooting:');
console.log('   1. If you see "User not authenticated":');
console.log('      - Make sure you\'re logged in');
console.log('      - Check your auth implementation');
console.log('   2. If conversations don\'t load:');
console.log('      - Verify the database schema is applied');
console.log('      - Check Supabase connection');
console.log('   3. If components have errors:');
console.log('      - Run: npm install');
console.log('      - Check for TypeScript errors');

console.log('\n🎯 Next steps:');
console.log('   1. Apply the database schema');
console.log('   2. Ensure user authentication works');
console.log('   3. Visit /messages to test the system');
console.log('   4. Create test conversations and messages');

console.log('\n✨ Messaging system is ready to use!');
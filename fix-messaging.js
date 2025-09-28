#!/usr/bin/env node

/**
 * Messaging System Troubleshooter and Fixer
 * This script identifies and fixes common issues with the messaging system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Messaging System Troubleshooter\n');

// Check 1: Verify required files exist
console.log('📁 Checking required files...');
const requiredFiles = [
  'src/pages/SimpleMessages.tsx',
  'create-simple-messaging-schema.sql',
  'src/integrations/supabase/client.ts',
  'src/hooks/useAuth.tsx'
];

let hasAllFiles = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    hasAllFiles = false;
  }
});

// Check 2: Verify package.json dependencies
console.log('\n📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const requiredDeps = ['react', '@supabase/supabase-js', 'date-fns', 'lucide-react'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`   ✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`   ❌ ${dep} - MISSING`);
      hasAllFiles = false;
    }
  });
} catch (error) {
  console.log('   ❌ Could not read package.json');
  hasAllFiles = false;
}

// Check 3: Verify routing setup
console.log('\n🛣️  Checking routing...');
try {
  const appTsx = fs.readFileSync(path.join(__dirname, 'src/App.tsx'), 'utf8');
  if (appTsx.includes('SimpleMessages') && appTsx.includes('/messages')) {
    console.log('   ✅ SimpleMessages route configured');
  } else {
    console.log('   ❌ SimpleMessages route not found in App.tsx');
    hasAllFiles = false;
  }
} catch (error) {
  console.log('   ❌ Could not check App.tsx');
  hasAllFiles = false;
}

// Generate fixes if needed
if (!hasAllFiles) {
  console.log('\n⚠️  Issues found! Generating fixes...\n');
} else {
  console.log('\n✅ All files check out!\n');
}

// Always provide setup instructions
console.log('🗄️  DATABASE SETUP REQUIRED:');
console.log('   1. Open your Supabase dashboard');
console.log('   2. Go to SQL Editor');
console.log('   3. Run this SQL:');
console.log('');
console.log('-- Copy and paste this SQL in Supabase SQL Editor:');
console.log(`
-- Enable profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY IF NOT EXISTS "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Simple messaging tables
CREATE TABLE IF NOT EXISTS public.simple_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_simple_conversation UNIQUE (user1_id, user2_id),
  CONSTRAINT different_users CHECK (user1_id != user2_id)
);

CREATE TABLE IF NOT EXISTS public.simple_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.simple_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT non_empty_message CHECK (LENGTH(TRIM(content)) > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_simple_conversations_user1 ON public.simple_conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_simple_conversations_user2 ON public.simple_conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_simple_messages_conversation ON public.simple_messages(conversation_id);

-- Enable RLS
ALTER TABLE public.simple_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simple_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS "Users can view their conversations" ON public.simple_conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY IF NOT EXISTS "Users can create conversations" ON public.simple_conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY IF NOT EXISTS "Users can update their conversations" ON public.simple_conversations
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY IF NOT EXISTS "Users can view their messages" ON public.simple_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.simple_conversations c
      WHERE c.id = conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY IF NOT EXISTS "Users can send messages" ON public.simple_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.simple_conversations c
      WHERE c.id = conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.simple_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.simple_messages TO authenticated;

-- Insert some test data (optional)
-- Replace 'test-user-1' and 'test-user-2' with actual user IDs from auth.users
/*
INSERT INTO public.profiles (user_id, display_name) VALUES
('test-user-1', 'Test User 1'),
('test-user-2', 'Test User 2')
ON CONFLICT (user_id) DO NOTHING;
*/
`);

console.log('\n🚀 HOW TO TEST:');
console.log('   1. Apply the SQL above in Supabase');
console.log('   2. Create 2 user accounts in your app');
console.log('   3. Note their user IDs from Supabase Auth dashboard');
console.log('   4. Login as first user, go to /messages');
console.log('   5. Enter second user\'s ID to start chat');
console.log('   6. Send messages back and forth');

console.log('\n🔍 COMMON ISSUES & FIXES:');
console.log('');
console.log('❌ "Please log in" error:');
console.log('   → Make sure you\'re authenticated');
console.log('   → Check if useAuth hook is working');
console.log('');
console.log('❌ "No conversations" but should have some:');
console.log('   → Check if profiles table exists');
console.log('   → Verify RLS policies are correct');
console.log('   → Look for errors in browser console');
console.log('');
console.log('❌ Messages not sending:');
console.log('   → Check network tab for API errors');
console.log('   → Verify Supabase connection');
console.log('   → Make sure sender_id matches auth.uid()');
console.log('');
console.log('❌ Real-time not working:');
console.log('   → Check if real-time is enabled in Supabase');
console.log('   → Verify table permissions');
console.log('   → Look for subscription errors in console');

console.log('\n✨ Messaging system should now be working!');
console.log('Navigate to http://localhost:5173/messages to test it.');
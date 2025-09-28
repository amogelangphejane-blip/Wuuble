#!/usr/bin/env node

// Simple database check script
import { createClient } from '@supabase/supabase-js';

// Try to load environment variables from .env files
try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch (e) {
  console.log('dotenv not available, using process.env directly');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('🔍 Checking Database Connection & Schema');
console.log('=====================================');

if (!supabaseUrl) {
  console.log('❌ VITE_SUPABASE_URL is not set');
  console.log('💡 Please add your Supabase URL to your environment variables');
  process.exit(1);
}

if (!supabaseKey) {
  console.log('❌ VITE_SUPABASE_ANON_KEY is not set');
  console.log('💡 Please add your Supabase anon key to your environment variables');
  process.exit(1);
}

console.log('✅ Environment variables are set');
console.log('🔗 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseKey.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('\n🔍 Testing database connection...');
  
  try {
    // Test 1: Basic connection
    console.log('📡 Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('communities')
      .select('count')
      .limit(0);
      
    if (testError) {
      if (testError.message.includes('relation "public.communities" does not exist')) {
        console.log('❌ Communities table does not exist');
        console.log('💡 You need to apply the database migration');
        console.log('\n📋 Run this SQL in your Supabase dashboard:');
        console.log('👉 https://supabase.com/dashboard/project/[your-project]/sql');
        console.log('\n--- Copy this SQL ---');
        console.log(`
-- Create communities table
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private BOOLEAN NOT NULL DEFAULT false,
  member_count INTEGER NOT NULL DEFAULT 1,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  rules TEXT,
  banner_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  subscription_price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view public communities" 
  ON public.communities 
  FOR SELECT 
  USING (NOT is_private OR creator_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "Users can create communities" 
  ON public.communities 
  FOR INSERT 
  WITH CHECK (auth.uid() = creator_id AND auth.uid() = owner_id);

CREATE POLICY "Community creators can update their communities" 
  ON public.communities 
  FOR UPDATE 
  USING (auth.uid() = creator_id OR auth.uid() = owner_id);

CREATE POLICY "Community creators can delete their communities" 
  ON public.communities 
  FOR DELETE 
  USING (auth.uid() = creator_id OR auth.uid() = owner_id);

-- Grant permissions
GRANT ALL ON public.communities TO authenticated;
GRANT ALL ON public.communities TO service_role;
        `);
        return;
      }
      
      if (testError.message.includes('JWT')) {
        console.log('❌ Authentication issue');
        console.log('💡 The API key might be invalid or RLS is blocking access');
        console.log('🔍 Error:', testError.message);
        return;
      }
      
      console.log('❌ Database error:', testError.message);
      console.log('💡 Check your Supabase project settings');
      return;
    }
    
    console.log('✅ Communities table exists and is accessible!');
    
    // Test 2: Try to fetch communities
    console.log('\n📚 Fetching existing communities...');
    const { data: communities, error: fetchError } = await supabase
      .from('communities')
      .select('id, name, description, is_private, member_count')
      .limit(5);
      
    if (fetchError) {
      console.log('❌ Error fetching communities:', fetchError.message);
      return;
    }
    
    console.log('✅ Successfully fetched communities!');
    console.log('📊 Found', communities?.length || 0, 'communities');
    
    if (communities && communities.length > 0) {
      console.log('\n📋 Sample communities:');
      communities.forEach((community, index) => {
        console.log(`${index + 1}. ${community.name} (${community.member_count} members)`);
      });
    }
    
    // Test 3: Check community_members table
    console.log('\n👥 Checking community_members table...');
    const { data: membersTest, error: membersError } = await supabase
      .from('community_members')
      .select('count')
      .limit(0);
      
    if (membersError) {
      console.log('⚠️  Community members table issue:', membersError.message);
    } else {
      console.log('✅ Community members table is working!');
    }
    
    console.log('\n🎉 Database check completed successfully!');
    console.log('\n✨ Your database is ready for the communities feature!');
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

checkDatabase();
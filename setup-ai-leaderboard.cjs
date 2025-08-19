const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.error('- VITE_SUPABASE_ANON_KEY:', !!process.env.VITE_SUPABASE_ANON_KEY);
  console.log('\n💡 Using anon key as fallback for service operations...');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAILeaderboard() {
  console.log('🚀 Setting up AI Leaderboard System...\n');

  try {
    // Check if migration tables exist
    console.log('1️⃣ Checking database schema...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'community_%leaderboard%');

    if (tablesError) {
      console.error('Error checking tables:', tablesError);
    } else {
      console.log('Found leaderboard tables:', tables?.map(t => t.table_name) || []);
    }

    // Check if community_user_scores table exists
    const { data: userScoresTable, error: userScoresError } = await supabase
      .from('community_user_scores')
      .select('count(*)')
      .limit(1);

    if (userScoresError && userScoresError.code === '42P01') {
      console.log('❌ AI Leaderboard tables not found. You need to apply the migration.');
      console.log('\n📋 To apply the migration:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the migration file: supabase/migrations/20250129000000_add_ai_leaderboard_system.sql');
      console.log('\nOr if you have Supabase CLI installed:');
      console.log('   supabase db push');
      return;
    } else if (userScoresError) {
      console.error('❌ Error checking community_user_scores table:', userScoresError);
      return;
    } else {
      console.log('✅ AI Leaderboard tables exist');
    }

    // Check if any communities exist
    console.log('\n2️⃣ Checking for communities...');
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('id, name')
      .limit(5);

    if (communitiesError) {
      console.error('❌ Error fetching communities:', communitiesError);
      return;
    }

    if (!communities || communities.length === 0) {
      console.log('⚠️  No communities found. AI Leaderboard needs communities to work.');
      console.log('Create a community first, then run this setup script again.');
      return;
    }

    console.log('✅ Found communities:', communities.map(c => c.name).join(', '));

    // Initialize leaderboard settings for each community
    console.log('\n3️⃣ Initializing leaderboard settings...');
    
    for (const community of communities) {
      const { data: existingSettings, error: settingsCheckError } = await supabase
        .from('community_leaderboard_settings')
        .select('id')
        .eq('community_id', community.id)
        .single();

      if (settingsCheckError && settingsCheckError.code !== 'PGRST116') {
        console.error(`Error checking settings for ${community.name}:`, settingsCheckError);
        continue;
      }

      if (!existingSettings) {
        const { error: insertError } = await supabase
          .from('community_leaderboard_settings')
          .insert({
            community_id: community.id,
            scoring_weights: {
              chat_weight: 0.3,
              video_call_weight: 0.25,
              participation_weight: 0.25,
              quality_weight: 0.2
            },
            is_public: true,
            enable_ai_feedback: true,
            enable_ask_function: true
          });

        if (insertError) {
          console.error(`❌ Error creating settings for ${community.name}:`, insertError);
        } else {
          console.log(`✅ Created leaderboard settings for "${community.name}"`);
        }
      } else {
        console.log(`✅ Leaderboard settings already exist for "${community.name}"`);
      }
    }

    // Test AI service
    console.log('\n4️⃣ Testing AI Service...');
    
    const testApiKey = process.env.VITE_OPENAI_API_KEY;
    if (!testApiKey) {
      console.log('⚠️  OpenAI API key not configured. AI will use mock responses.');
      console.log('   Add VITE_OPENAI_API_KEY to your .env file for full AI functionality.');
    } else {
      console.log('✅ OpenAI API key configured');
    }

    // Create a test user score entry for the first community if none exists
    console.log('\n5️⃣ Checking user score data...');
    
    const firstCommunity = communities[0];
    const { data: userScores, error: scoresError } = await supabase
      .from('community_user_scores')
      .select('count(*)')
      .eq('community_id', firstCommunity.id);

    if (scoresError) {
      console.error('Error checking user scores:', scoresError);
    } else {
      const count = userScores?.[0]?.count || 0;
      console.log(`Found ${count} user score entries in "${firstCommunity.name}"`);
      
      if (count === 0) {
        console.log('💡 To test the AI leaderboard:');
        console.log('1. Join a community');
        console.log('2. Participate in activities (chat, video calls, etc.)');
        console.log('3. The system will automatically create score entries');
      }
    }

    console.log('\n🎉 AI Leaderboard setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Navigate to a community page');
    console.log('3. Look for the leaderboard section');
    console.log('4. Try asking questions like "What is my rank?" or "How can I improve?"');
    
    if (!testApiKey) {
      console.log('\n💡 For full AI functionality, add your OpenAI API key to .env:');
      console.log('   VITE_OPENAI_API_KEY=your-api-key-here');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
    
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      console.log('\n💡 This error suggests the database migration hasn\'t been applied.');
      console.log('Please apply the AI leaderboard migration first.');
    }
  }
}

// Run the setup
setupAILeaderboard().catch(console.error);
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testGroupCallTables() {
  console.log('🧪 Testing group call database setup...\n');

  try {
    // Test 1: Check if tables exist by trying to query them
    console.log('1️⃣ Testing community_group_calls table...');
    const { data: calls, error: callsError } = await supabase
      .from('community_group_calls')
      .select('id')
      .limit(1);

    if (callsError) {
      if (callsError.code === '42P01') {
        console.error('❌ community_group_calls table does not exist');
        console.log('   → Run the SAFE_GROUP_VIDEO_CALLS_MIGRATION.sql in Supabase SQL Editor');
        return false;
      } else {
        console.error('❌ Error accessing community_group_calls:', callsError.message);
        return false;
      }
    }
    console.log('✅ community_group_calls table exists');

    // Test 2: Check participants table
    console.log('2️⃣ Testing community_group_call_participants table...');
    const { data: participants, error: participantsError } = await supabase
      .from('community_group_call_participants')
      .select('id')
      .limit(1);

    if (participantsError) {
      if (participantsError.code === '42P01') {
        console.error('❌ community_group_call_participants table does not exist');
        return false;
      } else {
        console.error('❌ Error accessing community_group_call_participants:', participantsError.message);
        return false;
      }
    }
    console.log('✅ community_group_call_participants table exists');

    // Test 3: Check events table
    console.log('3️⃣ Testing community_group_call_events table...');
    const { data: events, error: eventsError } = await supabase
      .from('community_group_call_events')
      .select('id')
      .limit(1);

    if (eventsError) {
      if (eventsError.code === '42P01') {
        console.error('❌ community_group_call_events table does not exist');
        return false;
      } else {
        console.error('❌ Error accessing community_group_call_events:', eventsError.message);
        return false;
      }
    }
    console.log('✅ community_group_call_events table exists');

    // Test 4: Check if we can query communities table (dependency)
    console.log('4️⃣ Testing communities table access...');
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('id')
      .limit(1);

    if (communitiesError) {
      console.error('❌ Cannot access communities table:', communitiesError.message);
      console.log('   → This might indicate a permission issue');
      return false;
    }
    console.log('✅ communities table accessible');

    console.log('\n🎉 All database tables are set up correctly!');
    console.log('\n🔍 Next steps to debug blank page:');
    console.log('1. Open browser DevTools (F12)');
    console.log('2. Go to Console tab');
    console.log('3. Click "Start Group Call"');
    console.log('4. Look for these debug messages:');
    console.log('   - 🎥 GroupVideoChat rendered with:');
    console.log('   - 🚀 Initializing services...');
    console.log('   - 🔄 GroupVideoChat state:');
    console.log('   - Creating group call in database...');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testGroupCallTables();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://tgmflbglhmnrliredlbn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbWZsYmdsaG1ucmxpcmVkbGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDY1MDksImV4cCI6MjA2OTQ4MjUwOX0.I5OHpsbFZwUDRTM4uFFjoE43nW1LyZb1kOE1N9OTAI8";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testLivestreamTables() {
  console.log('🔍 Testing livestream database tables...\n');

  const tables = [
    'live_streams',
    'stream_viewers',
    'stream_chat',
    'stream_reactions',
    'stream_questions',
    'stream_polls'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Table accessible`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

// Run tests
testLivestreamTables()
  .then(() => {
    console.log('\n🏁 Database test completed');
    console.log('\n📝 Next steps:');
    console.log('   1. Check browser console for media device errors');
    console.log('   2. Verify camera/microphone permissions');
    console.log('   3. Test in HTTPS environment if using HTTP');
  })
  .catch(console.error);
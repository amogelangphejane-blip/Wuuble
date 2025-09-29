const { createClient } = require('@supabase/supabase-js');

// Check if running in Node.js environment and try to load from .env if available
let supabaseUrl, supabaseKey;

try {
  // Try to load from environment or .env file
  if (typeof process !== 'undefined') {
    supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  }
} catch (e) {
  console.log('Could not load environment variables');
}

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠️  Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  console.log('   You can find these in your Supabase project settings');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMissingProfiles() {
  console.log('🔍 Checking for community members without profiles...');

  try {
    // Get all community members
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select(`
        user_id,
        profiles:user_id (
          user_id
        )
      `);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return;
    }

    console.log(`📊 Found ${members.length} community members`);

    // Find members without profiles
    const membersWithoutProfiles = members.filter(member => !member.profiles);
    
    console.log(`❌ Found ${membersWithoutProfiles.length} members without profiles`);

    if (membersWithoutProfiles.length === 0) {
      console.log('✅ All members already have profiles!');
      return;
    }

    // Get user data from auth.users for members without profiles
    const userIds = membersWithoutProfiles.map(m => m.user_id);
    
    console.log('🔧 Creating missing profiles...');
    
    let createdCount = 0;
    
    for (const userId of userIds) {
      try {
        // Create a basic profile for this user
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            display_name: 'Member', // Default name
            avatar_url: null,
            bio: null,
          });

        if (insertError && !insertError.message.includes('duplicate key')) {
          console.error(`Error creating profile for ${userId}:`, insertError);
        } else {
          createdCount++;
          console.log(`✅ Created profile for user ${userId}`);
        }
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
      }
    }

    console.log(`🎉 Successfully created ${createdCount} profiles!`);
    console.log('✨ Members feature should now work correctly');

  } catch (error) {
    console.error('❌ Error in fixMissingProfiles:', error);
  }
}

// Run the fix
fixMissingProfiles();
// Setup cleanup jobs for your application
// Add this to your main server/application file

const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');

// Use service role key for cleanup operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // You'll need this for admin operations
);

function setupCleanupJobs() {
  console.log('🧹 Setting up automated cleanup jobs...');
  
  // Daily cleanup of expired stream segments (2 AM)
  cron.schedule('0 2 * * *', async () => {
    console.log('🗂️  Running daily stream segments cleanup...');
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_stream_segments');
      if (error) {
        console.error('❌ Stream segments cleanup failed:', error.message);
      } else {
        console.log('✅ Stream segments cleanup completed');
      }
    } catch (err) {
      console.error('💥 Stream segments cleanup error:', err.message);
    }
  });

  // Weekly cleanup of orphaned chat attachments (Sunday 3 AM)
  cron.schedule('0 3 * * 0', async () => {
    console.log('💬 Running weekly chat attachments cleanup...');
    try {
      const { data, error } = await supabase.rpc('cleanup_orphaned_chat_attachments');
      if (error) {
        console.error('❌ Chat attachments cleanup failed:', error.message);
      } else {
        console.log('✅ Chat attachments cleanup completed');
      }
    } catch (err) {
      console.error('💥 Chat attachments cleanup error:', err.message);
    }
  });

  // Monthly cleanup of old recordings (1st day of month, 4 AM)
  cron.schedule('0 4 1 * *', async () => {
    console.log('🎥 Running monthly recordings cleanup...');
    try {
      const { data, error } = await supabase.rpc('cleanup_old_recordings');
      if (error) {
        console.error('❌ Recordings cleanup failed:', error.message);
      } else {
        console.log('✅ Recordings cleanup completed');
      }
    } catch (err) {
      console.error('💥 Recordings cleanup error:', err.message);
    }
  });

  // Daily storage usage logging (1 AM)
  cron.schedule('0 1 * * *', async () => {
    console.log('📊 Logging storage usage...');
    try {
      const { data, error } = await supabase.rpc('log_storage_usage');
      if (error) {
        console.error('❌ Storage usage logging failed:', error.message);
      } else {
        console.log('✅ Storage usage logged');
      }
    } catch (err) {
      console.error('💥 Storage usage logging error:', err.message);
    }
  });

  console.log('✅ Cleanup jobs scheduled successfully');
}

// Export for use in your main app
module.exports = { setupCleanupJobs };

// If running directly
if (require.main === module) {
  setupCleanupJobs();
  console.log('🚀 Cleanup service running... Press Ctrl+C to stop');
  
  // Keep the process running
  process.stdin.resume();
}
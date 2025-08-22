// Enable debug mode for livestream troubleshooting
// Run this in the browser console to enable detailed logging

console.log('🔧 Enabling livestream debug mode...');

// Enable livestream service debugging
localStorage.setItem('livestream_debug', 'true');

// Enable React DevTools profiler if available
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.settings.profilerEnabled = true;
}

// Add helpful debugging functions to window
window.debugLivestream = {
  // Check authentication status
  checkAuth: async () => {
    const { createClient } = window.supabase;
    const supabase = createClient(
      "https://tgmflbglhmnrliredlbn.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbWZsYmdsaG1ucmxpcmVkbGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDY1MDksImV4cCI6MjA2OTQ4MjUwOX0.I5OHpsbFZwUDRTM4uFFjoE43nW1LyZb1kOE1N9OTAI8"
    );
    
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('Auth status:', { user: user ? 'authenticated' : 'not authenticated', error });
    return { user, error };
  },
  
  // Test database connectivity
  testDatabase: async () => {
    const { createClient } = window.supabase;
    const supabase = createClient(
      "https://tgmflbglhmnrliredlbn.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbWZsYmdsaG1ucmxpcmVkbGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDY1MDksImV4cCI6MjA2OTQ4MjUwOX0.I5OHpsbFZwUDRTM4uFFjoE43nW1LyZb1kOE1N9OTAI8"
    );
    
    try {
      const { data: streams, error } = await supabase.from('live_streams').select('id, title').limit(5);
      console.log('Database test result:', { streams: streams?.length || 0, error });
      return { streams, error };
    } catch (err) {
      console.error('Database test failed:', err);
      return { streams: null, error: err };
    }
  },
  
  // Clear debug logs
  clearLogs: () => {
    console.clear();
    console.log('🧹 Debug logs cleared');
  },
  
  // Disable debug mode
  disable: () => {
    localStorage.removeItem('livestream_debug');
    console.log('🔕 Debug mode disabled');
  }
};

console.log('✅ Debug mode enabled!');
console.log('📝 Available commands:');
console.log('  - window.debugLivestream.checkAuth() - Check authentication');
console.log('  - window.debugLivestream.testDatabase() - Test database connection');
console.log('  - window.debugLivestream.clearLogs() - Clear console logs');
console.log('  - window.debugLivestream.disable() - Disable debug mode');
console.log('');
console.log('🔍 All livestream operations will now show detailed logs in the console.');
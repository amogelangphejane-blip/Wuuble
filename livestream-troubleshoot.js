#!/usr/bin/env node

/**
 * Comprehensive Livestream Troubleshooting Script
 * Identifies issues and provides step-by-step solutions
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://tgmflbglhmnrliredlbn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbWZsYmdsaG1ucmxpcmVkbGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDY1MDksImV4cCI6MjA2OTQ4MjUwOX0.I5OHpsbFZwUDRTM4uFFjoE43nW1LyZb1kOE1N9OTAI8";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function section(title) {
  log(`\n🔍 ${title}`, 'cyan');
  log('='.repeat(title.length + 4), 'cyan');
}

async function checkDatabaseTables() {
  section('Database Tables Status');
  
  const tables = [
    'live_streams',
    'stream_chat', 
    'stream_reactions',
    'stream_viewers',
    'stream_questions',
    'stream_polls'
  ];
  
  const results = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        error(`Table '${table}': ${error.message}`);
        results[table] = { accessible: false, error: error.message };
      } else {
        success(`Table '${table}': Accessible`);
        results[table] = { accessible: true, error: null };
      }
    } catch (err) {
      error(`Table '${table}': ${err.message}`);
      results[table] = { accessible: false, error: err.message };
    }
  }
  
  return results;
}

async function checkRLSPolicies() {
  section('Row Level Security Policies');
  
  try {
    // Test anonymous access to public streams
    const { data: publicStreams, error: publicError } = await supabase
      .from('live_streams')
      .select('id, title, status, visibility')
      .limit(5);

    if (publicError) {
      error(`Public stream access: ${publicError.message}`);
      return { publicAccess: false, error: publicError.message };
    } else {
      success(`Public streams accessible: ${publicStreams.length} found`);
      if (publicStreams.length > 0) {
        info(`Sample: "${publicStreams[0].title}" (${publicStreams[0].status})`);
      }
    }

    // Test stream creation (will fail for anonymous user - expected)
    const testStream = {
      title: 'RLS Test Stream',
      description: 'Testing RLS policies',
      status: 'scheduled',
      creator_id: '00000000-0000-0000-0000-000000000000',
      max_viewers: 100,
      settings: { qa_mode: false, polls_enabled: true, reactions_enabled: true, chat_moderation: false },
      tags: ['test']
    };

    const { error: createError } = await supabase
      .from('live_streams')
      .insert(testStream);

    if (createError) {
      if (createError.message.includes('row-level security')) {
        warning('Stream creation blocked by RLS (expected for anonymous user)');
        return { 
          publicAccess: true, 
          createAccess: false, 
          needsAuth: true,
          error: 'RLS requires authentication for stream creation'
        };
      } else {
        error(`Stream creation error: ${createError.message}`);
        return { publicAccess: true, createAccess: false, error: createError.message };
      }
    } else {
      success('Stream creation allowed (unexpected for anonymous user)');
      return { publicAccess: true, createAccess: true, needsAuth: false };
    }

  } catch (err) {
    error(`RLS check failed: ${err.message}`);
    return { publicAccess: false, error: err.message };
  }
}

async function checkRealtimeConnection() {
  section('Realtime Connection Test');
  
  return new Promise((resolve) => {
    let connected = false;
    let timeout;
    
    const channel = supabase
      .channel('troubleshoot-livestream')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_streams'
      }, (payload) => {
        info(`Realtime event received: ${payload.eventType}`);
      })
      .subscribe((status) => {
        info(`Realtime status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          success('Realtime connection established');
          connected = true;
          
          timeout = setTimeout(() => {
            channel.unsubscribe();
            resolve({ connected: true, status });
          }, 2000);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          error(`Realtime connection failed: ${status}`);
          clearTimeout(timeout);
          resolve({ connected: false, status });
        }
      });
    
    setTimeout(() => {
      if (!connected) {
        error('Realtime connection timeout');
        channel.unsubscribe();
        resolve({ connected: false, status: 'timeout' });
      }
    }, 10000);
  });
}

async function checkWebRTCSupport() {
  section('WebRTC Browser Support Check');
  
  info('WebRTC features to test in browser:');
  const features = [
    'navigator.mediaDevices.getUserMedia() - Camera/microphone access',
    'RTCPeerConnection - Peer-to-peer connections', 
    'RTCDataChannel - Data channel support',
    'navigator.mediaDevices.getDisplayMedia() - Screen sharing',
    'RTCIceCandidate - ICE candidate handling'
  ];
  
  features.forEach(feature => info(`  • ${feature}`));
  
  return { browserTestRequired: true, features };
}

async function generateSolutions(results) {
  section('Recommended Solutions');
  
  const solutions = [];
  
  // Database issues
  const failedTables = Object.entries(results.database)
    .filter(([_, result]) => !result.accessible)
    .map(([table, _]) => table);
    
  if (failedTables.length > 0) {
    solutions.push({
      priority: 'HIGH',
      issue: `Database tables not accessible: ${failedTables.join(', ')}`,
      solution: 'Run database migrations to create missing tables',
      command: 'Apply the SQL migration files in Supabase SQL Editor'
    });
  }
  
  // RLS issues
  if (results.rls.needsAuth && !results.rls.createAccess) {
    solutions.push({
      priority: 'HIGH', 
      issue: 'RLS policies too restrictive for stream creation',
      solution: 'Apply RLS policy fixes for better public access',
      command: 'Run fix-livestream-policies.sql in Supabase SQL Editor'
    });
  }
  
  // Realtime issues
  if (!results.realtime.connected) {
    solutions.push({
      priority: 'MEDIUM',
      issue: 'Realtime connection failed',
      solution: 'Check Realtime settings in Supabase project',
      command: 'Enable Realtime in Supabase Dashboard > Settings > API'
    });
  }
  
  // Display solutions
  if (solutions.length === 0) {
    success('No critical issues found! System appears healthy.');
    info('Proceed to browser testing for WebRTC functionality.');
  } else {
    solutions.forEach((sol, index) => {
      log(`\n${index + 1}. [${sol.priority}] ${sol.issue}`, sol.priority === 'HIGH' ? 'red' : 'yellow');
      log(`   Solution: ${sol.solution}`, 'cyan');
      log(`   Action: ${sol.command}`, 'blue');
    });
  }
  
  return solutions;
}

async function generateBrowserTestScript() {
  section('Browser Test Instructions');
  
  info('To complete troubleshooting, test these in your browser:');
  log('\n1. Open browser developer tools (F12)');
  log('2. Navigate to: http://localhost:5173/azar-livestreams');
  log('3. Try to create a livestream (requires login)');
  log('4. Check console for WebRTC errors');
  log('5. Test camera/microphone permissions');
  log('\nExpected browser console output:');
  log('  ✅ "Camera access granted"');
  log('  ✅ "WebRTC peer connection created"');
  log('  ✅ "Realtime subscription active"');
  log('\nCommon issues to watch for:');
  log('  ❌ "Permission denied" - Allow camera/mic access');
  log('  ❌ "HTTPS required" - Ensure secure connection');
  log('  ❌ "Network error" - Check firewall/proxy settings');
}

async function main() {
  log('🎥 Livestream Feature Troubleshooting', 'magenta');
  log('=====================================', 'magenta');
  log(`Testing: ${SUPABASE_URL}`, 'blue');
  
  try {
    const results = {};
    
    // Run all checks
    results.database = await checkDatabaseTables();
    results.rls = await checkRLSPolicies();
    results.realtime = await checkRealtimeConnection();
    results.webrtc = await checkWebRTCSupport();
    
    // Generate solutions
    const solutions = await generateSolutions(results);
    
    // Browser test instructions
    await generateBrowserTestScript();
    
    // Summary
    section('Summary');
    const criticalIssues = solutions.filter(s => s.priority === 'HIGH').length;
    const totalIssues = solutions.length;
    
    if (criticalIssues === 0) {
      success(`System Status: HEALTHY (${totalIssues} minor issues)`);
    } else {
      warning(`System Status: NEEDS ATTENTION (${criticalIssues} critical issues)`);
    }
    
    info(`Database: ${Object.values(results.database).filter(r => r.accessible).length}/${Object.keys(results.database).length} tables accessible`);
    info(`RLS: ${results.rls.publicAccess ? 'Public access OK' : 'Access issues'}`);
    info(`Realtime: ${results.realtime.connected ? 'Connected' : 'Failed'}`);
    info(`WebRTC: Browser testing required`);
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      status: criticalIssues === 0 ? 'healthy' : 'needs_attention',
      results,
      solutions,
      summary: {
        critical_issues: criticalIssues,
        total_issues: totalIssues,
        database_health: Object.values(results.database).filter(r => r.accessible).length / Object.keys(results.database).length,
        realtime_connected: results.realtime.connected
      }
    };
    
    import('fs').then(fs => {
      fs.writeFileSync('livestream-troubleshoot-report.json', JSON.stringify(report, null, 2));
      info('\n📄 Detailed report saved: livestream-troubleshoot-report.json');
    }).catch(() => {
      info('\n📄 Could not save report file');
    });
    
    process.exit(criticalIssues > 0 ? 1 : 0);
    
  } catch (err) {
    error(`Troubleshooting failed: ${err.message}`);
    process.exit(1);
  }
}

main();
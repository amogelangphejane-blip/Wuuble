#!/usr/bin/env node

/**
 * Comprehensive Livestream Test Script
 * Tests all aspects of the livestream functionality
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

async function testDatabaseTables() {
  log('\n🗃️  Testing Database Tables', 'cyan');
  log('================================', 'cyan');
  
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
        results[table] = false;
      } else {
        success(`Table '${table}': Accessible`);
        results[table] = true;
      }
    } catch (err) {
      error(`Table '${table}': ${err.message}`);
      results[table] = false;
    }
  }
  
  return results;
}

async function testStreamCreation() {
  log('\n🎬 Testing Stream Creation', 'cyan');
  log('================================', 'cyan');
  
  try {
    // Try to create a test stream
    const testStream = {
      title: 'Test Stream - ' + Date.now(),
      description: 'Automated test stream',
      status: 'scheduled',
      creator_id: '00000000-0000-0000-0000-000000000000', // Test UUID
      max_viewers: 100,
      settings: {
        qa_mode: false,
        polls_enabled: true,
        reactions_enabled: true,
        chat_moderation: false
      },
      tags: ['test']
    };
    
    const { data, error } = await supabase
      .from('live_streams')
      .insert(testStream)
      .select()
      .single();
    
    if (error) {
      if (error.message.includes('authentication')) {
        warning('Stream creation requires authentication (expected for anonymous test)');
        return { canCreate: false, reason: 'authentication_required' };
      } else {
        error(`Stream creation failed: ${error.message}`);
        return { canCreate: false, reason: error.message };
      }
    } else {
      success('Stream created successfully');
      
      // Clean up test stream
      await supabase
        .from('live_streams')
        .delete()
        .eq('id', data.id);
      
      info('Test stream cleaned up');
      return { canCreate: true, streamId: data.id };
    }
  } catch (err) {
    error(`Stream creation test failed: ${err.message}`);
    return { canCreate: false, reason: err.message };
  }
}

async function testStreamRetrieval() {
  log('\n📺 Testing Stream Retrieval', 'cyan');
  log('================================', 'cyan');
  
  try {
    const { data, error } = await supabase
      .from('live_streams')
      .select(`
        *,
        profiles:creator_id (
          id,
          user_id,
          display_name,
          avatar_url
        )
      `)
      .limit(10);
    
    if (error) {
      error(`Stream retrieval failed: ${error.message}`);
      return { canRetrieve: false, reason: error.message };
    } else {
      success(`Retrieved ${data.length} streams`);
      
      if (data.length > 0) {
        info(`Sample stream: "${data[0].title}" (${data[0].status})`);
      } else {
        info('No streams found in database');
      }
      
      return { canRetrieve: true, count: data.length };
    }
  } catch (err) {
    error(`Stream retrieval test failed: ${err.message}`);
    return { canRetrieve: false, reason: err.message };
  }
}

async function testRealtimeConnection() {
  log('\n📡 Testing Realtime Connection', 'cyan');
  log('================================', 'cyan');
  
  return new Promise((resolve) => {
    let connected = false;
    let timeout;
    
    const channel = supabase
      .channel('test-livestream-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_streams'
      }, (payload) => {
        success('Realtime event received');
        info(`Event: ${payload.eventType}`);
      })
      .subscribe((status) => {
        info(`Realtime status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          success('Realtime connection established');
          connected = true;
          
          // Test complete after 2 seconds
          timeout = setTimeout(() => {
            channel.unsubscribe();
            resolve({ connected: true });
          }, 2000);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          error('Realtime connection failed');
          clearTimeout(timeout);
          resolve({ connected: false, reason: status });
        }
      });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (!connected) {
        error('Realtime connection timeout');
        channel.unsubscribe();
        resolve({ connected: false, reason: 'timeout' });
      }
    }, 10000);
  });
}

async function testWebRTCSupport() {
  log('\n🌐 Testing WebRTC Support', 'cyan');
  log('================================', 'cyan');
  
  // Note: This is a Node.js environment, so WebRTC won't be available
  // This test is more for documentation of what should be tested in browser
  
  const webrtcFeatures = [
    'RTCPeerConnection',
    'getUserMedia', 
    'getDisplayMedia',
    'RTCDataChannel',
    'RTCIceCandidate'
  ];
  
  info('WebRTC tests should be run in browser environment');
  info('Required features:');
  
  webrtcFeatures.forEach(feature => {
    info(`  - ${feature}`);
  });
  
  return { 
    supported: 'browser_only',
    features: webrtcFeatures 
  };
}

async function generateReport(results) {
  log('\n📊 Test Report', 'magenta');
  log('================================', 'magenta');
  
  const report = {
    timestamp: new Date().toISOString(),
    database: results.database,
    streamCreation: results.streamCreation,
    streamRetrieval: results.streamRetrieval,
    realtime: results.realtime,
    webrtc: results.webrtc,
    overall: 'unknown'
  };
  
  // Calculate overall status
  const criticalTests = [
    results.database.live_streams,
    results.streamRetrieval.canRetrieve,
    results.realtime.connected
  ];
  
  const passedCritical = criticalTests.filter(Boolean).length;
  const totalCritical = criticalTests.length;
  
  if (passedCritical === totalCritical) {
    report.overall = 'healthy';
    success(`Overall Status: HEALTHY (${passedCritical}/${totalCritical} critical tests passed)`);
  } else if (passedCritical >= totalCritical * 0.5) {
    report.overall = 'degraded';
    warning(`Overall Status: DEGRADED (${passedCritical}/${totalCritical} critical tests passed)`);
  } else {
    report.overall = 'critical';
    error(`Overall Status: CRITICAL (${passedCritical}/${totalCritical} critical tests passed)`);
  }
  
  log('\n📋 Summary:', 'cyan');
  log(`  Database Tables: ${Object.values(results.database).filter(Boolean).length}/${Object.keys(results.database).length} accessible`);
  log(`  Stream Retrieval: ${results.streamRetrieval.canRetrieve ? 'Working' : 'Failed'}`);
  log(`  Realtime: ${results.realtime.connected ? 'Connected' : 'Failed'}`);
  log(`  WebRTC: Browser testing required`);
  
  if (report.overall !== 'healthy') {
    log('\n🔧 Recommended Actions:', 'yellow');
    
    if (!results.database.live_streams) {
      log('  - Run database migrations to create livestream tables');
    }
    
    if (!results.streamRetrieval.canRetrieve) {
      log('  - Check RLS policies and permissions');
    }
    
    if (!results.realtime.connected) {
      log('  - Verify Realtime is enabled in Supabase project');
      log('  - Check network connectivity');
    }
    
    log('  - Run fix-livestream-policies.sql in Supabase SQL Editor');
    log('  - Test in browser environment for complete validation');
  }
  
  return report;
}

async function main() {
  log('🎥 Livestream Feature Test Suite', 'magenta');
  log('=================================', 'magenta');
  log(`Testing against: ${SUPABASE_URL}`, 'blue');
  log('');
  
  try {
    const results = {};
    
    // Run all tests
    results.database = await testDatabaseTables();
    results.streamCreation = await testStreamCreation();
    results.streamRetrieval = await testStreamRetrieval();
    results.realtime = await testRealtimeConnection();
    results.webrtc = await testWebRTCSupport();
    
    // Generate report
    const report = await generateReport(results);
    
    // Save report to file
    import('fs').then(fs => {
      const reportFile = 'livestream-test-report.json';
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      info(`\nDetailed report saved to: ${reportFile}`);
    }).catch(() => {
      info('\nCould not save report file');
    });
    
    // Exit with appropriate code
    process.exit(report.overall === 'critical' ? 1 : 0);
    
  } catch (err) {
    error(`Test suite failed: ${err.message}`);
    process.exit(1);
  }
}

// Run tests if called directly
main();
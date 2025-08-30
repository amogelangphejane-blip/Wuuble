#!/usr/bin/env node

// Verification script for messaging system fix
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://tgmflbglhmnrliredlbn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbWZsYmdsaG1ucmxpcmVkbGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDY1MDksImV4cCI6MjA2OTQ4MjUwOX0.I5OHpsbFZwUDRTM4uFFjoE43nW1LyZb1kOE1N9OTAI8";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyFix() {
    console.log('✅ Verifying Messaging System Fix...\n');
    
    let allTestsPassed = true;
    
    // Test 1: Database connectivity
    console.log('1. Testing database connectivity...');
    try {
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('   ✅ Database connection successful');
    } catch (error) {
        console.log('   ❌ Database connection failed:', error.message);
        allTestsPassed = false;
    }
    
    // Test 2: Schema existence
    console.log('\n2. Verifying messaging schema...');
    try {
        const conversationsTest = supabase.from('conversations').select('count', { count: 'exact', head: true });
        const messagesTest = supabase.from('messages').select('count', { count: 'exact', head: true });
        
        const [convResult, msgResult] = await Promise.all([conversationsTest, messagesTest]);
        
        if (convResult.error) throw new Error('Conversations table: ' + convResult.error.message);
        if (msgResult.error) throw new Error('Messages table: ' + msgResult.error.message);
        
        console.log('   ✅ Conversations table accessible');
        console.log('   ✅ Messages table accessible');
    } catch (error) {
        console.log('   ❌ Schema verification failed:', error.message);
        allTestsPassed = false;
    }
    
    // Test 3: Function availability and RLS fix
    console.log('\n3. Testing get_or_create_conversation function...');
    try {
        // Test with dummy UUIDs to check function behavior
        const { data, error } = await supabase.rpc('get_or_create_conversation', {
            user1_id: '00000000-0000-0000-0000-000000000001',
            user2_id: '00000000-0000-0000-0000-000000000002'
        });
        
        if (error) {
            if (error.message.includes('User 1 does not exist') || error.message.includes('User 2 does not exist')) {
                console.log('   ✅ Function exists and has proper validation');
                console.log('   ✅ RLS policy fix appears to be working');
            } else if (error.message.includes('row-level security')) {
                console.log('   ❌ RLS policy fix NOT applied - still getting RLS errors');
                console.log('   💡 Please apply fix-messaging-rls-policies.sql');
                allTestsPassed = false;
            } else {
                throw error;
            }
        } else {
            console.log('   ⚠️ Function worked with dummy UUIDs (unexpected but not necessarily bad)');
        }
    } catch (error) {
        if (error.message.includes('does not exist')) {
            console.log('   ❌ Function does not exist - migration not applied');
            console.log('   💡 Please apply the messaging system migration');
        } else {
            console.log('   ❌ Function test failed:', error.message);
        }
        allTestsPassed = false;
    }
    
    // Test 4: Real-time capabilities
    console.log('\n4. Testing real-time subscriptions...');
    try {
        const channel = supabase.channel('verification-test');
        
        const subscriptionPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Subscription timeout'));
            }, 5000);
            
            channel
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                }, () => {})
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        clearTimeout(timeout);
                        resolve(status);
                    } else if (status === 'CHANNEL_ERROR') {
                        clearTimeout(timeout);
                        reject(new Error('Channel error'));
                    }
                });
        });
        
        await subscriptionPromise;
        console.log('   ✅ Real-time subscriptions working');
        supabase.removeChannel(channel);
    } catch (error) {
        console.log('   ❌ Real-time test failed:', error.message);
        allTestsPassed = false;
    }
    
    // Test 5: Authentication check
    console.log('\n5. Checking authentication status...');
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
            console.log('   ✅ User is authenticated:', session.user.email);
            console.log('   💡 Full messaging functionality should be available');
        } else {
            console.log('   ⚠️ No active session');
            console.log('   💡 Users need to sign in to use messaging features');
        }
    } catch (error) {
        console.log('   ❌ Authentication check failed:', error.message);
        allTestsPassed = false;
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    if (allTestsPassed) {
        console.log('🎉 ALL TESTS PASSED!');
        console.log('\nMessaging system should be working correctly.');
        console.log('\nNext steps:');
        console.log('- Have users sign in to test messaging');
        console.log('- Monitor for any remaining issues');
        console.log('- Use the web diagnostic tool for further testing');
    } else {
        console.log('⚠️ SOME TESTS FAILED');
        console.log('\nPlease address the failed tests above.');
        console.log('\nMost likely fixes needed:');
        console.log('1. Apply fix-messaging-rls-policies.sql to your database');
        console.log('2. Ensure the messaging migration was applied');
        console.log('3. Check Supabase dashboard for any configuration issues');
    }
    
    console.log('\n📚 Additional Resources:');
    console.log('- Web diagnostic: http://localhost:8000/messaging-diagnostic.html');
    console.log('- Comprehensive test: http://localhost:8000/test-messaging-comprehensive.html');
    console.log('- Fix guide: MESSAGING_ERROR_FIX_GUIDE.md');
}

verifyFix().catch(console.error);
#!/usr/bin/env node

// One-click script to apply messaging system fix
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = "https://tgmflbglhmnrliredlbn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbWZsYmdsaG1ucmxpcmVkbGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDY1MDksImV4cCI6MjA2OTQ4MjUwOX0.I5OHpsbFZwUDRTM4uFFjoE43nW1LyZb1kOE1N9OTAI8";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyFix() {
    console.log('🔧 Applying Messaging System Fix...\n');
    
    try {
        // Read the fix SQL file
        const sqlFix = readFileSync('/workspace/fix-messaging-rls-policies.sql', 'utf8');
        
        console.log('1. Reading fix file: fix-messaging-rls-policies.sql');
        console.log('2. Applying RLS policy fixes...');
        
        // Note: The anon key cannot execute DDL statements like CREATE POLICY
        // This script serves as a guide - the SQL must be run with elevated privileges
        console.log('\n⚠️ IMPORTANT: This script cannot apply the fix directly.');
        console.log('The anonymous key does not have permission to modify database schema.');
        console.log('\n📋 TO APPLY THE FIX:');
        console.log('1. Open your Supabase dashboard');
        console.log('2. Go to SQL Editor');
        console.log('3. Copy and paste the contents of: fix-messaging-rls-policies.sql');
        console.log('4. Run the SQL script');
        console.log('5. Run: node verify-messaging-fix.js to confirm');
        
        console.log('\n📄 SQL FIX CONTENT:');
        console.log('=' .repeat(60));
        console.log(sqlFix);
        console.log('=' .repeat(60));
        
    } catch (error) {
        console.log('❌ Error reading fix file:', error.message);
    }
}

applyFix().catch(console.error);
# Fix Group Call Blank Page Issue

## 🔍 Problem
When clicking "Start Group Call", the success message appears but the page shows blank.

## 🚨 Root Cause
The database tables for group video calls are not set up in your Supabase database. The application code is working correctly, but database operations are failing silently.

## ✅ Solution

### Option 1: Manual Setup (Recommended)

1. **Go to your Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Execute the Migration**
   - Copy the entire contents of `SAFE_GROUP_VIDEO_CALLS_MIGRATION.sql` 
   - Paste it into the SQL Editor
   - Click "Run" to execute

### Option 2: Automated Setup (If you have service role key)

1. **Set up environment variables** (if not already done)
   ```bash
   # Add to your .env file
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **Run the setup script**
   ```bash
   node setup-group-video-calls.js
   ```

### Option 3: Using Supabase CLI

1. **Install Supabase CLI** (if not installed)
   ```bash
   npm install -g supabase
   ```

2. **Link your project**
   ```bash
   npx supabase link --project-ref your-project-ref
   ```

3. **Push migrations**
   ```bash
   npx supabase db push
   ```

## 🔧 Verification

After setting up the database tables:

1. **Check browser console** for any remaining errors
2. **Try starting a group call** again
3. **Look for these console messages**:
   - "CommunityGroupCall loaded with: ..." 
   - "Creating group call in database..."
   - If successful: "✅ Group video call tables set up successfully!"

## 🐛 Debugging

If the issue persists:

1. **Open browser Developer Tools** (F12)
2. **Go to Console tab**
3. **Click "Start Group Call"**
4. **Look for error messages** - they will now show specific database errors
5. **Check Network tab** for failed API requests

## 📋 What Was Fixed

1. **Better Error Handling**: The page now shows specific error messages instead of appearing blank
2. **Debug Logging**: Console logs help identify exactly where the issue occurs
3. **Database Error Detection**: Specific error codes (42P01) indicate missing tables
4. **User-Friendly Messages**: Clear error messages guide users to the solution

## 🎯 Expected Behavior After Fix

1. Click "Start Group Call" → Shows "Creating group call in database..." in console
2. Database creates call record successfully
3. Page navigates to group call interface
4. Shows pre-call screen with "Start Call" button
5. User can start/join video calls normally

## 📞 Need Help?

If you continue to have issues:
1. Check the console logs for specific error messages
2. Verify your Supabase project has the correct permissions
3. Ensure your user account is a member of the community
4. Contact support with the console error details
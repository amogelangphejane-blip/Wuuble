# AI Leaderboard "Ask" Function Fix Guide

## Issue: "Ask in AI leaderboard not working"

This guide provides step-by-step instructions to diagnose and fix the AI leaderboard "ask" functionality.

## ✅ Quick Fixes Applied

### 1. Fixed Missing Authentication Import
- **Issue**: `CommunityLeaderboard.tsx` was using `user?.id` but missing the `useAuth` hook
- **Fix**: Added `import { useAuth } from '@/hooks/useAuth';` and `const { user } = useAuth();`
- **Status**: ✅ COMPLETED

### 2. Environment Configuration
- **Issue**: Missing environment variable configuration
- **Fix**: Created `.env.example` with required variables
- **Status**: ✅ COMPLETED

## 🔧 Next Steps to Complete the Fix

### Step 1: Set Up Environment Variables

Create a `.env` file in your project root:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and add your actual values:

```env
# OpenAI API Configuration (Optional - will use mock if not provided)
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Step 2: Apply Database Migration

Ensure the AI leaderboard tables exist in your database:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the migration file in Supabase SQL Editor:
# supabase/migrations/20250129000000_add_ai_leaderboard_system.sql
```

### Step 3: Test the System

#### Option A: Use the Built-in Debugger

1. Add the debugger component to your leaderboard page temporarily:

```tsx
import { LeaderboardDebugger } from '@/components/LeaderboardDebugger';

// Add this above your existing leaderboard component
<LeaderboardDebugger communityId={communityId} />
```

2. Run the diagnostic and follow the recommendations

#### Option B: Use the Test Page

1. Open `/workspace/test-ai-leaderboard.html` in your browser
2. Click "Test AI Service" and "Test Mock Query" buttons
3. Verify that the mock implementation is working

### Step 4: Initialize User Data

The system automatically initializes user data when needed, but you can manually trigger it:

```tsx
// In your component, add a manual initialization button for testing
const initializeUserData = async () => {
  try {
    await leaderboardService.initializeUserScore(communityId, user.id);
    toast.success('User data initialized');
  } catch (error) {
    toast.error('Failed to initialize user data');
  }
};
```

## 🐛 Common Issues and Solutions

### Issue 1: "User not authenticated" Error

**Symptoms**: Error in console about user not being authenticated

**Solution**:
```tsx
// Ensure user is loaded before rendering leaderboard
if (!user) {
  return <div>Please log in to view the leaderboard</div>;
}

return <CommunityLeaderboard communityId={communityId} />;
```

### Issue 2: Database Tables Missing

**Symptoms**: Errors about tables not existing

**Solution**:
1. Run the migration: `supabase db push`
2. Or manually execute the SQL in Supabase dashboard
3. Check table creation with: `SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'community_%leaderboard%';`

### Issue 3: Mock AI Not Working

**Symptoms**: AI queries return empty or error responses

**Solution**:
The system includes a robust mock implementation that should work without OpenAI. If it's not working:

1. Check browser console for JavaScript errors
2. Verify the `aiLeaderboardService.ts` file is properly imported
3. Test with the HTML test page first

### Issue 4: Query Processing Fails

**Symptoms**: Queries are submitted but no response is received

**Solution**:
1. Check if user has score data: User must be a community member
2. Initialize user score if missing
3. Check database permissions (RLS policies)

## 🧪 Testing the Fix

### Test 1: Basic Functionality
```tsx
// Test in browser console
const testQuery = async () => {
  const response = await leaderboardService.processUserQuery(
    'your-community-id',
    'your-user-id',
    'What is my rank?'
  );
  console.log(response);
};
testQuery();
```

### Test 2: Component Integration
1. Open the leaderboard page
2. Click "Ask AI Assistant"
3. Try these test queries:
   - "What is my rank?"
   - "How can I improve?"
   - "Why is my rank low?"

### Test 3: Error Handling
1. Try querying without being a community member
2. Try querying with invalid data
3. Verify fallback responses are shown

## 📊 System Architecture

The AI leaderboard "ask" function works through this flow:

1. **User Input** → `CommunityLeaderboard.tsx`
2. **Hook Call** → `useLeaderboardQuery.tsx`
3. **Service Call** → `leaderboardService.processUserQuery()`
4. **AI Processing** → `aiLeaderboardService.processLeaderboardQuery()`
5. **Database Storage** → `community_leaderboard_queries` table
6. **Response Display** → Back to component

## 🔍 Debugging Commands

### Check Environment
```javascript
console.log('Environment check:', {
  hasOpenAI: !!import.meta.env.VITE_OPENAI_API_KEY,
  hasSupabase: !!import.meta.env.VITE_SUPABASE_URL
});
```

### Check Authentication
```javascript
import { supabase } from '@/integrations/supabase/client';
const checkAuth = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Auth status:', { user: !!user, id: user?.id });
};
checkAuth();
```

### Check Database Tables
```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'community_%leaderboard%';
```

## 🚀 Expected Behavior After Fix

1. ✅ "Ask AI Assistant" button appears and is clickable
2. ✅ Dialog opens with suggested questions and input field
3. ✅ Questions can be typed and submitted
4. ✅ AI responses appear in the conversation history
5. ✅ Follow-up questions and suggested actions are shown
6. ✅ Responses can be rated with thumbs up/down
7. ✅ Query history persists and is displayed

## 📞 Support

If issues persist after following this guide:

1. Check browser console for detailed error messages
2. Run the diagnostic tool: `<LeaderboardDebugger communityId={communityId} />`
3. Verify all environment variables are correctly set
4. Ensure database migration was applied successfully
5. Test with the HTML test page to isolate the issue

The system is designed with comprehensive fallbacks, so basic functionality should work even with minimal configuration. The mock AI implementation provides realistic responses without requiring an OpenAI API key.
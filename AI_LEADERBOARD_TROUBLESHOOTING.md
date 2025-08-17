# AI Leaderboard System Troubleshooting Guide

## Issue: "AI leaderboard failed to process my question"

Based on a comprehensive analysis of the codebase, here are the most likely causes and solutions for AI leaderboard question processing failures:

## 🔍 Root Cause Analysis

### 1. **Missing or Invalid API Key Configuration**
**Most Likely Issue**: The OpenAI API key is not configured or is invalid.

**Location**: `src/services/aiLeaderboardService.ts:25`
```typescript
this.apiKey = process.env.VITE_OPENAI_API_KEY || '';
```

**Problem**: The AI service expects an OpenAI API key but defaults to an empty string if not found.

### 2. **Database Schema Issues**
**Potential Issue**: Required database tables might not exist or have incorrect structure.

**Required Tables**:
- `community_user_scores`
- `community_user_activities` 
- `community_leaderboard_queries`
- `community_user_feedback`
- `community_leaderboard_settings`

### 3. **User Authentication Issues**
**Location**: `src/hooks/useLeaderboard.ts:180`
```typescript
if (!user) throw new Error('User not authenticated');
```

**Problem**: The query processing requires an authenticated user.

### 4. **Missing User Score Data**
**Location**: `src/services/leaderboardService.ts:343`
```typescript
const userScore = await this.getUserScore(communityId, userId);
```

**Problem**: If the user doesn't have score data, the AI context will be incomplete.

## 🚀 Step-by-Step Solutions

### Solution 1: Configure OpenAI API Key

1. **Add API Key to Environment**:
   ```bash
   # Add to your .env file
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

2. **Alternative: Use Mock Implementation**:
   The system already has a mock implementation that works without an API key. The mock should handle basic queries.

3. **Verify Configuration**:
   ```typescript
   // Check in browser console
   console.log('API Key configured:', !!process.env.VITE_OPENAI_API_KEY);
   ```

### Solution 2: Verify Database Schema

1. **Check if Migration was Applied**:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'community_%leaderboard%';
   ```

2. **Apply Migration if Missing**:
   ```bash
   # From project root
   supabase db push
   ```
   
   Or manually run: `supabase/migrations/20250129000000_add_ai_leaderboard_system.sql`

3. **Initialize User Score Data**:
   ```sql
   -- Create initial score entry for user
   INSERT INTO community_user_scores (community_id, user_id, performance_score, rank)
   VALUES ('your-community-id', 'your-user-id', 0, 999)
   ON CONFLICT (community_id, user_id) DO NOTHING;
   ```

### Solution 3: Fix Authentication Issues

1. **Verify User is Logged In**:
   ```typescript
   // Check in component
   const { user } = useAuth();
   console.log('User authenticated:', !!user);
   ```

2. **Check Supabase Auth Configuration**:
   ```typescript
   // Verify in browser console
   console.log('Supabase user:', supabase.auth.getUser());
   ```

### Solution 4: Initialize Leaderboard Data

1. **Create Default Settings**:
   ```sql
   INSERT INTO community_leaderboard_settings (community_id)
   VALUES ('your-community-id')
   ON CONFLICT (community_id) DO NOTHING;
   ```

2. **Record Some Activities**:
   ```typescript
   // Use the activity tracker to create initial data
   const { recordActivity } = useActivityRecorder(communityId);
   recordActivity('chat_message', {}, 'Test message');
   ```

## 🛠️ Quick Fixes

### Fix 1: Improve Error Handling

Add better error messages to help diagnose issues:

```typescript
// In aiLeaderboardService.ts
async processLeaderboardQuery(request: ProcessLeaderboardQueryRequest): Promise<ProcessLeaderboardQueryResponse> {
  try {
    console.log('Processing query:', request.query);
    console.log('User context:', request.context);
    
    const response = await this.mockProcessQuery(request);
    console.log('AI response generated:', response);
    
    return response;
  } catch (error) {
    console.error('Detailed error in processLeaderboardQuery:', {
      error: error.message,
      request: request.query,
      context: request.context
    });
    return this.getFallbackQueryResponse(request);
  }
}
```

### Fix 2: Add Fallback for Missing Data

```typescript
// In leaderboardService.ts
async processUserQuery(communityId: string, userId: string, query: string): Promise<LeaderboardQuery> {
  try {
    // Get user context with fallbacks
    let userScore = await this.getUserScore(communityId, userId);
    
    // Initialize user score if missing
    if (!userScore) {
      await this.initializeUserScore(communityId, userId);
      userScore = await this.getUserScore(communityId, userId);
    }
    
    const recentActivities = await this.getUserRecentActivities(communityId, userId, 5);
    
    // Continue with processing...
  } catch (error) {
    console.error('Error processing user query:', error);
    
    // Return a helpful error response instead of throwing
    const fallbackQuery = {
      id: crypto.randomUUID(),
      community_id: communityId,
      user_id: userId,
      query_text: query,
      query_intent: 'general_question',
      ai_response: 'Sorry, I encountered an issue processing your question. Please try again or contact support if the problem persists.',
      response_data: {
        error: error.message,
        suggested_actions: ['Try asking a simpler question', 'Check your internet connection', 'Contact support']
      },
      created_at: new Date().toISOString()
    };
    
    return fallbackQuery;
  }
}
```

### Fix 3: Add Component-Level Error Boundary

```typescript
// In CommunityLeaderboard.tsx
const handleAskQuestion = async () => {
  if (!question.trim()) return;
  
  try {
    console.log('Asking question:', question);
    const response = await askQuestion(question);
    console.log('Received response:', response);
    toast.success('Got your answer!');
    setQuestion('');
  } catch (error) {
    console.error('Detailed error asking question:', {
      error: error.message,
      question,
      user: user?.id,
      communityId
    });
    
    // Show more helpful error message
    toast.error(`Failed to process question: ${error.message}. Please try again.`);
  }
};
```

## 🔧 Testing the Fix

### Test 1: Verify API Key
```javascript
// Run in browser console
console.log('OpenAI API Key:', process.env.VITE_OPENAI_API_KEY ? 'Configured' : 'Missing');
```

### Test 2: Check Database Tables
```sql
-- Run in Supabase SQL Editor
SELECT 
  'community_user_scores' as table_name,
  COUNT(*) as record_count
FROM community_user_scores
UNION ALL
SELECT 
  'community_leaderboard_queries' as table_name,
  COUNT(*) as record_count
FROM community_leaderboard_queries;
```

### Test 3: Test Query Processing
```typescript
// Add to component for testing
const testQuery = async () => {
  try {
    const result = await leaderboardService.processUserQuery(
      communityId,
      user.id,
      'Why is my rank low?'
    );
    console.log('Test query result:', result);
  } catch (error) {
    console.error('Test query failed:', error);
  }
};
```

## 📊 Monitoring and Prevention

### Add Logging
```typescript
// Enhanced logging in all leaderboard services
const logActivity = (action: string, data: any) => {
  console.log(`[Leaderboard] ${action}:`, {
    timestamp: new Date().toISOString(),
    ...data
  });
};
```

### Health Check Endpoint
```typescript
// Add to leaderboardService.ts
async healthCheck(communityId: string, userId: string): Promise<{
  database: boolean;
  userScore: boolean;
  apiKey: boolean;
  settings: boolean;
}> {
  return {
    database: await this.checkDatabaseConnection(),
    userScore: !!(await this.getUserScore(communityId, userId)),
    apiKey: !!process.env.VITE_OPENAI_API_KEY,
    settings: !!(await this.getLeaderboardSettings(communityId))
  };
}
```

## 🎯 Most Likely Solution

Based on the analysis, the most likely cause is **missing OpenAI API key configuration**. The system defaults to a mock implementation, but if there are any issues with the mock or the environment setup, queries will fail.

**Immediate Fix**:
1. Add `VITE_OPENAI_API_KEY=sk-your-key-here` to your `.env` file
2. Restart the development server
3. Test the AI query function

**Alternative**: The mock implementation should work without an API key, so if it's still failing, the issue is likely in the database setup or user authentication.

## 📞 Support

If the issue persists after trying these solutions:
1. Check browser console for detailed error messages
2. Verify all environment variables are set
3. Ensure the database migration was applied successfully
4. Test with a simple query like "What is my rank?"

The system is designed with fallbacks, so basic functionality should work even with minimal configuration.
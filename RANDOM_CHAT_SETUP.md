# Random Chat Setup Documentation

This guide provides complete setup instructions for the comprehensive random messaging chat feature implementation.

## Overview

The random chat system includes:
- **Real-time WebRTC video calls** with Socket.IO signaling
- **Persistent messaging** with Supabase database integration
- **Advanced security features** including rate limiting, content filtering, and behavior monitoring
- **Safety dashboard** with user analytics and risk assessment
- **Mobile-responsive UI** with comprehensive error handling

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Signaling       │    │   Database      │
│   (React)       │◄──►│  Server          │    │   (Supabase)    │
│                 │    │  (Socket.IO)     │    │                 │
│ - RandomChat    │    │                  │    │ - Sessions      │
│ - SafetyService │    │ - User Matching  │    │ - Messages      │
│ - RateLimit     │    │ - WebRTC Signal  │    │ - Reports       │
│ - RetryService  │    │ - Room Mgmt      │    │ - User Stats    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- Supabase project with authentication enabled
- Deployed Socket.IO signaling server (see signaling server setup)

## 1. Database Setup

### Step 1: Create Database Schema

Run the following SQL in your Supabase SQL editor:

```sql
-- Apply the comprehensive random chat schema
-- File: create-random-chat-schema.sql
```

Execute the `create-random-chat-schema.sql` file in your Supabase project. This creates:

- `random_chat_sessions` - Session tracking
- `random_chat_messages` - Message persistence  
- `random_chat_reports` - User safety reports
- `random_chat_user_stats` - Behavior analytics
- All necessary RLS policies and functions

### Step 2: Configure Row Level Security

The schema includes comprehensive RLS policies that:
- Ensure users can only access their own sessions and messages
- Allow secure reporting functionality
- Provide proper data isolation

### Step 3: Set Up Storage Buckets (if needed)

For file uploads in chat (future enhancement):

```sql
-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('random-chat-files', 'random-chat-files', false);

-- Create storage policies
CREATE POLICY "Users can upload chat files" ON storage.objects 
FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
```

## 2. Signaling Server Deployment

### Option A: Deploy to Render (Recommended)

1. **Prepare the signaling server:**
   ```bash
   cd socketio-signaling-server
   npm install
   ```

2. **Deploy to Render:**
   - Connect your GitHub repository to Render
   - Create a new Web Service
   - Set build command: `cd socketio-signaling-server && npm install`
   - Set start command: `cd socketio-signaling-server && npm start`
   - Set environment variables (see below)

3. **Environment Variables for Render:**
   ```
   NODE_ENV=production
   PORT=10000
   CLIENT_ORIGIN=https://your-app-domain.com
   ```

### Option B: Deploy to Heroku

1. **From the signaling server directory:**
   ```bash
   cd socketio-signaling-server
   heroku create your-signaling-server
   git init
   git add .
   git commit -m "Deploy signaling server"
   git push heroku main
   ```

2. **Set Heroku environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set CLIENT_ORIGIN=https://your-app-domain.com
   ```

### Option C: Deploy to Railway

1. **Connect GitHub repository to Railway**
2. **Set start command:** `cd socketio-signaling-server && npm start`
3. **Configure environment variables in Railway dashboard**

## 3. Frontend Configuration

### Step 1: Environment Variables

Create or update your `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Signaling Server
VITE_SIGNALING_SERVER_URL=https://your-signaling-server.onrender.com

# Optional: Analytics
VITE_ENABLE_ANALYTICS=true
```

### Step 2: Update Signaling Service Configuration

In `src/services/socketIOSignalingService.ts`, verify the server URL:

```typescript
constructor(userId: string, events: SignalingEvents = {}) {
  this.userId = userId;
  this.events = events;
  this.serverUrl = import.meta.env.VITE_SIGNALING_SERVER_URL || 'https://wuuble.onrender.com';
  
  console.log(`🎯 SocketIOSignalingService initialized for user ${userId}`);
}
```

### Step 3: Configure Rate Limiting

Update rate limits in `src/services/rateLimitService.ts` if needed:

```typescript
private config: RateLimitConfig = {
  messagesPerMinute: 30,          // Adjust based on your needs
  skipAttemptsPerHour: 20,        // Prevent excessive partner skipping
  connectionAttemptsPerHour: 50,  // Connection retry limits
  reportsPerDay: 5,               // User report limits
  maxSessionDurationMinutes: 60,  // Maximum session length
  sessionCooldownMinutes: 2       // Cooldown between sessions
};
```

### Step 4: Customize Content Filtering

Update content filters in `src/services/safetyService.ts`:

```typescript
private initializeContentFilters(): void {
  this.contentFilters = [
    // Add your custom content filters
    {
      pattern: /your-pattern/gi,
      severity: 'high',
      category: 'inappropriate',
      action: 'end_session'
    },
    // ... existing filters
  ];
}
```

## 4. Build and Deployment

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Build the Application

```bash
npm run build
```

### Step 3: Deploy Frontend

#### Vercel Deployment:
```bash
npm install -g vercel
vercel --prod
```

#### Netlify Deployment:
```bash
npm run build
# Upload dist/ folder to Netlify or use Netlify CLI
```

## 5. Testing the Implementation

### Step 1: Verify Database Connection

Check that your app can connect to Supabase:
1. Open browser developer tools
2. Navigate to `/random-chat`
3. Look for successful database queries in the Network tab

### Step 2: Test Signaling Server

Verify the signaling server is running:
1. Visit your signaling server URL directly
2. Should show server status page
3. Check WebSocket connection in browser dev tools

### Step 3: Test Random Chat Flow

Complete end-to-end test:
1. **Authentication:** Sign in with a test user
2. **Connection:** Click "Start Chat" and verify connection status
3. **Matching:** Test with two browser windows/users
4. **Messaging:** Send messages and verify persistence
5. **Video:** Test video/audio controls
6. **Safety:** Test reporting functionality
7. **Rate Limits:** Test message rate limiting

### Step 4: Monitor Safety Features

Check the safety dashboard:
1. Navigate to safety dashboard from random chat
2. Verify user statistics are tracked
3. Test content filtering by sending filtered messages
4. Check rate limiting by exceeding limits

## 6. Production Considerations

### Security

1. **Environment Variables:** Never commit sensitive keys
2. **CORS Configuration:** Restrict origins in production
3. **Rate Limiting:** Monitor and adjust limits based on usage
4. **Content Filtering:** Regularly update filter patterns
5. **User Reports:** Set up admin review process

### Performance

1. **Database Indexes:** Ensure proper indexes on frequent queries
2. **Connection Pooling:** Configure Supabase connection limits  
3. **CDN:** Use CDN for static assets
4. **Monitoring:** Set up error tracking (Sentry, LogRocket)

### Scalability

1. **Signaling Server:** Use multiple server instances with load balancing
2. **Database:** Monitor connection usage and scale as needed
3. **Cleanup Jobs:** Set up automated cleanup for old sessions
4. **Caching:** Implement Redis for session state if needed

## 7. Maintenance

### Daily Tasks

1. **Monitor Error Logs:** Check for recurring issues
2. **Review Safety Reports:** Process user reports
3. **Check Rate Limits:** Adjust if users are being blocked excessively

### Weekly Tasks

1. **Database Cleanup:** Run cleanup functions for old data
2. **Security Review:** Check for new safety alerts
3. **Performance Monitoring:** Review response times and connection quality

### Monthly Tasks

1. **Update Dependencies:** Keep packages up to date
2. **Content Filter Review:** Update filtering patterns
3. **Feature Usage Analysis:** Review which features are used most

## 8. Troubleshooting

### Common Issues

**Connection Failed:**
- Check signaling server is running and accessible
- Verify CORS configuration
- Check network connectivity

**Messages Not Persisting:**
- Verify Supabase connection
- Check RLS policies are correct
- Ensure user is authenticated

**Rate Limiting Too Strict:**
- Review rate limit configuration
- Check if limits need adjustment for your user base
- Monitor user feedback

**Safety Features Not Working:**
- Verify database schema is applied
- Check content filters are loading
- Ensure safety service is initialized

### Debug Mode

Enable debug logging by setting:
```env
VITE_DEBUG_MODE=true
```

This will provide detailed console logging for all services.

## 9. API Reference

### RandomChatService Methods

```typescript
// Create new session
await randomChatService.createSession(roomId, user1Id, user2Id);

// Send message
await randomChatService.sendMessage(sessionId, senderId, content);

// Report user
await randomChatService.reportUser(userId, reason, description);

// Get user stats
const stats = await randomChatService.getUserStats(userId);
```

### SafetyService Methods

```typescript
// Check if user can start session
const eligibility = await safetyService.canUserStartSession(userId);

// Filter message content
const filtered = safetyService.filterMessage(message, userId);

// Get risk assessment
const risk = safetyService.getUserRiskAssessment(userId);
```

### RateLimitService Methods

```typescript
// Check message limit
const canSend = rateLimitService.canSendMessage(userId);

// Record action
rateLimitService.recordMessage(userId);

// Get user status
const status = rateLimitService.getUserStatus(userId);
```

## 10. Support

For implementation support:
1. Check the comprehensive troubleshooting section above
2. Review the console logs with debug mode enabled
3. Verify all environment variables are correctly set
4. Test each component individually (database, signaling, frontend)

## Security Notice

This implementation includes comprehensive security features, but always:
- Regularly update dependencies
- Monitor user reports and take action
- Review and update content filters
- Keep rate limits reasonable for your user base
- Implement proper user verification if needed

The system is designed to be production-ready with proper monitoring and maintenance.
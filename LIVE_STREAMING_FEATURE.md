# Live Streaming Feature Documentation

## Overview

The live streaming feature enables community members to create, broadcast, and watch live video streams within their communities. This feature is integrated into the community Quick Access section and provides a comprehensive streaming experience with real-time chat, viewer tracking, and stream management.

## 🚀 Features

### Core Functionality
- **Stream Creation**: Create live streams with titles, descriptions, and scheduling options
- **Live Broadcasting**: Stream video and audio using browser MediaDevices API
- **Stream Viewing**: Watch live streams with real-time viewer count updates
- **Live Chat**: Interactive chat during streams with real-time messaging
- **Stream Scheduling**: Schedule streams for future broadcast
- **Viewer Management**: Track active viewers and manage stream capacity

### User Interface
- **Stream Controls**: Toggle video, audio, and screen sharing during broadcast
- **Stream Discovery**: Browse active and upcoming streams in the community
- **Stream Viewer**: Full-screen stream viewing experience with integrated chat
- **Stream Management**: Start, stop, and manage streams with intuitive controls

### Real-time Features
- **Live Chat Updates**: Real-time chat messages using Supabase subscriptions
- **Viewer Count**: Automatic viewer count updates
- **Stream Status**: Real-time stream status updates (live, scheduled, ended)
- **Notifications**: Stream start notifications (ready for implementation)

## 📁 File Structure

```
src/
├── components/
│   ├── LiveStreamFeature.tsx      # Main live streaming component
│   └── QuickAccess.tsx            # Updated to include live streaming
├── Database Schema:
│   ├── live_streams_schema.sql    # Complete database schema
│   └── setup-live-streams.js      # Setup script
└── Documentation:
    └── LIVE_STREAMING_FEATURE.md  # This file
```

## 🗄️ Database Schema

### Tables Created

#### `live_streams`
Main table storing stream information:
- `id` - Unique stream identifier
- `community_id` - Associated community
- `creator_id` - Stream creator
- `title` - Stream title
- `description` - Optional description
- `status` - Stream status (scheduled, live, ended, cancelled)
- `scheduled_start_time` - When stream is scheduled to start
- `actual_start_time` - When stream actually started
- `end_time` - When stream ended
- `viewer_count` - Current number of viewers
- `max_viewers` - Maximum allowed viewers
- `metadata` - Additional stream data (JSON)

#### `stream_viewers`
Tracks active stream viewers:
- `stream_id` - Reference to live stream
- `user_id` - Viewer user ID
- `joined_at` - When viewer joined
- `left_at` - When viewer left
- `is_active` - Whether viewer is currently active

#### `stream_chat`
Stores live chat messages:
- `stream_id` - Reference to live stream
- `user_id` - Message sender
- `message` - Chat message content
- `message_type` - Type of message (text, emoji, system)
- `reply_to_id` - Reference to replied message

#### `stream_reactions`
Live reactions during streams:
- `stream_id` - Reference to live stream
- `user_id` - User who reacted
- `reaction_type` - Type of reaction (like, love, wow, etc.)

## 🔐 Security & Permissions

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:

- **Stream Access**: Users can only view streams in communities they're members of
- **Stream Creation**: Only community members can create streams
- **Stream Management**: Only stream creators can update/delete their streams
- **Chat Participation**: Only community members can participate in stream chat
- **Viewer Tracking**: Automatic viewer management with proper permissions

### Privacy Controls
- Private communities maintain privacy for their streams
- Stream creators have full control over their streams
- Moderators can manage chat (ready for implementation)

## 🎮 Usage Guide

### For Community Members

#### Viewing Streams
1. Navigate to a community's Quick Access tab
2. Browse "Live Now" section for active streams
3. Click "Watch Stream" to join a live stream
4. Participate in live chat during the stream

#### Creating Streams
1. Go to community Quick Access tab
2. Click "Start Live Stream" button
3. Fill in stream details (title, description, schedule)
4. Click "Start Stream" or "Schedule Stream"
5. Grant camera/microphone permissions when prompted
6. Use stream controls to manage video, audio, and screen sharing

### For Developers

#### Integration Points
```typescript
// Import the component
import { LiveStreamFeature } from '@/components/LiveStreamFeature';

// Use in community pages
<LiveStreamFeature 
  communityId={communityId}
  communityName={communityName}
  isMember={isMember}
  isCreator={isCreator}
/>
```

#### Database Setup
```bash
# Run the setup script
node setup-live-streams.js
```

#### Custom Streaming Integration
The current implementation uses browser MediaDevices API for basic streaming. For production use, integrate with:

- **Agora.io**: WebRTC streaming platform
- **AWS IVS**: Interactive Video Service
- **Twilio Video**: Video communication platform
- **YouTube Live API**: YouTube live streaming

## 🔧 Technical Implementation

### Key Components

#### LiveStreamFeature Component
- **Props**: `communityId`, `communityName`, `isMember`, `isCreator`
- **State Management**: Handles streams, chat, viewer data
- **Real-time Updates**: Uses Supabase subscriptions for live updates
- **Media Handling**: Browser MediaDevices API for camera/microphone

#### Database Triggers
- **Viewer Count Updates**: Automatic updates when viewers join/leave
- **Timestamp Management**: Automatic updated_at timestamps
- **Data Integrity**: Foreign key constraints and proper indexing

#### Real-time Subscriptions
```typescript
// Example chat subscription
const channel = supabase
  .channel(`stream_chat_${streamId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'stream_chat',
    filter: `stream_id=eq.${streamId}`
  }, handleNewMessage)
  .subscribe();
```

### Performance Optimizations
- **Indexes**: Proper database indexing for fast queries
- **Pagination**: Chat message limits to prevent memory issues
- **Polling**: Efficient polling intervals for stream updates
- **Cleanup**: Automatic cleanup of ended streams and inactive viewers

## 🚀 Setup Instructions

### 1. Database Setup
```bash
# Run the setup script to create tables and policies
node setup-live-streams.js
```

### 2. Environment Variables
Ensure you have the required Supabase environment variables:
```env
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Component Integration
The LiveStreamFeature component is already integrated into the QuickAccess component and will appear after the video chat section in community pages.

### 4. Permissions
Ensure users have camera and microphone permissions for streaming. The component will request these permissions when starting a stream.

## 🔮 Future Enhancements

### Planned Features
- **Stream Recording**: Save streams for later viewing
- **Stream Analytics**: Viewer statistics and engagement metrics
- **Advanced Moderation**: Chat moderation tools and controls
- **Stream Notifications**: Push notifications when streams start
- **Stream Categories**: Organize streams by topics or categories
- **Multi-streaming**: Stream to multiple platforms simultaneously

### Integration Opportunities
- **Calendar Integration**: Sync scheduled streams with community events
- **Subscription Tiers**: Premium streaming features for subscribers
- **Mobile App**: Native mobile streaming support
- **External Platforms**: Integration with YouTube, Twitch, etc.

## 🐛 Troubleshooting

### Common Issues

#### Stream Won't Start
- Check camera/microphone permissions
- Ensure user is a community member
- Verify database connection

#### Chat Not Working
- Check real-time subscription setup
- Verify user permissions for the community
- Ensure proper database policies

#### Viewer Count Issues
- Check database triggers are properly installed
- Verify stream_viewers table updates
- Ensure proper cleanup of inactive viewers

### Debug Tools
```typescript
// Enable debug logging
console.log('Stream data:', streamData);
console.log('User permissions:', { isMember, isCreator });
console.log('Chat messages:', chatMessages);
```

## 📞 Support

For issues or questions about the live streaming feature:
1. Check the troubleshooting section above
2. Review the database schema and policies
3. Verify component integration and props
4. Test with proper user permissions and community membership

## 🎉 Conclusion

The live streaming feature provides a comprehensive solution for community-based live streaming with real-time interaction. It's built with scalability, security, and user experience in mind, ready for both development and production use.

The implementation uses modern web technologies and follows best practices for real-time applications, making it a solid foundation for community engagement and content creation.
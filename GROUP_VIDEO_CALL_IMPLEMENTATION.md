# Group Video Call Feature Implementation

## Overview

This document outlines the complete implementation of the group video call feature for communities. The feature allows community members to start and join group video calls with up to 50 participants, including screen sharing, chat, and participant management capabilities.

## Architecture

### WebRTC Mesh Network
- Uses a mesh network topology where each participant connects directly to every other participant
- Scales well for small to medium groups (up to ~10 participants)
- For larger groups, consider implementing an SFU (Selective Forwarding Unit) architecture

### Core Components

1. **GroupWebRTCService** (`src/services/groupWebRTCService.ts`)
   - Manages multiple peer connections for group calls
   - Handles screen sharing with track replacement
   - Provides participant management and media controls
   - Supports data channels for chat messages

2. **GroupSignalingService** (`src/services/groupSignalingService.ts`)
   - Extends the base signaling service for group communication
   - Handles room management and participant coordination
   - Includes mock implementation for development/testing
   - Manages WebRTC offer/answer/ICE candidate exchange

3. **useGroupVideoChat Hook** (`src/hooks/useGroupVideoChat.tsx`)
   - React hook for managing group call state
   - Integrates with Supabase for call persistence
   - Handles participant management and database updates
   - Provides comprehensive call lifecycle management

4. **GroupVideoChat Component** (`src/components/GroupVideoChat.tsx`)
   - Responsive grid layout for multiple participants
   - Adaptive grid sizing based on participant count
   - Rich participant information overlays
   - Integrated chat, invite sharing, and controls

## Database Schema

### Tables Created

1. **community_group_calls**
   - Tracks group video call sessions
   - Stores call metadata (title, description, participant limits)
   - Manages call status and recording information

2. **community_group_call_participants**
   - Tracks participants in group calls
   - Stores participant roles (host, moderator, participant)
   - Records join/leave times and media states

3. **community_group_call_events**
   - Logs call events for analytics and debugging
   - Tracks user actions (join, leave, mute, screen share)
   - Stores event metadata in JSONB format

### Key Features

- **Row Level Security (RLS)** policies for data protection
- **Automatic participant counting** with database triggers
- **Inactive call cleanup** function for maintenance
- **Comprehensive indexing** for performance

## Features Implemented

### Core Video Call Features
- ✅ Multi-participant video calling (up to 50 participants)
- ✅ Adaptive grid layout (1x1 to 4x4 grid based on participant count)
- ✅ Audio/video toggle controls
- ✅ Screen sharing with automatic track replacement
- ✅ Real-time participant management
- ✅ Connection quality indicators

### Chat & Communication
- ✅ In-call text chat with unread message indicators
- ✅ Data channel messaging between participants
- ✅ Participant join/leave notifications
- ✅ Real-time participant status updates

### Participant Management
- ✅ Role-based permissions (host, moderator, participant)
- ✅ Participant muting (for hosts/moderators)
- ✅ Participant removal capabilities
- ✅ Role promotion system
- ✅ Visual participant information overlays

### User Experience
- ✅ Pre-call setup screen with camera/microphone testing
- ✅ Invite link generation and sharing
- ✅ Responsive design for various screen sizes
- ✅ Hover effects and interactive participant cards
- ✅ Focus mode for highlighting specific participants

### Integration
- ✅ Integrated into community detail pages
- ✅ Database persistence for call history
- ✅ Authentication and authorization
- ✅ Community membership validation
- ✅ Routing and navigation setup

## File Structure

```
src/
├── services/
│   ├── groupWebRTCService.ts          # Multi-peer WebRTC management
│   └── groupSignalingService.ts       # Group signaling coordination
├── hooks/
│   └── useGroupVideoChat.tsx          # React hook for group calls
├── components/
│   └── GroupVideoChat.tsx             # Main group call UI component
├── pages/
│   └── CommunityGroupCall.tsx         # Group call page wrapper
└── integrations/supabase/
    └── types.ts                       # Updated with new table types
```

## Usage

### Starting a Group Call

1. Navigate to a community detail page
2. Click "Start Group Call" in the Quick Actions section
3. Allow camera/microphone permissions
4. The call is created in the database and signaling begins
5. Share the invite link with other community members

### Joining a Group Call

1. Click an invite link or navigate to an active call
2. Allow camera/microphone permissions
3. Automatically connect to existing participants
4. Participate in video, audio, and chat

### During a Call

- **Toggle Audio/Video**: Use bottom control bar buttons
- **Screen Share**: Click monitor icon to share screen
- **Chat**: Click chat icon to open/close text chat
- **Invite Others**: Click invite button to get shareable link
- **Manage Participants**: Hosts can mute, kick, or promote participants
- **End Call**: Red phone button to leave (hosts can end for all)

## Technical Considerations

### Scalability
- Current mesh architecture works well up to ~10 participants
- For larger groups, consider implementing SFU architecture
- Monitor CPU and bandwidth usage with many participants

### Browser Compatibility
- Requires modern browsers with WebRTC support
- Screen sharing requires additional permissions
- Mobile browsers may have limitations

### Network Requirements
- Stable internet connection required
- Bandwidth scales with number of participants
- Consider network quality indicators

### Security
- All communications encrypted via WebRTC
- Database access controlled by RLS policies
- Community membership required for participation

## Future Enhancements

### Potential Improvements
1. **SFU Architecture**: For better scalability with large groups
2. **Recording**: Server-side call recording capabilities
3. **Breakout Rooms**: Smaller sub-groups within main call
4. **Waiting Room**: Host approval before joining
5. **Calendar Integration**: Schedule group calls in advance
6. **Mobile App**: Native mobile application support
7. **Analytics**: Call quality and usage analytics
8. **Moderation Tools**: Advanced participant management

### Performance Optimizations
1. **Adaptive Bitrate**: Adjust quality based on network conditions
2. **Simulcast**: Send multiple quality streams
3. **Background Blur**: Virtual background effects
4. **Noise Suppression**: Enhanced audio processing

## Deployment Notes

1. **Database Migration**: Run `group_video_calls_schema.sql` on production database
2. **Environment Variables**: Configure signaling server URL if not using mock
3. **HTTPS Required**: WebRTC requires secure context
4. **STUN/TURN Servers**: Configure for NAT traversal in production
5. **Resource Monitoring**: Monitor server resources with increased usage

## Testing

The implementation includes comprehensive mock services for development:
- Mock signaling service simulates real-time communication
- Local testing without external dependencies
- Realistic participant joining/leaving simulation

For production testing:
- Test with multiple browser tabs/windows
- Verify cross-browser compatibility
- Test network failure scenarios
- Validate database operations and cleanup

## Support & Troubleshooting

### Common Issues
1. **Camera/Microphone Access**: Ensure HTTPS and permissions granted
2. **Connection Issues**: Check firewall and NAT configuration
3. **Audio Echo**: Ensure proper audio device selection
4. **Performance**: Monitor CPU usage with many participants

### Debug Information
- Browser developer tools show WebRTC statistics
- Database logs track call events and participants
- Console logs provide detailed connection information

This implementation provides a solid foundation for group video calling in communities with room for future enhancements and scaling.
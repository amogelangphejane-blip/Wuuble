# 🎥 Tango-like Live Streaming Platform

A comprehensive live streaming platform with modern features inspired by Tango, including virtual gifts, beauty filters, real-time analytics, and social engagement tools.

## ✨ Features Overview

### 🎯 Core Features
- **Full-screen Live Streaming** - Immersive streaming experience with professional controls
- **Virtual Gifts & Monetization** - 8 different virtual gifts with rarity system (common, rare, epic, legendary)
- **Beauty Filters & AR Effects** - Real-time beauty enhancement with customizable intensity
- **Stream Analytics Dashboard** - Comprehensive performance tracking and insights
- **Follower System** - Follow favorite streamers with notifications
- **Stream Discovery** - Browse streams by category, trending, and recommendations
- **Interactive Chat** - Real-time messaging with VIP badges and user levels
- **Stream Categories** - Organized content discovery (Gaming, Music, Art, etc.)

### 💎 Advanced Features
- **User Coin System** - Virtual currency for purchasing gifts and premium features
- **Stream Moderation** - Advanced moderation tools for streamers
- **User Levels & VIP System** - Gamified engagement with experience points
- **Real-time Analytics** - Live tracking of viewers, engagement, and revenue
- **Beauty Filter Preferences** - Personalized filter settings saved per user
- **Stream Notifications** - Push notifications for followed streamers going live

## 🚀 Getting Started

### 1. Database Setup

Run the setup script to create all necessary database tables and functions:

```bash
node setup-tango-live-streaming.cjs
```

This will create:
- Virtual gifts system tables
- User coins and transactions
- Stream analytics tracking
- Following system
- Beauty filters and preferences
- Notification system
- User levels and VIP system

### 2. Access the Platform

Navigate to `/live` in your application to access the live streaming platform.

### 3. Navigation Structure

- **Discover** - Browse all live streams with search and category filters
- **Following** - View streams from followed creators
- **Trending** - See the most popular and trending streams
- **Analytics** - Comprehensive dashboard for streamers (shows performance metrics)

## 🎮 User Guide

### For Viewers

#### Discovering Streams
1. Visit `/live` to see all available streams
2. Use the search bar to find specific streamers or content
3. Filter by categories: Gaming, Music, Art, Just Chatting, etc.
4. Click on any stream thumbnail to enter full-screen viewing mode

#### Interacting with Streams
- **Chat**: Send messages in real-time chat
- **Virtual Gifts**: Click the gift button to send virtual gifts to streamers
- **Reactions**: Use emoji reactions that float across the screen
- **Following**: Follow streamers to get notifications when they go live

#### Virtual Gifts System
- Start with 1000 coins (can be purchased or earned)
- Gift options range from 1 coin (Rose 🌹) to 100 coins (Diamond 💎)
- Gifts appear in chat with special animations
- Support your favorite streamers with tips

### For Streamers

#### Starting a Stream
1. Click "Go Live" button on the main page
2. Set up your stream:
   - **Title**: Catchy stream title
   - **Description**: What viewers can expect
   - **Category**: Choose appropriate content category
   - **Beauty Mode**: Enable real-time beauty filters

#### Stream Controls
- **Camera/Mic Toggle**: Turn video/audio on/off
- **Beauty Filters**: Apply and adjust real-time filters
- **Filter Intensity**: Customize filter strength (0-100%)
- **Screen Sharing**: Share your screen (future feature)

#### Beauty Filters Available
- **Smooth Skin**: Skin smoothing effect
- **Brighten**: Face brightening
- **Slim Face**: Face slimming (premium)
- **Vintage**: Retro photo filter
- **Warm/Cool**: Color temperature filters
- **Dramatic**: High contrast filter (premium)

#### Analytics Dashboard
Access comprehensive analytics including:
- **Viewer Metrics**: Total viewers, peak viewers, viewer trends
- **Revenue Tracking**: Earnings from virtual gifts
- **Engagement Stats**: Chat messages, reactions, interaction rates
- **Stream Performance**: Duration, average watch time, retention
- **Top Performing Streams**: Historical performance comparison

## 🛠️ Technical Implementation

### Database Schema

The platform uses several key tables:

#### Virtual Gifts System
```sql
virtual_gifts          -- Available gifts with pricing and rarity
user_coins            -- User currency balances
gift_transactions     -- Record of all gift purchases
```

#### Analytics System
```sql
stream_analytics      -- Detailed metrics tracking
stream_viewers        -- Viewer join/leave tracking
user_levels          -- User experience and VIP status
```

#### Social Features
```sql
streamer_follows     -- Following relationships
stream_notifications -- Notification system
stream_moderators    -- Moderation permissions
```

### Key Components

#### `/src/pages/LiveStreaming.tsx`
- Main streaming platform page
- Handles stream discovery, viewing, and interaction
- Integrates all streaming features

#### `/src/components/StreamAnalyticsDashboard.tsx`
- Comprehensive analytics dashboard
- Charts and metrics visualization
- Performance tracking for streamers

#### `/src/components/LiveStreamFeature.tsx`
- Enhanced existing component with Tango features
- Community-based streaming integration

### API Functions

The platform includes several PostgreSQL functions:

```sql
get_user_coins(user_uuid)           -- Get user's coin balance
update_user_coins(user_uuid, amount, operation) -- Update coins (earn/spend)
get_follower_count(streamer_uuid)   -- Get streamer's follower count
is_following_streamer(follower_uuid, streamer_uuid) -- Check following status
```

## 🎨 Design Features

### Modern UI/UX
- **Gradient Backgrounds**: Purple-to-blue gradients for modern look
- **Glass Morphism**: Backdrop blur effects for depth
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Theme**: Professional dark interface
- **Smooth Animations**: Floating reactions and transitions

### Interactive Elements
- **Live Reactions**: Emoji reactions float across the screen
- **Real-time Chat**: Instant messaging with user badges
- **Gift Animations**: Special effects for virtual gifts
- **Filter Previews**: Real-time beauty filter application

## 💰 Monetization Features

### Virtual Gifts Economy
- **8 Gift Types**: Rose, Heart, Fire, Crown, Diamond, Rocket, Trophy, Star
- **Rarity System**: Common (1-5 coins), Rare (10-25), Epic (50-75), Legendary (100)
- **Revenue Sharing**: Streamers earn from received gifts
- **Coin Purchases**: Users can buy more coins for gifting

### Premium Features
- **VIP Badges**: Special status for supporters
- **Premium Filters**: Advanced beauty filters for subscribers
- **Priority Chat**: VIP messages highlighted
- **Exclusive Access**: Early access to new features

## 🔧 Configuration

### Environment Variables
Ensure these are set in your `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Default Settings
- **Initial Coins**: 1000 coins per new user
- **Max Viewers**: 1000-5000 per stream (configurable)
- **Filter Intensity**: 50% default for beauty filters
- **Stream Categories**: 6 predefined categories

## 📱 Mobile Optimization

The platform is fully responsive and includes:
- **Touch-friendly Controls**: Large buttons and gestures
- **Mobile Chat**: Optimized chat interface
- **Swipe Navigation**: Easy category switching
- **Portrait Mode**: Optimized for mobile viewing

## 🔒 Security & Privacy

### Row Level Security (RLS)
All tables have appropriate RLS policies:
- Users can only see their own coins and preferences
- Stream analytics only visible to stream creators
- Gift transactions are public for transparency
- Notifications are private to each user

### Content Moderation
- **Stream Moderators**: Assign moderators to streams
- **Chat Filtering**: Automatic content filtering
- **Report System**: Users can report inappropriate content
- **Blocking**: Users can block other users

## 🚀 Future Enhancements

### Planned Features
- **AR Filters**: Advanced augmented reality effects
- **Multi-streaming**: Stream to multiple platforms
- **Stream Recording**: Save streams for later viewing
- **Subscription Tiers**: Monthly subscriber benefits
- **Live Shopping**: Sell products during streams
- **Collaboration Streams**: Multi-host streaming
- **Stream Scheduling**: Advanced scheduling system
- **Mobile App**: Native iOS/Android apps

### Technical Improvements
- **WebRTC Integration**: Direct peer-to-peer streaming
- **CDN Integration**: Global content delivery
- **Load Balancing**: Handle thousands of concurrent streams
- **Real-time Sync**: Better synchronization across viewers
- **Bandwidth Optimization**: Adaptive streaming quality

## 📊 Analytics Metrics

### Viewer Metrics
- Total unique viewers
- Peak concurrent viewers
- Average watch time
- Viewer retention rate
- Geographic distribution

### Engagement Metrics
- Chat messages per minute
- Reaction frequency
- Gift conversion rate
- Follower growth rate
- Share and invite rates

### Revenue Metrics
- Total earnings from gifts
- Average revenue per viewer
- Top gift types
- Revenue trends over time
- Conversion funnel analysis

## 🎯 Best Practices

### For Streamers
1. **Consistent Schedule**: Stream at regular times
2. **Engaging Content**: Interact with chat frequently
3. **Quality Setup**: Good lighting and audio
4. **Community Building**: Respond to gifts and messages
5. **Analytics Review**: Check performance regularly

### For Developers
1. **Performance Monitoring**: Track stream quality and latency
2. **User Feedback**: Collect and implement user suggestions
3. **A/B Testing**: Test new features with subsets of users
4. **Security Updates**: Keep all dependencies updated
5. **Backup Strategy**: Regular database backups

## 🆘 Troubleshooting

### Common Issues

#### Camera/Microphone Access
- Ensure HTTPS is enabled (required for camera access)
- Check browser permissions
- Test camera in browser settings

#### Stream Quality Issues
- Check internet connection speed
- Reduce video quality if needed
- Close other bandwidth-intensive applications

#### Gift Transaction Failures
- Verify sufficient coin balance
- Check network connectivity
- Ensure user authentication is valid

#### Analytics Not Loading
- Verify user permissions
- Check if user has created any streams
- Refresh the page and clear cache

## 📞 Support

For technical support or feature requests:
1. Check the troubleshooting section above
2. Review the database logs for errors
3. Test with different browsers and devices
4. Check network connectivity and permissions

---

**🎉 Congratulations!** You now have a fully-featured Tango-like live streaming platform with modern features, monetization, and analytics. Start streaming and building your community today!
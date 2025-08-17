# Video Chat Troubleshooting Guide

## 🎯 Quick Diagnosis

If the random video chat is not working, follow these steps to identify the issue:

### 1. **Check Browser Console** 
Open Developer Tools (F12) and look for errors in the Console tab:
- Red errors indicate critical issues
- Yellow warnings may indicate potential problems
- Look for messages starting with emojis (🚀, ❌, ✅) from our logging system

### 2. **Test Basic Functionality**
Use the debug tool: Open `debug-video-chat.html` in your browser to test:
- Camera and microphone access
- WebRTC peer connection creation
- Media stream handling

### 3. **Common Issues & Solutions**

## 🚨 Critical Issues

### Issue: Camera Access Denied
**Symptoms:** 
- Red camera icon in browser address bar
- Error: "NotAllowedError" or "PermissionDeniedError"

**Solutions:**
1. Click the camera icon in browser address bar → Allow
2. Go to browser settings → Privacy & Security → Site Settings → Camera → Allow
3. Check if another application is using the camera
4. Try refreshing the page after allowing permissions

### Issue: No Camera/Microphone Found  
**Symptoms:**
- Error: "NotFoundError" or "DevicesNotFoundError"

**Solutions:**
1. Connect a camera and microphone to your device
2. Check device manager (Windows) or System Preferences (Mac)
3. Try a different browser
4. Restart the browser

### Issue: Camera In Use
**Symptoms:**
- Error: "NotReadableError" or "TrackStartError"

**Solutions:**
1. Close other applications that might be using the camera (Zoom, Skype, etc.)
2. Close other browser tabs that might be accessing the camera
3. Restart the browser
4. Restart the computer if necessary

## 🔗 Connection Issues

### Issue: Peer Connection Fails
**Symptoms:**
- Stuck on "Finding your next match..." 
- Connection status shows "connecting" indefinitely
- ICE connection state shows "failed"

**Solutions:**
1. **Check STUN/TURN Servers:**
   ```javascript
   // Current configuration in webRTCService.ts
   iceServers: [
     { urls: 'stun:stun.l.google.com:19302' },
     { urls: 'stun:stun1.l.google.com:19302' },
     { urls: 'stun:stun2.l.google.com:19302' }
   ]
   ```
2. **Network Issues:**
   - Check if you're behind a corporate firewall
   - Try a different network connection
   - Use mobile hotspot to test

3. **Browser Issues:**
   - Clear browser cache and cookies
   - Disable browser extensions temporarily
   - Try incognito/private mode

### Issue: Signaling Problems
**Symptoms:**
- Console shows "Signaling server error"
- WebSocket connection fails
- Users can't find each other

**Solutions:**
1. **Mock Signaling (Default):** Should work offline
2. **Real Signaling:** Check WebSocket server status
3. **Firewall:** Ensure WebSocket connections are allowed

## 🎥 Video Stream Issues

### Issue: Black Video Screen
**Symptoms:**
- Camera permission granted but video shows black
- Audio works but no video

**Solutions:**
1. **Check Video Track:**
   ```javascript
   const videoTrack = localStream.getVideoTracks()[0];
   console.log('Video track enabled:', videoTrack.enabled);
   ```

2. **Video Constraints:**
   - Try lower resolution settings
   - Disable advanced video features temporarily

3. **Hardware Issues:**
   - Test camera in other applications
   - Check camera drivers

### Issue: Video Filter Problems
**Symptoms:**
- Video works without filters but fails with filters enabled
- Performance issues when filters are on

**Solutions:**
1. **Disable Video Filters:**
   ```javascript
   // In VideoChat component
   const { ... } = useVideoChat({ 
     webRTCConfig: { 
       ...defaultWebRTCConfig, 
       enableVideoFilters: false 
     } 
   });
   ```

2. **Performance Issues:**
   - Reduce video resolution
   - Lower frame rate
   - Check CPU usage

## 🔧 Technical Debugging

### Enable Verbose Logging
The updated code includes extensive logging. Look for these patterns in console:

```
🚀 Initializing video chat services...
📹 Local stream received
🌐 Connecting to signaling server...
✅ Signaling server connected
🎉 All services initialized successfully
```

### Debug Steps
1. **Open Browser Console** (F12 → Console)
2. **Start Video Chat** (`/chat` route)
3. **Look for Error Messages** (❌ prefix)
4. **Check Network Tab** for failed requests
5. **Monitor WebRTC Internals** (chrome://webrtc-internals/)

### Manual Testing
Use the debug HTML file:
```bash
# Open in browser
open debug-video-chat.html
# or
python -m http.server 8000
# then go to http://localhost:8000/debug-video-chat.html
```

## 📱 Mobile-Specific Issues

### iOS Safari Issues
**Common Problems:**
- Video autoplay restrictions
- WebRTC limitations in older versions

**Solutions:**
1. Ensure iOS 14.3+ for full WebRTC support
2. Add `playsinline` attribute to video elements (already included)
3. User gesture required for camera access

### Android Chrome Issues  
**Common Problems:**
- Performance issues on older devices
- Camera orientation problems

**Solutions:**
1. Test on Chrome 90+
2. Reduce video quality on mobile
3. Check device hardware capabilities

## 🛠️ Development Fixes Applied

### Recent Improvements Made:
1. **Enhanced Error Handling:** Better camera permission error messages
2. **ICE Candidate Handling:** Fixed missing ICE candidate exchange
3. **Connection State Monitoring:** Added ICE connection state tracking
4. **Initialization Guard:** Prevent duplicate service initialization
5. **Comprehensive Logging:** Added emoji-prefixed debug messages
6. **Mock Signaling Improvements:** Better partner matching simulation

### Code Changes:
- **useVideoChat.tsx:** Enhanced error handling and logging
- **webRTCService.ts:** Fixed ICE candidate handling and connection monitoring
- **signalingService.ts:** Added logging for ICE candidate transmission

## 🎯 Testing Checklist

Before reporting issues, verify:
- [ ] Camera permission granted in browser
- [ ] No other applications using camera
- [ ] Browser supports WebRTC (Chrome 90+, Firefox 88+, Safari 14+)
- [ ] Network connection stable
- [ ] JavaScript enabled
- [ ] No browser extensions blocking media access
- [ ] Tried in incognito/private mode
- [ ] Tested with debug tool (`debug-video-chat.html`)

## 📞 Emergency Fixes

### Quick Reset:
1. **Clear Browser Data:**
   - Settings → Privacy → Clear Browsing Data
   - Include cookies, cache, and site data

2. **Reset Camera Permissions:**
   - Settings → Privacy → Site Settings → Camera
   - Remove site permissions and re-allow

3. **Try Different Browser:**
   - Chrome (recommended)
   - Firefox
   - Safari (on Mac)

### Code-Level Fixes:
If you're a developer, try these quick fixes:

1. **Disable Video Filters Temporarily:**
   ```javascript
   // In VideoChat.tsx, line 92
   const { ... } = useVideoChat({ 
     useMockSignaling: true,
     webRTCConfig: { 
       ...defaultWebRTCConfig, 
       enableVideoFilters: false 
     } 
   });
   ```

2. **Force Camera Re-initialization:**
   ```javascript
   // Add to startChat function
   if (webRTCServiceRef.current) {
     webRTCServiceRef.current.cleanup();
     webRTCServiceRef.current = null;
   }
   ```

3. **Simplify Media Constraints:**
   ```javascript
   // In webRTCService.ts
   mediaConstraints: {
     video: true,
     audio: true
   }
   ```

## 🔍 Advanced Debugging

### WebRTC Internals (Chrome)
1. Go to `chrome://webrtc-internals/`
2. Start a video call
3. Monitor connection statistics
4. Look for failed ICE candidates or connection states

### Network Analysis
1. Open Developer Tools → Network tab
2. Look for failed WebSocket connections
3. Check for CORS errors
4. Monitor bandwidth usage

### Performance Monitoring
1. Developer Tools → Performance tab
2. Record during video call
3. Look for memory leaks or CPU spikes
4. Check frame rate drops

## 📋 Issue Reporting Template

When reporting issues, include:

```
**Browser:** Chrome 120.0.6099.109
**OS:** Windows 11 / macOS 14.1 / Ubuntu 22.04
**Device:** Desktop / Mobile
**Error Message:** [Copy from console]
**Steps to Reproduce:** 
1. Go to /chat
2. Click "Start Chatting"
3. [Describe what happens]

**Console Logs:** [Copy relevant logs with emoji prefixes]
**Expected:** Video chat should work
**Actual:** [Describe the problem]
**Debug Tool Results:** [Test results from debug-video-chat.html]
```

---

## 🚀 Next Steps

If issues persist after following this guide:
1. Test with the debug tool (`debug-video-chat.html`)
2. Check browser compatibility
3. Try a different device/network
4. Report the issue with complete logs and system information

The video chat system has been significantly improved with better error handling, logging, and connection management. Most issues should now be resolved with proper error messages guiding users to solutions.
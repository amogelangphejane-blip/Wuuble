# Camera Permission Troubleshooting Guide

## 🎯 Problem Summary

Your streaming application is showing these errors:
- **Camera permissions not granted**
- **Camera is being used by another application**

## 🔍 Root Cause Analysis

You're running in a **Docker container environment** that lacks camera hardware access:

1. **No Camera Devices**: Container has no `/dev/video*` devices
2. **Container Isolation**: Docker containers don't access host hardware by default
3. **Missing Permissions**: Browser security requires explicit camera permissions
4. **HTTPS Requirements**: Camera access requires secure context (HTTPS/localhost)

## 🛠️ Solutions

### **Solution 1: Enable Camera Access in Docker (Production)**

If you need real camera access, restart your Docker container with camera device access:

```bash
# For single camera
docker run --device=/dev/video0:/dev/video0 -v /dev/shm:/dev/shm [your-options] [your-image]

# For multiple cameras
docker run --device=/dev/video0:/dev/video0 --device=/dev/video1:/dev/video1 -v /dev/shm:/dev/shm [your-options] [your-image]

# With privileged access (less secure but comprehensive)
docker run --privileged -v /dev:/dev -v /dev/shm:/dev/shm [your-options] [your-image]
```

### **Solution 2: Docker Compose Configuration**

Add camera access to your `docker-compose.yml`:

```yaml
version: '3.8'
services:
  your-app:
    # ... other configuration
    devices:
      - "/dev/video0:/dev/video0"
      - "/dev/video1:/dev/video1"  # if you have multiple cameras
    volumes:
      - "/dev/shm:/dev/shm"
    environment:
      - DISPLAY=${DISPLAY}
    # For X11 forwarding (if needed)
    volumes:
      - "/tmp/.X11-unix:/tmp/.X11-unix:rw"
```

### **Solution 3: Development/Testing Mode**

For development without real camera, create a mock video stream:

```bash
# Install ffmpeg for video generation
sudo apt-get install -y ffmpeg

# Create a virtual video device (requires v4l2loopback module on host)
sudo modprobe v4l2loopback devices=1 video_nr=10 card_label="Virtual Camera"

# Feed test pattern to virtual camera
ffmpeg -f lavfi -i testsrc=duration=10:size=320x240:rate=30 -pix_fmt yuv420p -f v4l2 /dev/video10
```

### **Solution 4: Browser-Based Testing**

Test your camera functionality using the existing debug tool:

1. **Open the debug page**: `http://localhost:5173/debug-video-feed.html`
2. **Check browser console** for detailed error messages
3. **Grant permissions** when prompted
4. **Verify HTTPS/localhost** requirements

## 🔧 Quick Fixes

### Fix 1: Browser Permissions
```javascript
// Check if permissions are granted
navigator.permissions.query({name: 'camera'}).then(function(result) {
  console.log('Camera permission:', result.state);
});

// Request permissions explicitly
navigator.mediaDevices.getUserMedia({video: true, audio: true})
  .then(stream => {
    console.log('✅ Camera access granted');
    // Use the stream
  })
  .catch(err => {
    console.error('❌ Camera access denied:', err.name, err.message);
  });
```

### Fix 2: Container Camera Setup
```bash
# Check if host has cameras
ls -la /dev/video* 

# Install camera utilities in container
sudo apt-get update && sudo apt-get install -y v4l-utils

# List available cameras
v4l2-ctl --list-devices

# Test camera access
v4l2-ctl --device=/dev/video0 --all
```

### Fix 3: HTTPS/Localhost Requirements
```bash
# For development, use localhost
http://localhost:3000

# For production, ensure HTTPS
https://yourdomain.com

# Use ngrok for HTTPS tunneling in development
npx ngrok http 3000
```

## 🧪 Testing Your Setup

### Test 1: Camera Device Detection
```bash
# Check for video devices
ls -la /dev/video*

# List camera capabilities
v4l2-ctl --list-devices
v4l2-ctl --list-formats-ext
```

### Test 2: Browser Camera Access
1. Open: `/debug-video-feed.html`
2. Click "Start Camera"
3. Check console for error messages
4. Verify video feed appears

### Test 3: Application Integration
1. Navigate to your streaming page
2. Click "Go Live" or similar
3. Test the "Camera Test Modal" if available
4. Check browser developer tools for errors

## 🚨 Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|--------|----------|
| `NotAllowedError` | Permissions denied | Grant camera permissions in browser |
| `NotFoundError` | No camera found | Connect camera, check Docker device access |
| `NotReadableError` | Camera busy | Close other apps using camera |
| `SecurityError` | Not HTTPS | Use HTTPS or localhost |
| `OverconstrainedError` | Unsupported settings | Adjust video constraints |

## 🔄 Development Workflow

### For Docker Development:
1. **Stop** current container
2. **Restart** with camera device access
3. **Test** camera functionality
4. **Debug** using browser tools

### For Local Development:
1. **Ensure** camera is connected
2. **Use** localhost (not IP address)
3. **Grant** browser permissions
4. **Test** with debug tools

## 📋 Troubleshooting Checklist

- [ ] Running Docker with `--device=/dev/video0:/dev/video0`
- [ ] Camera permissions granted in browser
- [ ] Using HTTPS or localhost
- [ ] No other applications using camera
- [ ] Browser supports WebRTC (Chrome, Firefox, Safari)
- [ ] Video constraints are reasonable
- [ ] Debug console shows no errors

## 🎯 Next Steps

1. **Choose your solution** based on your use case:
   - **Production**: Use Solution 1 (Docker device access)
   - **Development**: Use Solution 4 (Browser testing)
   - **Testing**: Use Solution 3 (Mock video)

2. **Test thoroughly** using the provided debug tools

3. **Monitor** browser console for detailed error messages

4. **Adjust** video constraints if needed for better compatibility

---

**Status**: 🔍 **Camera issues identified** - Container lacks camera device access. Follow solutions above based on your deployment needs.
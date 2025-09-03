# 🎥 How to Enable Camera Access in Docker

## 🎯 Quick Summary
You're currently running inside a Docker container that doesn't have camera access. Here's exactly how to fix it.

## 📋 Step-by-Step Instructions

### **Method 1: Docker Run Command (Most Common)**

If you're using a `docker run` command, add these flags:

```bash
# Basic camera access
docker run --device=/dev/video0:/dev/video0 -v /dev/shm:/dev/shm [your-other-options] [your-image]

# Multiple cameras (if you have them)
docker run --device=/dev/video0:/dev/video0 --device=/dev/video1:/dev/video1 -v /dev/shm:/dev/shm [your-other-options] [your-image]

# Full privileged access (less secure but works for all hardware)
docker run --privileged -v /dev:/dev -v /dev/shm:/dev/shm [your-other-options] [your-image]
```

#### **Complete Example:**
```bash
# Replace this with your current command:
docker run -p 5173:5173 your-app

# With camera access:
docker run --device=/dev/video0:/dev/video0 -v /dev/shm:/dev/shm -p 5173:5173 your-app
```

### **Method 2: Docker Compose (Recommended for Projects)**

Create or modify your `docker-compose.yml`:

```yaml
version: '3.8'
services:
  your-app:
    build: .
    ports:
      - "5173:5173"
    # ADD THESE LINES FOR CAMERA ACCESS:
    devices:
      - "/dev/video0:/dev/video0"
      - "/dev/video1:/dev/video1"  # if you have multiple cameras
    volumes:
      - "/dev/shm:/dev/shm"
      - ".:/workspace"
    environment:
      - NODE_ENV=development
    # Optional: For X11 forwarding (GUI apps)
    volumes:
      - "/tmp/.X11-unix:/tmp/.X11-unix:rw"
    environment:
      - DISPLAY=${DISPLAY}
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

### **Method 3: Dockerfile Modifications**

If you're building a custom image, add these to your Dockerfile:

```dockerfile
# Install video utilities
RUN apt-get update && apt-get install -y \
    v4l-utils \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Add user to video group
RUN usermod -a -G video $USER
```

### **Method 4: Kubernetes/Container Orchestration**

For Kubernetes deployments:

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: your-app
    image: your-image
    securityContext:
      privileged: true  # or use specific device access
    volumeMounts:
    - name: dev-video
      mountPath: /dev/video0
    - name: dev-shm
      mountPath: /dev/shm
  volumes:
  - name: dev-video
    hostPath:
      path: /dev/video0
  - name: dev-shm
    hostPath:
      path: /dev/shm
```

## 🔧 Testing Your Setup

### **Step 1: Check Host Camera**
First, verify the host machine has a camera:

```bash
# On the host machine (not in container):
ls -la /dev/video*
v4l2-ctl --list-devices
```

### **Step 2: Test Container Access**
After restarting with camera access:

```bash
# Inside the container:
ls -la /dev/video*
v4l2-ctl --list-devices  # if v4l-utils installed
```

### **Step 3: Test Web Application**
1. Open: `http://localhost:5173/debug-video-feed.html`
2. Click "Start Camera"
3. Allow browser permissions
4. Verify video feed appears

## 🚨 Troubleshooting Common Issues

### **Issue 1: "No such device" Error**
```bash
# Check if host has cameras:
ls -la /dev/video*

# If no cameras on host:
# - Connect a USB camera
# - Install camera drivers
# - Check if other apps are using it
```

### **Issue 2: Permission Denied**
```bash
# Add your user to video group on host:
sudo usermod -a -G video $USER

# Or run container with user privileges:
docker run --user $(id -u):$(id -g) --device=/dev/video0:/dev/video0 ...
```

### **Issue 3: Camera Busy**
```bash
# Check what's using the camera:
sudo lsof /dev/video0

# Kill processes using camera:
sudo pkill -f "process-name"
```

### **Issue 4: Browser Still Can't Access Camera**
- Ensure you're using `http://localhost` (not IP address)
- Use HTTPS in production
- Check browser permissions (click lock icon in address bar)
- Clear browser cache and cookies

## 🔄 Quick Commands for Your Current Setup

Since you're using a Vite React app, here are the exact commands:

### **If using Docker Run:**
```bash
# Stop current container
docker stop <container-name>

# Start with camera access
docker run -d \
  --name your-app \
  --device=/dev/video0:/dev/video0 \
  -v /dev/shm:/dev/shm \
  -p 5173:5173 \
  -v $(pwd):/workspace \
  your-image \
  npm run dev
```

### **If using Docker Compose:**
```bash
# Stop current setup
docker-compose down

# Add camera config to docker-compose.yml (see Method 2 above)

# Restart
docker-compose up -d
```

## 🎯 What Each Flag Does

| Flag | Purpose |
|------|---------|
| `--device=/dev/video0:/dev/video0` | Maps host camera to container |
| `-v /dev/shm:/dev/shm` | Shared memory for video processing |
| `--privileged` | Full hardware access (less secure) |
| `-v /dev:/dev` | Maps all host devices (with --privileged) |

## 🔒 Security Considerations

### **Least Privilege (Recommended):**
```bash
--device=/dev/video0:/dev/video0 -v /dev/shm:/dev/shm
```

### **More Permissive (Easier but less secure):**
```bash
--privileged -v /dev:/dev
```

### **Production Recommendations:**
- Use specific device mapping (`--device`)
- Avoid `--privileged` in production
- Use non-root user when possible
- Limit container capabilities

## 📞 Need Help?

If you're not sure how your Docker container was started:

1. **Ask your DevOps team** for the Docker command or compose file
2. **Check process list** on host: `docker ps -a`
3. **Look for startup scripts** in your project
4. **Check CI/CD pipelines** for deployment commands

## ✅ Success Checklist

- [ ] Host machine has camera (`ls /dev/video*`)
- [ ] Docker container restarted with camera flags
- [ ] Container can see camera devices
- [ ] Web app loads at `http://localhost:5173`
- [ ] Camera test page works
- [ ] Browser permissions granted
- [ ] Video feed appears in application

---

**🎉 Once you've restarted Docker with camera access, your streaming application should work perfectly!**
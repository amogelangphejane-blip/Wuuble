#!/bin/bash

echo "🎥 Docker Camera Access Fix Script"
echo "=================================="

# Check if we're in Docker
if [ -f /.dockerenv ]; then
    echo "✅ Running inside Docker container"
    echo ""
    echo "📋 TO FIX CAMERA ACCESS:"
    echo "1. Exit this container"
    echo "2. Find your Docker run command or docker-compose.yml"
    echo "3. Add camera device access:"
    echo ""
    echo "   For docker run command, add:"
    echo "   --device=/dev/video0:/dev/video0 -v /dev/shm:/dev/shm"
    echo ""
    echo "   For docker-compose.yml, add:"
    echo "   devices:"
    echo "     - \"/dev/video0:/dev/video0\""
    echo "   volumes:"
    echo "     - \"/dev/shm:/dev/shm\""
    echo ""
    echo "4. Restart your container"
    echo ""
else
    echo "❌ Not running in Docker container"
    echo "Camera issues might be browser permissions or hardware related"
fi

echo ""
echo "🔍 CURRENT STATUS:"
echo "=================="

# Check for video devices
if ls /dev/video* 1> /dev/null 2>&1; then
    echo "✅ Video devices found:"
    ls -la /dev/video*
else
    echo "❌ No video devices found in /dev/"
fi

echo ""
echo "🌐 TESTING URLS:"
echo "==============="
echo "Camera Test: http://localhost:5173/debug-video-feed.html"
echo "Main App: http://localhost:5173/"

echo ""
echo "🔧 QUICK BROWSER TEST:"
echo "====================="
echo "1. Open: http://localhost:5173/debug-video-feed.html"
echo "2. Click 'Start Camera'"
echo "3. Allow permissions when prompted"
echo "4. Check browser console (F12) for error messages"
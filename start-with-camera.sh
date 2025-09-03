#!/bin/bash

echo "🎥 Starting Docker Container with Camera Access"
echo "=============================================="

# Check if host has cameras
if ls /dev/video* 1> /dev/null 2>&1; then
    echo "✅ Camera devices found on host:"
    ls -la /dev/video*
    echo ""
else
    echo "⚠️  WARNING: No camera devices found on host machine!"
    echo "   Make sure a camera is connected before running this script."
    echo ""
fi

# Stop any existing container
echo "🛑 Stopping existing container..."
docker stop streaming-app-with-camera 2>/dev/null || true
docker rm streaming-app-with-camera 2>/dev/null || true

# Build the image if Dockerfile exists
if [ -f "Dockerfile.camera" ]; then
    echo "🔨 Building Docker image..."
    docker build -f Dockerfile.camera -t streaming-app-camera .
    IMAGE_NAME="streaming-app-camera"
else
    echo "📦 Using Node.js base image..."
    IMAGE_NAME="node:18"
fi

# Start container with camera access
echo "🚀 Starting container with camera access..."
docker run -d \
    --name streaming-app-with-camera \
    --device=/dev/video0:/dev/video0 \
    --device=/dev/video1:/dev/video1 \
    -v /dev/shm:/dev/shm \
    -p 5173:5173 \
    -v "$(pwd):/workspace" \
    -w /workspace \
    ${IMAGE_NAME} \
    bash -c "npm install && npm run dev"

# Wait a moment for container to start
sleep 3

# Check if container is running
if docker ps | grep -q streaming-app-with-camera; then
    echo ""
    echo "✅ SUCCESS! Container is running with camera access"
    echo ""
    echo "🌐 Open your browser and go to:"
    echo "   📱 Main App: http://localhost:5173"
    echo "   🎥 Camera Test: http://localhost:5173/debug-video-feed.html"
    echo ""
    echo "📋 To check logs: docker logs -f streaming-app-with-camera"
    echo "🛑 To stop: docker stop streaming-app-with-camera"
else
    echo ""
    echo "❌ ERROR: Container failed to start"
    echo "📋 Check logs: docker logs streaming-app-with-camera"
fi
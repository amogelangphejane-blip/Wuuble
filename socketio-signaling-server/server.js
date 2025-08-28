const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Socket.IO server with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Enhanced User Matchmaking System
class RandomChatMatcher {
  constructor() {
    this.waitingUsers = new Map(); // userId -> userInfo
    this.activeRooms = new Map();  // roomId -> roomInfo
    this.userSockets = new Map();  // userId -> socket
    this.socketUsers = new Map();  // socketId -> userId
    this.userPreferences = new Map(); // userId -> preferences
    this.matchingQueue = [];       // Array of user IDs waiting for matches
    this.stats = {
      totalMatches: 0,
      activeUsers: 0,
      averageWaitTime: 0
    };
  }

  // Add user to waiting queue with preferences
  addWaitingUser(userId, socket, preferences = {}) {
    const userInfo = {
      userId,
      socket,
      joinedAt: Date.now(),
      preferences: {
        ageRange: preferences.ageRange || [18, 99],
        interests: preferences.interests || [],
        language: preferences.language || 'any',
        gender: preferences.gender || 'any'
      },
      stats: {
        totalChats: 0,
        averageRating: 0
      }
    };

    this.waitingUsers.set(userId, userInfo);
    this.userSockets.set(userId, socket);
    this.socketUsers.set(socket.id, userId);
    this.matchingQueue.push(userId);
    this.stats.activeUsers++;

    console.log(`👤 User ${userId} joined waiting queue. Queue size: ${this.waitingUsers.size}`);
    
    // Update user on their queue position
    this.updateQueueStatus(userId);
    
    // Try to find a match immediately
    this.tryMatchUsers();
  }

  // Smart matching algorithm
  tryMatchUsers() {
    if (this.matchingQueue.length < 2) return;

    // Simple FIFO matching for now (can be enhanced with preferences later)
    const user1Id = this.matchingQueue.shift();
    const user2Id = this.matchingQueue.shift();

    const user1 = this.waitingUsers.get(user1Id);
    const user2 = this.waitingUsers.get(user2Id);

    // Verify both users still exist and are connected
    if (!user1 || !user2 || !user1.socket.connected || !user2.socket.connected) {
      // Re-add valid users back to queue
      if (user1 && user1.socket.connected) this.matchingQueue.unshift(user1Id);
      if (user2 && user2.socket.connected) this.matchingQueue.unshift(user2Id);
      return;
    }

    // Create room for matched users
    const roomId = `room_${Date.now()}_${uuidv4().substr(0, 8)}`;
    this.createRoom(roomId, user1, user2);
  }

  // Create room and notify matched users
  createRoom(roomId, user1, user2) {
    try {
      // Remove users from waiting queue
      this.waitingUsers.delete(user1.userId);
      this.waitingUsers.delete(user2.userId);

      // Join both users to the Socket.IO room
      user1.socket.join(roomId);
      user2.socket.join(roomId);

      // Calculate wait time
      const waitTime1 = Date.now() - user1.joinedAt;
      const waitTime2 = Date.now() - user2.joinedAt;
      const avgWaitTime = (waitTime1 + waitTime2) / 2;

      // Store room info
      const roomInfo = {
        roomId,
        users: [
          { userId: user1.userId, socketId: user1.socket.id },
          { userId: user2.userId, socketId: user2.socket.id }
        ],
        createdAt: Date.now(),
        status: 'active',
        waitTime: avgWaitTime
      };

      this.activeRooms.set(roomId, roomInfo);
      this.stats.totalMatches++;
      this.stats.averageWaitTime = (this.stats.averageWaitTime + avgWaitTime) / 2;

      // Notify users they've been matched
      user1.socket.emit('matched', {
        roomId,
        partnerId: user2.userId,
        isInitiator: true, // user1 will create the WebRTC offer
        waitTime: waitTime1
      });

      user2.socket.emit('matched', {
        roomId,
        partnerId: user1.userId,
        isInitiator: false, // user2 will wait for offer
        waitTime: waitTime2
      });

      console.log(`✅ Matched users ${user1.userId} and ${user2.userId} in room ${roomId} (wait time: ${Math.round(avgWaitTime/1000)}s)`);

      // Set up room cleanup timer (30 minutes max)
      setTimeout(() => {
        this.cleanupRoom(roomId, 'timeout');
      }, 30 * 60 * 1000);

    } catch (error) {
      console.error('❌ Error creating room:', error);
      
      // Re-add users to queue on error
      this.matchingQueue.push(user1.userId, user2.userId);
      this.waitingUsers.set(user1.userId, user1);
      this.waitingUsers.set(user2.userId, user2);
    }
  }

  // Update queue status for waiting users
  updateQueueStatus(userId) {
    const user = this.waitingUsers.get(userId);
    if (!user) return;

    const queuePosition = this.matchingQueue.indexOf(userId) + 1;
    const estimatedWaitTime = Math.max(5, queuePosition * 2); // Rough estimate

    user.socket.emit('queue-status', {
      position: queuePosition,
      estimatedWaitTime,
      totalWaiting: this.waitingUsers.size,
      message: queuePosition === 1 ? 
        'You\'re next in line!' : 
        `${queuePosition} people ahead of you`
    });
  }

  // Remove user from system
  removeUser(userId, reason = 'disconnect') {
    try {
      const user = this.waitingUsers.get(userId);
      
      if (user) {
        // Remove from waiting queue
        this.waitingUsers.delete(userId);
        const queueIndex = this.matchingQueue.indexOf(userId);
        if (queueIndex > -1) {
          this.matchingQueue.splice(queueIndex, 1);
        }
        this.stats.activeUsers--;
      }

      // Clean up socket mappings
      const socket = this.userSockets.get(userId);
      if (socket) {
        this.userSockets.delete(userId);
        this.socketUsers.delete(socket.id);
      }

      // Handle room cleanup
      this.cleanupUserRooms(userId, reason);

      console.log(`👋 User ${userId} removed (${reason})`);

    } catch (error) {
      console.error('❌ Error removing user:', error);
    }
  }

  // Clean up rooms when user leaves
  cleanupUserRooms(userId, reason = 'disconnect') {
    for (const [roomId, roomInfo] of this.activeRooms) {
      const userInRoom = roomInfo.users.find(u => u.userId === userId);
      
      if (userInRoom) {
        // Notify other user that partner left
        const otherUser = roomInfo.users.find(u => u.userId !== userId);
        if (otherUser) {
          io.to(otherUser.socketId).emit('partner-left', {
            reason,
            roomId,
            canReconnect: reason === 'connection-lost'
          });
        }

        // Mark room as inactive
        roomInfo.status = 'ended';
        roomInfo.endedAt = Date.now();
        roomInfo.endReason = reason;

        // Remove room after delay (keep for stats)
        setTimeout(() => {
          this.activeRooms.delete(roomId);
        }, 5000);

        console.log(`🧹 Cleaned up room ${roomId} (reason: ${reason})`);
        break;
      }
    }
  }

  // Clean up specific room
  cleanupRoom(roomId, reason = 'ended') {
    const roomInfo = this.activeRooms.get(roomId);
    if (!roomInfo) return;

    // Notify all users in room
    roomInfo.users.forEach(user => {
      io.to(user.socketId).emit('room-ended', {
        reason,
        roomId,
        duration: Date.now() - roomInfo.createdAt
      });
    });

    // Remove room
    this.activeRooms.delete(roomId);
    console.log(`🏠 Room ${roomId} ended (${reason})`);
  }

  // Get current statistics
  getStats() {
    return {
      ...this.stats,
      waitingUsers: this.waitingUsers.size,
      activeRooms: this.activeRooms.size,
      queueLength: this.matchingQueue.length
    };
  }

  // Find room by user ID
  findUserRoom(userId) {
    for (const [roomId, roomInfo] of this.activeRooms) {
      if (roomInfo.users.some(u => u.userId === userId)) {
        return { roomId, roomInfo };
      }
    }
    return null;
  }
}

// Initialize matcher
const matcher = new RandomChatMatcher();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    stats: matcher.getStats(),
    timestamp: new Date().toISOString()
  });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  res.json(matcher.getStats());
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Handle authentication/user identification
  socket.on('authenticate', (data) => {
    const { userId, userInfo } = data;
    
    if (!userId) {
      socket.emit('auth-error', { message: 'User ID required' });
      return;
    }

    socket.userId = userId;
    matcher.socketUsers.set(socket.id, userId);
    matcher.userSockets.set(userId, socket);

    socket.emit('authenticated', { 
      userId, 
      socketId: socket.id,
      serverStats: matcher.getStats()
    });

    console.log(`✅ User ${userId} authenticated on socket ${socket.id}`);
  });

  // User wants to find a random partner
  socket.on('find-random-partner', (data = {}) => {
    if (!socket.userId) {
      socket.emit('error', { message: 'Please authenticate first' });
      return;
    }

    console.log(`🔍 User ${socket.userId} looking for random partner`);

    // Check if user is already in a room
    const existingRoom = matcher.findUserRoom(socket.userId);
    if (existingRoom) {
      socket.emit('error', { 
        message: 'You are already in a chat room',
        roomId: existingRoom.roomId
      });
      return;
    }

    // Add to matching queue
    matcher.addWaitingUser(socket.userId, socket, data.preferences);

    // Send initial queue status
    socket.emit('searching', {
      message: 'Looking for a chat partner...',
      status: 'searching',
      timestamp: Date.now()
    });
  });

  // WebRTC Signaling Messages
  socket.on('webrtc-offer', (data) => {
    const { roomId, offer, targetUserId } = data;
    
    console.log(`📤 WebRTC offer from ${socket.userId} to ${targetUserId} in room ${roomId}`);
    
    socket.to(roomId).emit('webrtc-offer', {
      offer,
      fromUserId: socket.userId,
      roomId
    });
  });

  socket.on('webrtc-answer', (data) => {
    const { roomId, answer, targetUserId } = data;
    
    console.log(`📤 WebRTC answer from ${socket.userId} to ${targetUserId} in room ${roomId}`);
    
    socket.to(roomId).emit('webrtc-answer', {
      answer,
      fromUserId: socket.userId,
      roomId
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    const { roomId, candidate, targetUserId } = data;
    
    socket.to(roomId).emit('webrtc-ice-candidate', {
      candidate,
      fromUserId: socket.userId,
      roomId
    });
  });

  // Connection status updates
  socket.on('connection-status', (data) => {
    const { roomId, status, quality } = data;
    
    socket.to(roomId).emit('partner-connection-status', {
      fromUserId: socket.userId,
      status,
      quality,
      timestamp: Date.now()
    });
  });

  // User wants to skip to next partner
  socket.on('next-partner', () => {
    if (!socket.userId) return;

    console.log(`⏭️ User ${socket.userId} wants next partner`);

    // Clean up current room
    matcher.removeUser(socket.userId, 'next-partner');

    // Add back to waiting queue after small delay
    setTimeout(() => {
      if (socket.connected) {
        matcher.addWaitingUser(socket.userId, socket);
        socket.emit('searching', {
          message: 'Looking for a new chat partner...',
          status: 'searching',
          timestamp: Date.now()
        });
      }
    }, 1000);
  });

  // User ends chat session
  socket.on('end-chat', () => {
    if (!socket.userId) return;

    console.log(`🛑 User ${socket.userId} ended chat`);
    matcher.removeUser(socket.userId, 'user-ended');
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { roomId, isTyping } = data;
    socket.to(roomId).emit('partner-typing', {
      fromUserId: socket.userId,
      isTyping,
      timestamp: Date.now()
    });
  });

  // Handle chat messages (optional - for text chat during video)
  socket.on('chat-message', (data) => {
    const { roomId, message, type = 'text' } = data;
    
    const chatMessage = {
      id: uuidv4(),
      fromUserId: socket.userId,
      message,
      type,
      timestamp: Date.now()
    };

    // Broadcast to room
    io.to(roomId).emit('chat-message', chatMessage);
  });

  // Handle connection quality reports
  socket.on('quality-report', (data) => {
    const { roomId, quality, stats } = data;
    
    // Log quality issues for monitoring
    if (quality === 'poor') {
      console.log(`⚠️ Poor connection quality reported by ${socket.userId} in room ${roomId}`);
    }

    // Optionally notify partner about quality issues
    socket.to(roomId).emit('partner-quality-report', {
      fromUserId: socket.userId,
      quality,
      stats,
      timestamp: Date.now()
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`💔 Socket disconnected: ${socket.id} (${reason})`);
    
    const userId = matcher.socketUsers.get(socket.id);
    if (userId) {
      // Give user a chance to reconnect for temporary disconnections
      const reconnectGrace = reason === 'transport close' ? 10000 : 2000;
      
      setTimeout(() => {
        // Check if user reconnected
        const currentSocket = matcher.userSockets.get(userId);
        if (!currentSocket || !currentSocket.connected) {
          matcher.removeUser(userId, 'disconnect');
        }
      }, reconnectGrace);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`❌ Socket error from ${socket.id}:`, error);
  });
});

// Periodic cleanup and stats logging
setInterval(() => {
  const stats = matcher.getStats();
  console.log(`📊 Server Stats: ${stats.activeUsers} active users, ${stats.waitingUsers} waiting, ${stats.activeRooms} active rooms`);
  
  // Clean up stale connections
  // This would be more sophisticated in production
}, 30000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  
  // Notify all connected users
  io.emit('server-shutdown', {
    message: 'Server is restarting, please reconnect in a moment...',
    timestamp: Date.now()
  });
  
  // Close server
  httpServer.close(() => {
    console.log('✅ Server shutdown complete');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO Signaling Server running on port ${PORT}`);
  console.log(`📡 Accepting connections from: ${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}`);
  console.log(`🎯 Ready to handle random video chat matchmaking!`);
});

module.exports = { app, io, matcher };
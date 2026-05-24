require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const authRoutes = require('./routes/auth');
const displayRoutes = require('./routes/displays');
const videoRoutes = require('./routes/videos');
const playlistRoutes = require('./routes/playlists');
const userRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');

const { authMiddleware } = require('./middleware/authMiddleware');
const errorHandler = require('./middleware/errorHandler');
const db = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Make io available to all route handlers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/displays', displayRoutes);
app.use('/api/videos', authMiddleware, videoRoutes);
app.use('/api/playlists', authMiddleware, playlistRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Track socket → displayId for offline marking on disconnect
const socketDisplayMap = new Map();

// Socket.IO Events
io.on('connection', (socket) => {
  console.log('Display connected:', socket.id);

  socket.on('register_display', async ({ displayId }) => {
    socket.join(`display_${displayId}`);
    socketDisplayMap.set(socket.id, displayId);
    // Mark online immediately when socket registers
    try {
      await db('displays').where('display_id', displayId).update({
        status: 'online',
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch {}
    console.log(`Display ${displayId} joined room`);
  });

  socket.on('disconnect', async () => {
    const displayId = socketDisplayMap.get(socket.id);
    socketDisplayMap.delete(socket.id);
    if (displayId) {
      try {
        await db('displays').where('display_id', displayId).update({
          status: 'offline',
          updated_at: new Date().toISOString()
        });
        console.log(`Display ${displayId} marked offline`);
      } catch {}
    }
    console.log('Display disconnected:', socket.id);
  });
});

// Mark displays offline if last_sync is older than 2 minutes
setInterval(async () => {
  try {
    const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    await db('displays')
      .where('status', 'online')
      .where('last_sync', '<', cutoff)
      .update({ status: 'offline', updated_at: new Date().toISOString() });
  } catch {}
}, 60 * 1000);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket listening on port ${PORT}`);
});

module.exports = { app, io };

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

// Register display from player (no auth required)
router.post('/register', async (req, res) => {
  try {
    const { displayId, displayName, displayType, hardwareInfo } = req.body;

    let display = await db('displays').where('display_id', displayId).first();

    if (!display) {
      const [id] = await db('displays').insert({
        display_id: displayId,
        name: displayName || 'Display',
        type: displayType || 'telao',
        hardware_info: hardwareInfo,
        status: 'online',
        last_sync: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      display = await db('displays').where('id', id).first();
    } else {
      await db('displays').where('display_id', displayId).update({
        status: 'online',
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    const fresh = await db('displays').where('display_id', displayId).first();
    res.json({
      success: true,
      displayId: fresh.display_id,
      orientation: fresh.orientation || 'landscape',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get playlist for display by UUID (no auth - called by player)
router.get('/:displayId/playlist', async (req, res) => {
  try {
    const display = await db('displays').where('display_id', req.params.displayId).first();

    if (!display) {
      return res.status(404).json({ error: 'Display não encontrado' });
    }

    const displayPlaylist = await db('display_playlists')
      .where('display_playlists.display_id', display.id)
      .join('playlists', 'playlists.id', 'display_playlists.playlist_id')
      .where('playlists.is_active', true)
      .orderBy('display_playlists.created_at', 'desc')
      .select('playlists.*', 'display_playlists.playlist_id')
      .first();

    if (!displayPlaylist) {
      return res.json({ videos: [] });
    }

    const videos = await db('playlist_videos')
      .where('playlist_videos.playlist_id', displayPlaylist.playlist_id)
      .join('videos', 'videos.id', 'playlist_videos.video_id')
      .where('videos.is_active', true)
      .orderBy('playlist_videos.order')
      .select('videos.*');

    res.json({ videos, playlistId: displayPlaylist.playlist_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all displays (with current playlist name)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = db('displays')
      .leftJoin('display_playlists', 'display_playlists.display_id', 'displays.id')
      .leftJoin('playlists', 'playlists.id', 'display_playlists.playlist_id')
      .select([
        'displays.id',
        'displays.display_id',
        'displays.name',
        'displays.type',
        'displays.location',
        'displays.width',
        'displays.height',
        'displays.user_id',
        'displays.status',
        'displays.last_sync',
        'displays.ip_address',
        'displays.hardware_info',
        'displays.created_at',
        'displays.updated_at',
        db.raw("COALESCE(displays.orientation, 'landscape') as orientation"),
        'playlists.name as current_playlist_name',
        'playlists.id as current_playlist_id',
      ]);

    if (req.user.role !== 'admin') {
      query = query.where('displays.user_id', req.user.id);
    }

    const displays = await query;
    res.json(displays);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create display
router.post('/', authMiddleware, roleMiddleware('admin', 'editor'), async (req, res) => {
  try {
    const { name, type, location, width, height, ipAddress, hardwareInfo, orientation } = req.body;

    const displayId = uuidv4();
    const [id] = await db('displays').insert({
      display_id: displayId,
      name,
      type,
      location,
      width,
      height,
      orientation: orientation || 'landscape',
      user_id: req.user.id,
      ip_address: ipAddress,
      hardware_info: hardwareInfo,
      status: 'offline',
      created_at: new Date(),
      updated_at: new Date()
    });

    const display = await db('displays').where('id', id).first();
    res.status(201).json(display);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single display
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const display = await db('displays').where('id', req.params.id).first();
    
    if (!display) {
      return res.status(404).json({ error: 'Display não encontrado' });
    }

    if (req.user.role !== 'admin' && display.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Get current playlists
    const playlists = await db('display_playlists')
      .where('display_id', display.id)
      .join('playlists', 'playlists.id', 'display_playlists.playlist_id')
      .select('playlists.*', 'display_playlists.scheduled_start', 'display_playlists.scheduled_end');

    res.json({ ...display, playlists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update display
router.put('/:id', authMiddleware, roleMiddleware('admin', 'editor'), async (req, res) => {
  try {
    const { name, type, location, width, height, orientation } = req.body;
    const display = await db('displays').where('id', req.params.id).first();

    if (!display) {
      return res.status(404).json({ error: 'Display não encontrado' });
    }

    if (req.user.role !== 'admin' && display.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const updateData = { name, type, location, width, height, updated_at: new Date() };
    if (orientation !== undefined) updateData.orientation = orientation;
    await db('displays').where('id', req.params.id).update(updateData);

    const updated = await db('displays').where('id', req.params.id).first();
    
    // Notify display via WebSocket
    req.io.to(`display_${display.display_id}`).emit('display_updated', updated);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete display
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const display = await db('displays').where('id', req.params.id).first();

    if (!display) {
      return res.status(404).json({ error: 'Display não encontrado' });
    }

    await db('displays').where('id', req.params.id).del();
    res.json({ success: true, message: 'Display deletado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get display status
router.get('/:id/status', authMiddleware, async (req, res) => {
  try {
    const display = await db('displays').where('id', req.params.id).first();
    
    if (!display) {
      return res.status(404).json({ error: 'Display não encontrado' });
    }

    res.json({
      displayId: display.display_id,
      status: display.status,
      lastSync: display.last_sync,
      ipAddress: display.ip_address
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update display status (from player)
router.post('/:displayId/status', async (req, res) => {
  try {
    const { status, lastSync, ipAddress } = req.body;
    const display = await db('displays').where('display_id', req.params.displayId).first();

    if (!display) {
      return res.status(404).json({ error: 'Display não encontrado' });
    }

    await db('displays').where('id', display.id).update({
      status,
      last_sync: lastSync || new Date(),
      ip_address: ipAddress,
      updated_at: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign playlist to display
router.post('/:id/playlist', authMiddleware, roleMiddleware('admin', 'editor'), async (req, res) => {
  try {
    const { playlistId, scheduledStart, scheduledEnd } = req.body;
    const display = await db('displays').where('id', req.params.id).first();

    if (!display) {
      return res.status(404).json({ error: 'Display não encontrado' });
    }

    // Replace any existing assignment for this display
    await db('display_playlists').where('display_id', display.id).del();

    await db('display_playlists').insert({
      display_id: display.id,
      playlist_id: playlistId,
      scheduled_start: scheduledStart || null,
      scheduled_end: scheduledEnd || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Notify display
    const playlist = await db('playlists').where('id', playlistId).first();
    req.io.to(`display_${display.display_id}`).emit('playlist_assigned', { playlistId, playlist });

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

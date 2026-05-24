const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// Get all playlists
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = db('playlists');
    
    if (req.user.role !== 'admin') {
      query = query.where('user_id', req.user.id);
    }

    const playlists = await query;
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create playlist
router.post('/', authMiddleware, roleMiddleware('admin', 'editor'), async (req, res) => {
  try {
    const { name, description } = req.body;

    const [id] = await db('playlists').insert({
      name,
      description,
      user_id: req.user.id,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    const playlist = await db('playlists').where('id', id).first();
    res.status(201).json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get playlist with videos
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const playlist = await db('playlists').where('id', req.params.id).first();
    
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist não encontrada' });
    }

    const videos = await db('playlist_videos')
      .where('playlist_id', playlist.id)
      .join('videos', 'videos.id', 'playlist_videos.video_id')
      .select('videos.*', 'playlist_videos.order')
      .orderBy('playlist_videos.order');

    res.json({ ...playlist, videos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update playlist
router.put('/:id', authMiddleware, roleMiddleware('admin', 'editor'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const playlist = await db('playlists').where('id', req.params.id).first();

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist não encontrada' });
    }

    if (req.user.role !== 'admin' && playlist.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await db('playlists').where('id', req.params.id).update({
      name,
      description,
      updated_at: new Date()
    });

    const updated = await db('playlists').where('id', req.params.id).first();
    
    // Notify connected displays
    const displays = await db('display_playlists')
      .where('playlist_id', updated.id)
      .join('displays', 'displays.id', 'display_playlists.display_id')
      .select('displays.display_id');

    displays.forEach(display => {
      req.io.to(`display_${display.display_id}`).emit('playlist_updated', updated);
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add video to playlist
router.post('/:id/videos', authMiddleware, roleMiddleware('admin', 'editor'), async (req, res) => {
  try {
    const { videoId } = req.body;
    const playlist = await db('playlists').where('id', req.params.id).first();

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist não encontrada' });
    }

    if (req.user.role !== 'admin' && playlist.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const video = await db('videos').where('id', videoId).first();
    if (!video) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }

    const existing = await db('playlist_videos')
      .where('playlist_id', playlist.id)
      .where('video_id', videoId)
      .first();
    if (existing) {
      return res.status(409).json({ error: 'Vídeo já está na playlist' });
    }

    const maxRow = await db('playlist_videos')
      .where('playlist_id', playlist.id)
      .max('order as maxOrder')
      .first();
    const nextOrder = (maxRow.maxOrder ?? -1) + 1;

    await db('playlist_videos').insert({
      playlist_id: playlist.id,
      video_id: videoId,
      order: nextOrder,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Notify displays
    const displays = await db('display_playlists')
      .where('playlist_id', playlist.id)
      .join('displays', 'displays.id', 'display_playlists.display_id')
      .select('displays.display_id');

    displays.forEach(display => {
      req.io.to(`display_${display.display_id}`).emit('playlist_changed', {
        playlistId: playlist.id,
        action: 'video_added'
      });
    });

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder videos in playlist
router.put('/:id/reorder', authMiddleware, roleMiddleware('admin', 'editor'), async (req, res) => {
  try {
    const { videos } = req.body;
    const playlist = await db('playlists').where('id', req.params.id).first();

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist não encontrada' });
    }

    if (req.user.role !== 'admin' && playlist.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Update order for each video
    for (let i = 0; i < videos.length; i++) {
      await db('playlist_videos')
        .where('playlist_id', playlist.id)
        .where('video_id', videos[i])
        .update({ order: i });
    }

    // Notify displays
    const displays = await db('display_playlists')
      .where('playlist_id', playlist.id)
      .join('displays', 'displays.id', 'display_playlists.display_id')
      .select('displays.display_id');

    displays.forEach(display => {
      req.io.to(`display_${display.display_id}`).emit('playlist_reordered', {
        playlistId: playlist.id,
        videoOrder: videos
      });
    });

    res.json({ success: true, message: 'Ordem atualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove video from playlist
router.delete('/:id/videos/:videoId', authMiddleware, roleMiddleware('admin', 'editor'), async (req, res) => {
  try {
    const playlist = await db('playlists').where('id', req.params.id).first();

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist não encontrada' });
    }

    if (req.user.role !== 'admin' && playlist.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await db('playlist_videos')
      .where('playlist_id', playlist.id)
      .where('video_id', req.params.videoId)
      .del();

    // Notify displays
    const displays = await db('display_playlists')
      .where('playlist_id', playlist.id)
      .join('displays', 'displays.id', 'display_playlists.display_id')
      .select('displays.display_id');

    displays.forEach(display => {
      req.io.to(`display_${display.display_id}`).emit('playlist_changed', {
        playlistId: playlist.id,
        action: 'video_removed'
      });
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete playlist
router.delete('/:id', authMiddleware, roleMiddleware('admin', 'editor'), async (req, res) => {
  try {
    const playlist = await db('playlists').where('id', req.params.id).first();

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist não encontrada' });
    }

    if (req.user.role !== 'admin' && playlist.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await db('playlists').where('id', req.params.id).del();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

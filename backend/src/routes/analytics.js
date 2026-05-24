const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get analytics for a display
router.get('/display/:displayId', authMiddleware, async (req, res) => {
  try {
    const analytics = await db('analytics')
      .where('display_id', req.params.displayId)
      .join('videos', 'videos.id', 'analytics.video_id')
      .select('analytics.*', 'videos.title', 'videos.duration_seconds');

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get overall analytics
router.get('/', authMiddleware, async (req, res) => {
  try {
    const analytics = await db('analytics')
      .join('displays', 'displays.id', 'analytics.display_id')
      .join('videos', 'videos.id', 'analytics.video_id')
      .select('analytics.*', 'displays.name as display_name', 'videos.title as video_title');

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record video play (from player)
router.post('/play', async (req, res) => {
  try {
    const { displayId, videoId } = req.body;

    const display = await db('displays').where('display_id', displayId).first();
    if (!display) {
      return res.status(404).json({ error: 'Display não encontrado' });
    }

    const video = await db('videos').where('id', videoId).first();
    if (!video) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }

    let analytics = await db('analytics')
      .where('display_id', display.id)
      .where('video_id', videoId)
      .first();

    if (analytics) {
      await db('analytics').where('id', analytics.id).update({
        plays_count: analytics.plays_count + 1,
        last_played: new Date()
      });
    } else {
      await db('analytics').insert({
        display_id: display.id,
        video_id: videoId,
        plays_count: 1,
        last_played: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const ffmpeg = require('fluent-ffmpeg');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/videos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_VIDEO_SIZE) || 500000000 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de vídeo não permitido'));
    }
  }
});

// Get all videos
router.get('/', authMiddleware, async (req, res) => {
  try {
    const videos = await db('videos').where('is_active', true);
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload video
router.post('/upload', authMiddleware, roleMiddleware('admin', 'editor'), upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const { title, description } = req.body;
    const filePath = 'uploads/videos/' + path.basename(req.file.path);

    // Get video duration using ffmpeg (simplified - you may need to configure ffmpeg)
    let duration = 10; // Default to 10 seconds
    
    const [id] = await db('videos').insert({
      title,
      description,
      file_path: filePath,
      duration: duration,
      duration_seconds: Math.ceil(duration),
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      created_by: req.user.id,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    const video = await db('videos').where('id', id).first();
    res.status(201).json(video);
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ error: error.message });
  }
});

// Get single video
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const video = await db('videos').where('id', req.params.id).first();
    
    if (!video) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }

    res.json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update video
router.put('/:id', authMiddleware, roleMiddleware('admin', 'editor'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const video = await db('videos').where('id', req.params.id).first();

    if (!video) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }

    await db('videos').where('id', req.params.id).update({
      title,
      description,
      updated_at: new Date()
    });

    const updated = await db('videos').where('id', req.params.id).first();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete video
router.delete('/:id', authMiddleware, roleMiddleware('admin', 'editor'), async (req, res) => {
  try {
    const video = await db('videos').where('id', req.params.id).first();

    if (!video) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }

    // Delete file
    if (video.file_path && fs.existsSync(video.file_path)) {
      fs.unlinkSync(video.file_path);
    }

    // Soft delete
    await db('videos').where('id', req.params.id).update({
      is_active: false,
      updated_at: new Date()
    });

    res.json({ success: true, message: 'Vídeo deletado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

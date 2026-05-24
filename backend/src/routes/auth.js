const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Register
router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, name } = req.body;

      // Check if user exists
      const exists = await db('users').where('email', email).first();
      if (exists) {
        return res.status(400).json({ error: 'Email já registrado' });
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const [userId] = await db('users').insert({
        email,
        name,
        password_hash: passwordHash,
        created_at: new Date(),
        updated_at: new Date()
      });

      const token = jwt.sign(
        { userId, email, role: 'viewer' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      res.json({ token, user: { id: userId, email, name, role: 'viewer' } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      const user = await db('users').where('email', email).first();
      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      // Check if 2FA is enabled
      if (user.two_fa_enabled) {
        return res.json({ 
          requiresTwoFa: true, 
          userId: user.id,
          email: user.email 
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role 
        } 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Setup 2FA
router.post('/2fa/setup', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const secret = speakeasy.generateSecret({
      name: `WnrMidia (${userId})`,
      issuer: 'WnrMidia'
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    res.json({ 
      qrCode, 
      secret: secret.base32,
      manualEntry: secret.base32
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify 2FA Token
router.post('/2fa/verify', async (req, res) => {
  try {
    const { userId, token, secret } = req.body;

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: parseInt(process.env.TOTP_WINDOW) || 2
    });

    if (!verified) {
      return res.status(401).json({ error: 'Token 2FA inválido' });
    }

    // Update user 2FA
    await db('users').where('id', userId).update({
      two_fa_enabled: true,
      two_fa_secret: secret
    });

    const user = await db('users').where('id', userId).first();
    const authToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({ token: authToken, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify 2FA on Login
router.post('/2fa/verify-login', async (req, res) => {
  try {
    const { userId, token } = req.body;

    const user = await db('users').where('id', userId).first();
    if (!user || !user.two_fa_secret) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_fa_secret,
      encoding: 'base32',
      token: token,
      window: parseInt(process.env.TOTP_WINDOW) || 2
    });

    if (!verified) {
      return res.status(401).json({ error: 'Token 2FA inválido' });
    }

    const authToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({ token: authToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

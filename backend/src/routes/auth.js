const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, name, email, role, password FROM Users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const ok = bcrypt.compareSync(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server misconfigured: JWT_SECRET is missing' });
    }

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

    return res.json({ token, user: payload });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  try {
    return res.json(req.user);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to get user' });
  }
});

module.exports = router;

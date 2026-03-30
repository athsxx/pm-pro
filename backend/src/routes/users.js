const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

const router = express.Router();
router.use(authenticateToken);

const PUBLIC_USER_COLS =
  'id, name, email, role, costRate, overtimeRate, maxUnits, createdAt';

const ALLOWED_ROLES = new Set(['admin', 'manager', 'member']);

router.get('/', requireRole('admin', 'manager'), (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`SELECT ${PUBLIC_USER_COLS} FROM Users ORDER BY email`).all();
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', requireRole('admin'), (req, res) => {
  try {
    const { name, email, password, role: roleIn } = req.body || {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'email is required' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'password is required' });
    }

    const role = roleIn != null ? String(roleIn) : 'member';
    if (!ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ error: 'role must be admin, manager, or member' });
    }

    const db = getDb();
    const dup = db.prepare('SELECT id FROM Users WHERE email = ?').get(email.trim());
    if (dup) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const id = uuidv4();
    const hash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO Users (id, name, email, password, role, costRate, overtimeRate, maxUnits, deviceToken, createdAt)
       VALUES (?, ?, ?, ?, ?, 0, 0, 1, NULL, ?)`
    ).run(id, name.trim(), email.trim(), hash, role, now);

    const row = db.prepare(`SELECT ${PUBLIC_USER_COLS} FROM Users WHERE id = ?`).get(id);
    return res.status(201).json(row);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/device-token', (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'token is required' });
    }

    const db = getDb();
    db.prepare('UPDATE Users SET deviceToken = ? WHERE id = ?').run(token, req.user.id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const db = getDb();

    const existing = db.prepare('SELECT * FROM Users WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return res.status(400).json({ error: 'name must be a non-empty string' });
      }
      updates.name = body.name.trim();
    }
    if (body.email !== undefined) {
      if (typeof body.email !== 'string' || !body.email.trim()) {
        return res.status(400).json({ error: 'email must be a non-empty string' });
      }
      const email = body.email.trim();
      const other = db.prepare('SELECT id FROM Users WHERE email = ? AND id != ?').get(email, id);
      if (other) {
        return res.status(409).json({ error: 'Email already in use' });
      }
      updates.email = email;
    }
    if (body.role !== undefined) {
      const role = String(body.role);
      if (!ALLOWED_ROLES.has(role)) {
        return res.status(400).json({ error: 'role must be admin, manager, or member' });
      }
      if (existing.role === 'admin' && role !== 'admin') {
        const { count } = db.prepare("SELECT COUNT(*) as count FROM Users WHERE role = 'admin'").get();
        if (count <= 1) {
          return res.status(400).json({ error: 'Cannot demote the last admin' });
        }
      }
      updates.role = role;
    }
    if (body.password !== undefined) {
      if (typeof body.password !== 'string' || !body.password) {
        return res.status(400).json({ error: 'password must be a non-empty string' });
      }
      updates.password = bcrypt.hashSync(body.password, 10);
    }

    if (Object.keys(updates).length === 0) {
      const row = db.prepare(`SELECT ${PUBLIC_USER_COLS} FROM Users WHERE id = ?`).get(id);
      return res.json(row);
    }

    const setClause = Object.keys(updates)
      .map((k) => `${k} = @${k}`)
      .join(', ');
    db.prepare(`UPDATE Users SET ${setClause} WHERE id = @id`).run({ ...updates, id });

    const row = db.prepare(`SELECT ${PUBLIC_USER_COLS} FROM Users WHERE id = ?`).get(id);
    return res.json(row);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

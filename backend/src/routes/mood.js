const express = require('express');

const { uuidv4 } = require('../db/helpers');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.post('/', (req, res) => {
  try {
    const { mood, note } = req.body || {};
    if (!mood) return res.status(400).json({ error: 'mood is required' });

    const db = getDb();
    const id = uuidv4();
    db.prepare('INSERT INTO MoodCheckins (id, userId, mood, note) VALUES (?, ?, ?, ?)').run(
      id,
      req.user.id,
      mood,
      note || null
    );

    return res.status(201).json({ id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db
      .prepare('SELECT * FROM MoodCheckins WHERE userId = ? ORDER BY checkedAt DESC')
      .all(req.user.id);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

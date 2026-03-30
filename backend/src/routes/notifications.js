const express = require('express');

const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db
      .prepare('SELECT * FROM Notifications WHERE userId = ? ORDER BY createdAt DESC')
      .all(req.user.id);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/read-all', (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE Notifications SET isRead = 1 WHERE userId = ? AND isRead = 0').run(req.user.id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/read', (req, res) => {
  try {
    const db = getDb();
    const note = db.prepare('SELECT * FROM Notifications WHERE id = ?').get(req.params.id);
    if (!note) return res.status(404).json({ error: 'Notification not found' });
    if (note.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    db.prepare('UPDATE Notifications SET isRead = 1 WHERE id = ?').run(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

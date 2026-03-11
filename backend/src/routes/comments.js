const express = require('express');

const { uuidv4 } = require('../db/helpers');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const { taskId } = req.query;
    if (!taskId) return res.status(400).json({ error: 'taskId is required' });

    const db = getDb();
    const task = db.prepare('SELECT id, assigneeId, projectId FROM Tasks WHERE id = ?').get(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role === 'member' && task.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const rows = db
      .prepare(
        `SELECT c.*, u.name as userName, u.email as userEmail
         FROM Comments c
         LEFT JOIN Users u ON u.id = c.userId
         WHERE c.taskId = ?
         ORDER BY c.createdAt ASC`
      )
      .all(taskId);

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { taskId, text } = req.body || {};
    if (!taskId || !text) return res.status(400).json({ error: 'taskId and text are required' });

    const db = getDb();
    const task = db.prepare('SELECT id, assigneeId, projectId FROM Tasks WHERE id = ?').get(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role === 'member' && task.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const id = uuidv4();
    db.prepare('INSERT INTO Comments (id, taskId, userId, text) VALUES (?, ?, ?, ?)').run(id, taskId, req.user.id, text);

    return res.status(201).json({ id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const comment = db.prepare('SELECT * FROM Comments WHERE id = ?').get(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (req.user.role === 'member' && comment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    db.prepare('DELETE FROM Comments WHERE id = ?').run(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

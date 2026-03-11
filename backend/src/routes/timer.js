const express = require('express');

const { uuidv4, nowIso } = require('../db/helpers');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/active', (req, res) => {
  try {
    const db = getDb();
    const active = db
      .prepare('SELECT * FROM Timer WHERE userId = ? AND stoppedAt IS NULL ORDER BY startedAt DESC LIMIT 1')
      .get(req.user.id);

    return res.json(active || null);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/start', (req, res) => {
  try {
    const { taskId } = req.body || {};
    if (!taskId) return res.status(400).json({ error: 'taskId is required' });

    const db = getDb();
    const task = db.prepare('SELECT * FROM Tasks WHERE id = ?').get(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role === 'member' && task.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const existing = db
      .prepare('SELECT * FROM Timer WHERE userId = ? AND stoppedAt IS NULL ORDER BY startedAt DESC LIMIT 1')
      .get(req.user.id);
    if (existing) return res.status(400).json({ error: 'A timer is already running' });

    const id = uuidv4();
    db.prepare('INSERT INTO Timer (id, taskId, userId, startedAt) VALUES (?, ?, ?, ?)').run(
      id,
      taskId,
      req.user.id,
      nowIso()
    );

    return res.status(201).json({ id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/stop', (req, res) => {
  try {
    const db = getDb();
    const active = db
      .prepare('SELECT * FROM Timer WHERE userId = ? AND stoppedAt IS NULL ORDER BY startedAt DESC LIMIT 1')
      .get(req.user.id);

    if (!active) return res.status(400).json({ error: 'No active timer' });

    const task = db.prepare('SELECT * FROM Tasks WHERE id = ?').get(active.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const stoppedAt = nowIso();
    const startedAtMs = new Date(active.startedAt).getTime();
    const stoppedAtMs = new Date(stoppedAt).getTime();
    const hours = Math.max(0, (stoppedAtMs - startedAtMs) / (1000 * 60 * 60));

    const tx = db.transaction(() => {
      db.prepare('UPDATE Timer SET stoppedAt = ?, hours = ? WHERE id = ?').run(stoppedAt, hours, active.id);

      const timeLogId = uuidv4();
      db.prepare('INSERT INTO TimeLog (id, taskId, userId, hours, note, loggedAt) VALUES (?, ?, ?, ?, ?, ?)').run(
        timeLogId,
        task.id,
        req.user.id,
        hours,
        'Timer auto-log',
        stoppedAt
      );

      const addCost = hours * Number(task.costPerHour || 0);
      db.prepare('UPDATE Tasks SET actualCost = COALESCE(actualCost, 0) + ? WHERE id = ?').run(addCost, task.id);
    });
    tx();

    req.app.get('io')?.emit('task:updated', { taskId: task.id, projectId: task.projectId });

    return res.json({ ok: true, hours });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

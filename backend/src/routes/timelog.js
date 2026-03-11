const express = require('express');

const { uuidv4, nowIso } = require('../db/helpers');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Spec: POST /api/tasks/:id/time-log lives under tasks, but backend mounts timelog as /api/timelog
// We implement it here as POST /api/timelog/task/:id/time-log and also export a handler in tasks route in Phase 2.5.

router.post('/task/:id/time-log', (req, res) => {
  try {
    const { hours, note, loggedAt } = req.body || {};
    if (hours === undefined || Number(hours) <= 0) return res.status(400).json({ error: 'hours must be > 0' });

    const db = getDb();
    const task = db.prepare('SELECT * FROM Tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role === 'member' && task.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const id = uuidv4();
    const ts = loggedAt || nowIso();

    db.prepare('INSERT INTO TimeLog (id, taskId, userId, hours, note, loggedAt) VALUES (?, ?, ?, ?, ?, ?)').run(
      id,
      task.id,
      req.user.id,
      Number(hours),
      note || null,
      ts
    );

    // Also update task.actualCost
    const addCost = Number(hours) * Number(task.costPerHour || 0);
    db.prepare('UPDATE Tasks SET actualCost = COALESCE(actualCost, 0) + ? WHERE id = ?').run(addCost, task.id);

    req.app.get('io')?.emit('task:updated', { taskId: task.id, projectId: task.projectId });

    return res.status(201).json({ id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');

const { uuidv4 } = require('../db/helpers');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

const router = express.Router({ mergeParams: true });
router.use(authenticateToken);

// This router supports both:
// - Spec mount:   /api/projects/:id/baselines
// - Legacy mount: /api/baselines/project/:id

function getProjectId(req) {
  return req.params.id;
}

router.post(['/project/:id', '/'], requireRole('admin', 'manager'), (req, res) => {
  try {
  const projectId = getProjectId(req);
    const { baselineNumber, name } = req.body || {};
    if (baselineNumber === undefined) return res.status(400).json({ error: 'baselineNumber is required' });
    if (baselineNumber < 0 || baselineNumber > 10) return res.status(400).json({ error: 'baselineNumber must be 0..10' });

    const db = getDb();
    const proj = db.prepare('SELECT * FROM Projects WHERE id = ?').get(projectId);
    if (!proj) return res.status(404).json({ error: 'Project not found' });

    const id = uuidv4();

    const tx = db.transaction(() => {
      db.prepare(
        `INSERT INTO Baselines (id, projectId, baselineNumber, name) VALUES (?, ?, ?, ?)`
      ).run(id, projectId, baselineNumber, name || `Baseline ${baselineNumber}`);

      const tasks = db.prepare('SELECT * FROM Tasks WHERE projectId = ?').all(projectId);
      const insertSnap = db.prepare(
        `INSERT INTO BaselineSnapshots (id, baselineId, taskId, startDate, endDate, duration, progress, cost)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );

      for (const t of tasks) {
        const cost = Number(t.baselineCost || 0);
        insertSnap.run(uuidv4(), id, t.id, t.startDate || null, t.endDate || null, t.duration || null, t.progress || 0, cost);
      }
    });

    try {
      tx();
    } catch (err) {
      if (String(err.message || '').includes('UNIQUE')) {
        return res.status(400).json({ error: 'Baseline number already exists for this project' });
      }
      throw err;
    }

    return res.status(201).json({ id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/project/:id', (req, res) => {
  try {
    const db = getDb();
    const rows = db
      .prepare('SELECT * FROM Baselines WHERE projectId = ? ORDER BY baselineNumber ASC')
      .all(getProjectId(req));
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  // Spec: GET /api/projects/:id/baselines
  req.url = `/project/${getProjectId(req)}`;
  return router.handle(req, res);
});

router.get(['/project/:id/:num', '/:num'], (req, res) => {
  try {
    const db = getDb();
    const baseline = db
      .prepare('SELECT * FROM Baselines WHERE projectId = ? AND baselineNumber = ?')
  .get(getProjectId(req), Number(req.params.num));
    if (!baseline) return res.status(404).json({ error: 'Baseline not found' });

    const snaps = db
      .prepare(
        `SELECT s.*, t.title as taskTitle
         FROM BaselineSnapshots s
         LEFT JOIN Tasks t ON t.id = s.taskId
         WHERE s.baselineId = ?`
      )
      .all(baseline.id);

    return res.json({ baseline, snapshots: snaps });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/project/:id/:num', requireRole('admin', 'manager'), (req, res) => {
  try {
    const db = getDb();
    const baseline = db
      .prepare('SELECT * FROM Baselines WHERE projectId = ? AND baselineNumber = ?')
  .get(getProjectId(req), Number(req.params.num));
    if (!baseline) return res.status(404).json({ error: 'Baseline not found' });

    const tx = db.transaction(() => {
      db.prepare('DELETE FROM BaselineSnapshots WHERE baselineId = ?').run(baseline.id);
      db.prepare('DELETE FROM Baselines WHERE id = ?').run(baseline.id);
    });
    tx();

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:num', requireRole('admin', 'manager'), (req, res) => {
  // Spec: DELETE /api/projects/:id/baselines/:num
  req.url = `/project/${getProjectId(req)}/${req.params.num}`;
  return router.handle(req, res);
});

module.exports = router;

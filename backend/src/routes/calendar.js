const express = require('express');

const { uuidv4 } = require('../db/helpers');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

const router = express.Router({ mergeParams: true });
router.use(authenticateToken);

// Mounted as /api/calendar but spec wants /api/projects/:id/calendar.
// For simplicity, we support both:
// - /api/calendar/:id
// - /api/projects/:id/calendar via baselines/projects router later (web can call either; Phase 4 will call /api/projects/:id/calendar)

function getProjectId(req) {
  return req.params.id || req.params.projectId;
}

router.get('/:id', (req, res) => {
  try {
    const projectId = getProjectId(req);
    const db = getDb();
    const cal = db.prepare('SELECT * FROM ProjectCalendars WHERE projectId = ?').get(projectId);
    if (!cal) return res.status(404).json({ error: 'Calendar not found' });
    return res.json(cal);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireRole('admin', 'manager'), (req, res) => {
  try {
    const projectId = getProjectId(req);
    const { name, workDays, workHoursPerDay, holidays } = req.body || {};
    if (!workDays || !workHoursPerDay) {
      return res.status(400).json({ error: 'workDays and workHoursPerDay are required' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM ProjectCalendars WHERE projectId = ?').get(projectId);

    if (!existing) {
      const id = uuidv4();
      db.prepare(
        'INSERT INTO ProjectCalendars (id, projectId, name, workDays, workHoursPerDay, holidays) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(
        id,
        projectId,
        name || 'Calendar',
        Array.isArray(workDays) ? workDays.join(',') : String(workDays),
        workHoursPerDay,
        holidays ? JSON.stringify(holidays) : '[]'
      );
      return res.status(201).json({ id });
    }

    db.prepare(
      `UPDATE ProjectCalendars SET name = ?, workDays = ?, workHoursPerDay = ?, holidays = ? WHERE projectId = ?`
    ).run(
      name ?? existing.name,
      Array.isArray(workDays) ? workDays.join(',') : String(workDays),
      workHoursPerDay,
      holidays ? JSON.stringify(holidays) : existing.holidays,
      projectId
    );

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

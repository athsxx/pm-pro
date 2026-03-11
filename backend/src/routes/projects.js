const express = require('express');

const { uuidv4 } = require('../db/helpers');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const db = getDb();
    let projects;

    if (req.user.role === 'admin' || req.user.role === 'manager') {
      projects = db
        .prepare(
          `SELECT p.*, u.name as managerName, u.email as managerEmail
           FROM Projects p
           LEFT JOIN Users u ON u.id = p.managerId
           ORDER BY p.createdAt DESC`
        )
        .all();
    } else {
      // Members: projects where they have at least one assigned task
      projects = db
        .prepare(
          `SELECT DISTINCT p.*, u.name as managerName, u.email as managerEmail
           FROM Projects p
           LEFT JOIN Users u ON u.id = p.managerId
           INNER JOIN Tasks t ON t.projectId = p.id
           WHERE t.assigneeId = ?
           ORDER BY p.createdAt DESC`
        )
        .all(req.user.id);
    }

    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const project = db
      .prepare(
        `SELECT p.*, u.name as managerName, u.email as managerEmail
         FROM Projects p
         LEFT JOIN Users u ON u.id = p.managerId
         WHERE p.id = ?`
      )
      .get(req.params.id);

    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (req.user.role === 'member') {
      const assigned = db
        .prepare('SELECT 1 as ok FROM Tasks WHERE projectId = ? AND assigneeId = ? LIMIT 1')
        .get(project.id, req.user.id);
      if (!assigned) return res.status(403).json({ error: 'Forbidden' });
    }

  const tasks = db.prepare('SELECT * FROM Tasks WHERE projectId = ? ORDER BY createdAt DESC').all(project.id);
  const tasksWithAlias = tasks.map((t) => ({ ...t, endDate: t.dueDate || t.endDate || null }));

  return res.json({ ...project, tasks: tasksWithAlias });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', requireRole('admin', 'manager'), (req, res) => {
  try {
    const { name, description, startDate, endDate, status, managerId } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });

    const db = getDb();
    const id = uuidv4();
    const mgr = managerId || req.user.id;

    db.prepare(
      `INSERT INTO Projects (id, name, description, startDate, endDate, status, managerId)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, name, description || null, startDate || null, endDate || null, status || 'active', mgr);

    return res.status(201).json({ id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireRole('admin', 'manager'), (req, res) => {
  try {
    const { name, description, startDate, endDate, status, managerId } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });

    const db = getDb();
    const existing = db.prepare('SELECT * FROM Projects WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    db.prepare(
      `UPDATE Projects
       SET name = ?, description = ?, startDate = ?, endDate = ?, status = ?, managerId = ?
       WHERE id = ?`
    ).run(
      name,
      description || null,
      startDate || null,
      endDate || null,
      status || existing.status,
      managerId || existing.managerId,
      req.params.id
    );

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM Projects WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    const tx = db.transaction(() => {
      db.prepare('DELETE FROM BaselineSnapshots WHERE baselineId IN (SELECT id FROM Baselines WHERE projectId = ?)').run(req.params.id);
      db.prepare('DELETE FROM Baselines WHERE projectId = ?').run(req.params.id);
      db.prepare('DELETE FROM ProjectCalendars WHERE projectId = ?').run(req.params.id);
      db.prepare('DELETE FROM TaskDependencies WHERE projectId = ?').run(req.params.id);
      db.prepare('DELETE FROM TimeLog WHERE taskId IN (SELECT id FROM Tasks WHERE projectId = ?)').run(req.params.id);
      db.prepare('DELETE FROM Timer WHERE taskId IN (SELECT id FROM Tasks WHERE projectId = ?)').run(req.params.id);
      db.prepare('DELETE FROM Comments WHERE taskId IN (SELECT id FROM Tasks WHERE projectId = ?)').run(req.params.id);
      db.prepare('DELETE FROM Attachments WHERE taskId IN (SELECT id FROM Tasks WHERE projectId = ?)').run(req.params.id);
      db.prepare('DELETE FROM Notifications WHERE taskId IN (SELECT id FROM Tasks WHERE projectId = ?)').run(req.params.id);
      db.prepare('DELETE FROM Tasks WHERE projectId = ?').run(req.params.id);
      db.prepare('DELETE FROM Projects WHERE id = ?').run(req.params.id);
    });
    tx();

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:id/schedule', (req, res) => {
  try {
    // Phase 3 will implement CPM. For now, return current tasks dates.
    const db = getDb();

    if (req.user.role === 'member') {
      const assigned = db
        .prepare('SELECT 1 as ok FROM Tasks WHERE projectId = ? AND assigneeId = ? LIMIT 1')
        .get(req.params.id, req.user.id);
      if (!assigned) return res.status(403).json({ error: 'Forbidden' });
    }

    const tasks = db
      .prepare('SELECT id as taskId, startDate, dueDate, 0 as float, 0 as isCritical FROM Tasks WHERE projectId = ?')
      .all(req.params.id);

    return res.json(tasks.map((t) => ({ ...t, endDate: t.dueDate || null })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');

const { uuidv4 } = require('../db/helpers');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { seedProjectRisksFromTemplate } = require('../services/riskTemplateSeed');

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

function canAccessProjectRisks(req, projectId) {
  if (req.user.role === 'admin' || req.user.role === 'manager') return true;
  const db = getDb();
  const ok = db
    .prepare('SELECT 1 as x FROM Tasks WHERE projectId = ? AND assigneeId = ? LIMIT 1')
    .get(projectId, req.user.id);
  return Boolean(ok);
}

const RISK_COLS = [
  'srNo',
  'process',
  'typeOfRisk',
  'riskIdentified',
  'likelihood1',
  'consequence1',
  'rpn1',
  'controlsMitigation',
  'responsible',
  'timeFrame',
  'implementationStatus',
  'likelihood2',
  'consequence2',
  'rpn2',
  'acceptable',
  'remarks'
];

router.get('/:id/risks', (req, res) => {
  try {
    const db = getDb();
    const project = db.prepare('SELECT id FROM Projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!canAccessProjectRisks(req, req.params.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const rows = db
      .prepare(
        `SELECT id, projectId, srNo, process, typeOfRisk, riskIdentified,
         likelihood1, consequence1, rpn1, controlsMitigation, responsible, timeFrame,
         implementationStatus, likelihood2, consequence2, rpn2, acceptable, remarks,
         createdAt, updatedAt
         FROM ProjectRisks WHERE projectId = ? ORDER BY (CASE WHEN srNo GLOB '[0-9]*' THEN CAST(srNo AS INTEGER) ELSE 999999 END), srNo`
      )
      .all(req.params.id);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/:id/risks', requireRole('admin', 'manager'), (req, res) => {
  try {
    const db = getDb();
    const project = db.prepare('SELECT id FROM Projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const body = req.body || {};
    const now = new Date().toISOString();
    const id = uuidv4();
    const vals = {
      id,
      projectId: req.params.id,
      srNo: body.srNo != null ? String(body.srNo) : null,
      process: body.process != null ? String(body.process) : null,
      typeOfRisk: body.typeOfRisk != null ? String(body.typeOfRisk) : null,
      riskIdentified: body.riskIdentified != null ? String(body.riskIdentified) : null,
      likelihood1: body.likelihood1 != null ? String(body.likelihood1) : null,
      consequence1: body.consequence1 != null ? String(body.consequence1) : null,
      rpn1: body.rpn1 != null ? String(body.rpn1) : null,
      controlsMitigation: body.controlsMitigation != null ? String(body.controlsMitigation) : null,
      responsible: body.responsible != null ? String(body.responsible) : null,
      timeFrame: body.timeFrame != null ? String(body.timeFrame) : null,
      implementationStatus: body.implementationStatus != null ? String(body.implementationStatus) : null,
      likelihood2: body.likelihood2 != null ? String(body.likelihood2) : null,
      consequence2: body.consequence2 != null ? String(body.consequence2) : null,
      rpn2: body.rpn2 != null ? String(body.rpn2) : null,
      acceptable: body.acceptable != null ? String(body.acceptable) : null,
      remarks: body.remarks != null ? String(body.remarks) : null,
      createdAt: now,
      updatedAt: now
    };

    db.prepare(
      `INSERT INTO ProjectRisks (
        id, projectId, srNo, process, typeOfRisk, riskIdentified,
        likelihood1, consequence1, rpn1, controlsMitigation, responsible, timeFrame,
        implementationStatus, likelihood2, consequence2, rpn2, acceptable, remarks,
        createdAt, updatedAt
      ) VALUES (
        @id, @projectId, @srNo, @process, @typeOfRisk, @riskIdentified,
        @likelihood1, @consequence1, @rpn1, @controlsMitigation, @responsible, @timeFrame,
        @implementationStatus, @likelihood2, @consequence2, @rpn2, @acceptable, @remarks,
        @createdAt, @updatedAt
      )`
    ).run(vals);

    const row = db
      .prepare(
        `SELECT id, projectId, srNo, process, typeOfRisk, riskIdentified,
         likelihood1, consequence1, rpn1, controlsMitigation, responsible, timeFrame,
         implementationStatus, likelihood2, consequence2, rpn2, acceptable, remarks,
         createdAt, updatedAt FROM ProjectRisks WHERE id = ?`
      )
      .get(id);
    return res.status(201).json(row);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/risks/:riskId', requireRole('admin', 'manager'), (req, res) => {
  try {
    const db = getDb();
    const project = db.prepare('SELECT id FROM Projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const risk = db
      .prepare('SELECT id FROM ProjectRisks WHERE id = ? AND projectId = ?')
      .get(req.params.riskId, req.params.id);
    if (!risk) return res.status(404).json({ error: 'Risk row not found' });

    const body = req.body || {};
    const updates = {};
    for (const k of RISK_COLS) {
      if (body[k] !== undefined) updates[k] = body[k] == null ? null : String(body[k]);
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    updates.updatedAt = new Date().toISOString();
    const setClause = Object.keys(updates)
      .map((k) => `${k} = @${k}`)
      .join(', ');
    db.prepare(`UPDATE ProjectRisks SET ${setClause} WHERE id = @id`).run({
      ...updates,
      id: req.params.riskId
    });
    const row = db
      .prepare(
        `SELECT id, projectId, srNo, process, typeOfRisk, riskIdentified,
         likelihood1, consequence1, rpn1, controlsMitigation, responsible, timeFrame,
         implementationStatus, likelihood2, consequence2, rpn2, acceptable, remarks,
         createdAt, updatedAt FROM ProjectRisks WHERE id = ?`
      )
      .get(req.params.riskId);
    return res.json(row);
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

router.post('/', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { name, description, startDate, endDate, status, managerId, seedRisksFromTemplate } =
      req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });

    const db = getDb();
    const id = uuidv4();
    const mgr = managerId || req.user.id;

    db.prepare(
      `INSERT INTO Projects (id, name, description, startDate, endDate, status, managerId)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, name, description || null, startDate || null, endDate || null, status || 'active', mgr);

    if (seedRisksFromTemplate === true || seedRisksFromTemplate === 'true') {
      try {
        await seedProjectRisksFromTemplate(id);
      } catch (seedErr) {
        db.prepare('DELETE FROM ProjectRisks WHERE projectId = ?').run(id);
        db.prepare('DELETE FROM Projects WHERE id = ?').run(id);
        return res.status(500).json({
          error: seedErr.message || 'Failed to seed risk register from template'
        });
      }
    }

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
      db.prepare('DELETE FROM ProjectRisks WHERE projectId = ?').run(req.params.id);
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

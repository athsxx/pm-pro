const express = require('express');

const { uuidv4, toBoolInt } = require('../db/helpers');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

const router = express.Router();
router.use(authenticateToken);

function canMemberEditTask(task, userId) {
  return task && task.assigneeId === userId;
}

function memberSafeUpdate(body, existing) {
  // Members can only update limited fields.
  const allowed = {
    title: body.title,
    description: body.description,
    status: body.status,
    progress: body.progress,
    startDate: body.startDate,
  dueDate: body.dueDate ?? body.endDate,
    duration: body.duration,
    costPerHour: body.costPerHour,
    fixedCost: body.fixedCost
  };

  // Only apply if provided
  const next = { ...existing };
  for (const [k, v] of Object.entries(allowed)) {
    if (v !== undefined) next[k] = v;
  }
  return next;
}

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { assigneeId, projectId } = req.query;

    let rows;
    if (projectId) {
      rows = db.prepare('SELECT * FROM Tasks WHERE projectId = ? ORDER BY createdAt DESC').all(projectId);
    } else if (assigneeId) {
      rows = db.prepare('SELECT * FROM Tasks WHERE assigneeId = ? ORDER BY createdAt DESC').all(assigneeId);
    } else if (req.user.role === 'member') {
      rows = db.prepare('SELECT * FROM Tasks WHERE assigneeId = ? ORDER BY createdAt DESC').all(req.user.id);
    } else {
      rows = db.prepare('SELECT * FROM Tasks ORDER BY createdAt DESC').all();
    }

    // Response alias: endDate = dueDate
    return res.json(rows.map((t) => ({ ...t, endDate: t.dueDate || t.endDate || null })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/my', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM Tasks WHERE assigneeId = ? ORDER BY endDate ASC').all(req.user.id);
  return res.json(rows.map((t) => ({ ...t, endDate: t.dueDate || t.endDate || null })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const task = db.prepare('SELECT * FROM Tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role === 'member' && task.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

  return res.json({ ...task, endDate: task.dueDate || task.endDate || null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', requireRole('admin', 'manager'), (req, res) => {
  try {
    const body = req.body || {};
    const { projectId, title } = body;
    if (!projectId || !title) {
      return res.status(400).json({ error: 'projectId and title are required' });
    }

    const db = getDb();
    const id = uuidv4();

    db.prepare(
      `INSERT INTO Tasks (
        id, projectId, parentId, title, description, assigneeId, status, progress,
        startDate, endDate, dueDate, duration, schedulingMode, constraintType,
        isInactive, isRecurring, recurrencePattern,
        costPerHour, fixedCost, actualCost, baselineCost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      projectId,
      body.parentId || null,
      title,
      body.description || null,
      body.assigneeId || null,
      body.status || 'not_started',
      body.progress ?? 0,
      body.startDate || null,
      null,
      body.dueDate || body.endDate || null,
      body.duration ?? 1,
      body.schedulingMode || 'auto',
      body.constraintType || body.constraint || 'ASAP',
      toBoolInt(body.isInactive),
      toBoolInt(body.isRecurring),
      body.recurrencePattern ? JSON.stringify(body.recurrencePattern) : null,
      body.costPerHour ?? 0,
      body.fixedCost ?? 0,
      body.actualCost ?? 0,
      body.baselineCost ?? 0
    );

    req.app.get('io')?.emit('task:updated', { taskId: id, projectId });

    return res.status(201).json({ id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM Tasks WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const body = req.body || {};

    if (req.user.role === 'member') {
      if (!canMemberEditTask(existing, req.user.id)) return res.status(403).json({ error: 'Forbidden' });
      const next = memberSafeUpdate(body, existing);
      db.prepare(
  `UPDATE Tasks SET title = ?, description = ?, status = ?, progress = ?, startDate = ?, dueDate = ?, duration = ?, costPerHour = ?, fixedCost = ?
         WHERE id = ?`
      ).run(
        next.title,
        next.description,
        next.status,
        next.progress,
        next.startDate,
  (body.dueDate ?? body.endDate ?? existing.dueDate ?? existing.endDate ?? null),
        next.duration,
        next.costPerHour,
        next.fixedCost,
        req.params.id
      );

      req.app.get('io')?.emit('task:updated', { taskId: existing.id, projectId: existing.projectId });
      return res.json({ ok: true });
    }

    // Admin/manager full update
    const requiredTitle = body.title;
    if (!requiredTitle) return res.status(400).json({ error: 'title is required' });

    db.prepare(
      `UPDATE Tasks SET
        projectId = ?, parentId = ?, title = ?, description = ?, assigneeId = ?, status = ?, progress = ?,
        startDate = ?, dueDate = ?, duration = ?, schedulingMode = ?, constraintType = ?,
        isInactive = ?, isRecurring = ?, recurrencePattern = ?,
        costPerHour = ?, fixedCost = ?, actualCost = ?, baselineCost = ?
       WHERE id = ?`
    ).run(
      body.projectId || existing.projectId,
      body.parentId || null,
      requiredTitle,
      body.description || null,
      body.assigneeId || null,
      body.status || existing.status,
      body.progress ?? existing.progress,
      body.startDate || null,
      body.dueDate || body.endDate || existing.dueDate || existing.endDate || null,
      body.duration ?? existing.duration,
      body.schedulingMode || existing.schedulingMode,
      body.constraintType || body.constraint || existing.constraintType,
      toBoolInt(body.isInactive),
      toBoolInt(body.isRecurring),
      body.recurrencePattern ? JSON.stringify(body.recurrencePattern) : null,
      body.costPerHour ?? existing.costPerHour,
      body.fixedCost ?? existing.fixedCost,
      body.actualCost ?? existing.actualCost,
      body.baselineCost ?? existing.baselineCost,
      req.params.id
    );

    req.app.get('io')?.emit('task:updated', { taskId: existing.id, projectId: existing.projectId });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/progress', (req, res) => {
  try {
    const db = getDb();
    const task = db.prepare('SELECT * FROM Tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role === 'member' && !canMemberEditTask(task, req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { progress } = req.body || {};
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'progress must be between 0 and 100' });
    }

    db.prepare('UPDATE Tasks SET progress = ? WHERE id = ?').run(progress, req.params.id);
    req.app.get('io')?.emit('task:updated', { taskId: task.id, projectId: task.projectId });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', (req, res) => {
  try {
    const db = getDb();
    const task = db.prepare('SELECT * FROM Tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role === 'member' && !canMemberEditTask(task, req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: 'status is required' });

    db.prepare('UPDATE Tasks SET status = ? WHERE id = ?').run(status, req.params.id);
    req.app.get('io')?.emit('task:updated', { taskId: task.id, projectId: task.projectId });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/scheduling-mode', (req, res) => {
  try {
    if (req.user.role === 'member') return res.status(403).json({ error: 'Forbidden' });

    const { schedulingMode } = req.body || {};
    if (schedulingMode !== 'auto' && schedulingMode !== 'manual') {
      return res.status(400).json({ error: "schedulingMode must be 'auto' or 'manual'" });
    }

    const db = getDb();
    const task = db.prepare('SELECT * FROM Tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    db.prepare('UPDATE Tasks SET schedulingMode = ? WHERE id = ?').run(schedulingMode, req.params.id);
    req.app.get('io')?.emit('task:updated', { taskId: task.id, projectId: task.projectId });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/inactive', (req, res) => {
  try {
    if (req.user.role === 'member') return res.status(403).json({ error: 'Forbidden' });

    const { isInactive } = req.body || {};
    if (isInactive === undefined) return res.status(400).json({ error: 'isInactive is required' });

    const db = getDb();
    const task = db.prepare('SELECT * FROM Tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    db.prepare('UPDATE Tasks SET isInactive = ? WHERE id = ?').run(toBoolInt(isInactive), req.params.id);
    req.app.get('io')?.emit('task:updated', { taskId: task.id, projectId: task.projectId });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireRole('admin', 'manager'), (req, res) => {
  try {
    const db = getDb();
    const task = db.prepare('SELECT * FROM Tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const tx = db.transaction(() => {
      db.prepare('DELETE FROM Comments WHERE taskId = ?').run(task.id);
      db.prepare('DELETE FROM Attachments WHERE taskId = ?').run(task.id);
      db.prepare('DELETE FROM Notifications WHERE taskId = ?').run(task.id);
      db.prepare('DELETE FROM TimeLog WHERE taskId = ?').run(task.id);
      db.prepare('DELETE FROM Timer WHERE taskId = ?').run(task.id);
      db.prepare('DELETE FROM TaskDependencies WHERE predecessorId = ? OR successorId = ?').run(task.id, task.id);
      db.prepare('DELETE FROM Tasks WHERE id = ?').run(task.id);
    });
    tx();

    req.app.get('io')?.emit('task:updated', { taskId: task.id, projectId: task.projectId, deleted: true });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/:projectId/reschedule', requireRole('admin', 'manager'), (req, res) => {
  try {
    // Phase 3 will run CPM scheduler. For now, no-op.
    return res.json({ ok: true, scheduled: false });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Spec: POST /api/tasks/:id/time-log — { hours, note, loggedAt } — also updates task.actualCost
router.post('/:id/time-log', (req, res) => {
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
    const ts = loggedAt || new Date().toISOString();

    db.prepare('INSERT INTO TimeLog (id, taskId, userId, hours, note, loggedAt) VALUES (?, ?, ?, ?, ?, ?)').run(
      id,
      task.id,
      req.user.id,
      Number(hours),
      note || null,
      ts
    );

    const addCost = Number(hours) * Number(task.costPerHour || 0);
    db.prepare('UPDATE Tasks SET actualCost = COALESCE(actualCost, 0) + ? WHERE id = ?').run(addCost, task.id);

    req.app.get('io')?.emit('task:updated', { taskId: task.id, projectId: task.projectId });

    return res.status(201).json({ id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

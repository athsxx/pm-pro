const express = require('express');
const { getDb } = require('../db/database');
const { toBoolInt } = require('../db/helpers');

const router = express.Router();

function requireSyncSecret(req, res, next) {
  const secret = process.env.TASK_SYNC_SECRET;
  if (!secret || String(secret).length < 16) {
    return res.status(503).json({ error: 'TASK_SYNC_SECRET is not set (min 16 chars)' });
  }
  const sent = req.headers['x-task-sync-secret'];
  if (sent !== secret) {
    return res.status(401).json({ error: 'Invalid sync secret' });
  }
  next();
}

function mapAdminStatus(status) {
  const m = {
    todo: 'not_started',
    in_progress: 'in_progress',
    review: 'in_progress',
    done: 'done',
    blocked: 'blocked',
    cancelled: 'not_started',
  };
  return m[status] || 'not_started';
}

function recurrenceToString(rp) {
  if (rp == null) return null;
  if (typeof rp === 'string') return rp;
  try {
    return JSON.stringify(rp);
  } catch {
    return null;
  }
}

/** Drop FK refs so we can delete a user row (demo / re-sync after admin UUID changes). */
function clearReferencesToUserId(db, userId) {
  db.prepare('UPDATE Tasks SET assigneeId = NULL WHERE assigneeId = ?').run(userId);
  db.prepare('UPDATE Projects SET managerId = NULL WHERE managerId = ?').run(userId);
  db.prepare('DELETE FROM TimeLog WHERE userId = ?').run(userId);
  db.prepare('DELETE FROM Timer WHERE userId = ?').run(userId);
  db.prepare('DELETE FROM Comments WHERE userId = ?').run(userId);
  db.prepare('DELETE FROM Attachments WHERE userId = ?').run(userId);
  db.prepare('DELETE FROM Notifications WHERE userId = ?').run(userId);
  db.prepare('DELETE FROM MoodCheckins WHERE userId = ?').run(userId);
}

/** Same email, different id → would violate UNIQUE(email) on INSERT; remove stale row first. */
function removeStaleUsersWithEmail(db, email, canonicalId) {
  const rows = db.prepare('SELECT id FROM Users WHERE LOWER(email) = LOWER(?) AND id != ?').all(email, canonicalId);
  for (const { id } of rows) {
    clearReferencesToUserId(db, id);
    db.prepare('DELETE FROM Users WHERE id = ?').run(id);
  }
}

/**
 * POST /api/sync/upsert
 * Server-to-server: admin app mirrors a task (+ project + assignee user) into pm-pro's DB
 * so the mobile app (same UUIDs) sees assignments on GET /api/tasks/my.
 */
router.post('/upsert', requireSyncSecret, (req, res) => {
  try {
    const body = req.body || {};
    const { project, users = [], task } = body;

    if (!task || !task.id || !task.projectId || !task.title) {
      return res.status(400).json({ error: 'task.id, task.projectId, and task.title are required' });
    }
    if (!project || !project.id || !project.name) {
      return res.status(400).json({ error: 'project.id and project.name are required' });
    }

    const db = getDb();

    const run = () => {
      // Users first: Projects.managerId and Tasks.assigneeId reference Users.
      for (const u of users) {
        if (!u || !u.id || !u.email || !u.name) continue;
        const row = db.prepare('SELECT id FROM Users WHERE id = ?').get(u.id);
        const role = ['admin', 'manager', 'member'].includes(u.role) ? u.role : 'member';
        if (row) {
          removeStaleUsersWithEmail(db, u.email, u.id);
          db.prepare('UPDATE Users SET name = ?, email = ?, role = ? WHERE id = ?').run(
            u.name,
            u.email,
            role,
            u.id
          );
        } else {
          if (!u.password) {
            throw new Error(
              `User ${u.id} is missing in pm-pro; include "password" (bcrypt hash from admin DB) to create them`
            );
          }
          removeStaleUsersWithEmail(db, u.email, u.id);
          db.prepare(
            `INSERT INTO Users (id, name, email, password, role, createdAt)
             VALUES (?, ?, ?, ?, ?, datetime('now'))`
          ).run(u.id, u.name, u.email, u.password, role);
        }
      }

      db.prepare(
        `INSERT INTO Projects (id, name, description, startDate, endDate, status, managerId, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           description = COALESCE(excluded.description, Projects.description),
           startDate = COALESCE(excluded.startDate, Projects.startDate),
           endDate = COALESCE(excluded.endDate, Projects.endDate),
           status = COALESCE(excluded.status, Projects.status),
           managerId = COALESCE(excluded.managerId, Projects.managerId)`
      ).run(
        project.id,
        project.name,
        project.description ?? '',
        project.startDate || null,
        project.endDate || null,
        project.status || 'active',
        project.managerId || null
      );

      const assigneeId = task.assigneeId || null;
      if (assigneeId) {
        const ok = db.prepare('SELECT 1 AS o FROM Users WHERE id = ?').get(assigneeId);
        if (!ok) {
          throw new Error(
            `assigneeId ${assigneeId} not in pm-pro — include that user in the "users" array (with password if new)`
          );
        }
      }

      const st = mapAdminStatus(task.status);
      const existing = db.prepare('SELECT id FROM Tasks WHERE id = ?').get(task.id);

      if (existing) {
        db.prepare(
          `UPDATE Tasks SET
            projectId = ?, parentId = ?, title = ?, description = ?, assigneeId = ?, status = ?, progress = ?,
            remainingDays = ?, startDate = ?, dueDate = ?, duration = ?, schedulingMode = ?, constraintType = ?,
            isInactive = ?, isRecurring = ?, recurrencePattern = ?,
            costPerHour = ?, fixedCost = ?, actualCost = ?, baselineCost = ?
           WHERE id = ?`
        ).run(
          task.projectId,
          task.parentId || null,
          task.title,
          task.description || null,
          assigneeId,
          st,
          task.progress ?? 0,
          task.remainingDays ?? null,
          task.startDate || null,
          task.dueDate || null,
          task.duration ?? 1,
          task.schedulingMode || 'auto',
          task.constraintType || 'ASAP',
          toBoolInt(task.isInactive),
          toBoolInt(task.isRecurring),
          recurrenceToString(task.recurrencePattern),
          task.costPerHour ?? 0,
          task.fixedCost ?? 0,
          task.actualCost ?? 0,
          task.baselineCost ?? 0,
          task.id
        );
      } else {
        db.prepare(
          `INSERT INTO Tasks (
            id, projectId, parentId, title, description, assigneeId, status, progress,
            startDate, endDate, dueDate, duration, schedulingMode, constraintType,
            isInactive, isRecurring, recurrencePattern,
            costPerHour, fixedCost, actualCost, baselineCost
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          task.id,
          task.projectId,
          task.parentId || null,
          task.title,
          task.description || null,
          assigneeId,
          st,
          task.progress ?? 0,
          task.startDate || null,
          null,
          task.dueDate || null,
          task.duration ?? 1,
          task.schedulingMode || 'auto',
          task.constraintType || 'ASAP',
          toBoolInt(task.isInactive),
          toBoolInt(task.isRecurring),
          recurrenceToString(task.recurrencePattern),
          task.costPerHour ?? 0,
          task.fixedCost ?? 0,
          task.actualCost ?? 0,
          task.baselineCost ?? 0
        );
      }
    };

    db.transaction(run)();

    req.app.get('io')?.emit('task:updated', { taskId: task.id, projectId: task.projectId });

    res.json({ ok: true, id: task.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/sync/tasks/:id — remove mirrored task (e.g. admin soft-delete) */
router.delete('/tasks/:id', requireSyncSecret, (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM Tasks WHERE id = ?').run(req.params.id);
    req.app.get('io')?.emit('task:updated', { taskId: req.params.id, projectId: null });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

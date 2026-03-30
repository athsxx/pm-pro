/**
 * Push member task updates from pm-pro → ProjectManagementAPP (Sequelize) so admins
 * see status/progress/description and completion time (TaskCompletion).
 *
 * Env (pm-pro backend):
 *   ADMIN_API_URL=http://localhost:3002   (admin API origin, no trailing slash)
 *   TASK_SYNC_SECRET= same as PM_PRO_SYNC_SECRET on the admin backend
 */

function enabled() {
  const base = process.env.ADMIN_API_URL;
  const secret = process.env.TASK_SYNC_SECRET;
  return Boolean(base && secret && String(secret).length >= 16);
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {string} taskId
 * @param {string} userId - member who performed the action (JWT user id)
 */
async function mirrorMemberTaskToAdmin(db, taskId, userId) {
  if (!enabled()) return;
  const base = process.env.ADMIN_API_URL.replace(/\/$/, '');
  const row = db.prepare('SELECT * FROM Tasks WHERE id = ?').get(taskId);
  if (!row) return;

  const body = {
    taskId,
    userId,
    status: row.status,
    progress: row.progress,
    description: row.description,
  };
  if (row.status === 'done') {
    body.completedAt = new Date().toISOString();
  }

  try {
    const res = await fetch(`${base}/api/sync/member-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Task-Sync-Secret': process.env.TASK_SYNC_SECRET,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[admin mirror]', res.status, text);
    }
  } catch (err) {
    console.error('[admin mirror]', err.message);
  }
}

module.exports = { mirrorMemberTaskToAdmin, enabled };

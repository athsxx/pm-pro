const express = require('express');

const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/evm', (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    // Phase 3 will implement actual EVM. For now return a simple cost/progress snapshot.
    const db = getDb();

    if (req.user.role === 'member') {
      const assigned = db
        .prepare('SELECT 1 as ok FROM Tasks WHERE projectId = ? AND assigneeId = ? LIMIT 1')
        .get(projectId, req.user.id);
      if (!assigned) return res.status(403).json({ error: 'Forbidden' });
    }

    const tasks = db
      .prepare('SELECT id, title, progress, baselineCost, actualCost FROM Tasks WHERE projectId = ?')
      .all(projectId);

    const totals = tasks.reduce(
      (acc, t) => {
        const pv = Number(t.baselineCost || 0);
        const ev = pv * (Number(t.progress || 0) / 100);
        const ac = Number(t.actualCost || 0);
        acc.PV += pv;
        acc.EV += ev;
        acc.AC += ac;
        return acc;
      },
      { PV: 0, EV: 0, AC: 0 }
    );

    const CPI = totals.AC > 0 ? totals.EV / totals.AC : null;
    const SPI = totals.PV > 0 ? totals.EV / totals.PV : null;

    return res.json({
      kpis: {
        PV: totals.PV,
        EV: totals.EV,
        AC: totals.AC,
        CPI,
        SPI
      },
      scurve: [],
      taskBreakdown: tasks.map((t) => ({
        taskId: t.id,
        name: t.title,
        PV: Number(t.baselineCost || 0),
        EV: Number(t.baselineCost || 0) * (Number(t.progress || 0) / 100),
        AC: Number(t.actualCost || 0)
      }))
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/cost-summary', (req, res) => {
  try {
    const db = getDb();
    const row = db
      .prepare('SELECT SUM(baselineCost) as baseline, SUM(actualCost) as actual FROM Tasks')
      .get();
    return res.json({ baseline: Number(row.baseline || 0), actual: Number(row.actual || 0) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/cost-by-resource', (req, res) => {
  try {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT u.id as userId, u.name, u.email, SUM(t.actualCost) as actualCost
         FROM Tasks t
         LEFT JOIN Users u ON u.id = t.assigneeId
         GROUP BY u.id, u.name, u.email
         ORDER BY actualCost DESC`
      )
      .all();
    return res.json(
      rows.map((r) => ({
        userId: r.userId,
        name: r.name,
        email: r.email,
        actualCost: Number(r.actualCost || 0)
      }))
    );
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

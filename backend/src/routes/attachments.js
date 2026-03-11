const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { uuidv4 } = require('../db/helpers');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});

const upload = multer({ storage });

const router = express.Router();
router.use(authenticateToken);

router.post('/', upload.single('file'), (req, res) => {
  try {
    const { taskId } = req.body || {};
    if (!taskId) return res.status(400).json({ error: 'taskId is required' });
    if (!req.file) return res.status(400).json({ error: 'file is required' });

    const db = getDb();
    const task = db.prepare('SELECT * FROM Tasks WHERE id = ?').get(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role === 'member' && task.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO Attachments (id, taskId, userId, filename, filepath, mimetype, size) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      taskId,
      req.user.id,
      req.file.originalname,
      req.file.path,
      req.file.mimetype,
      req.file.size
    );

    return res.status(201).json({ id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    const { taskId } = req.query;
    if (!taskId) return res.status(400).json({ error: 'taskId is required' });

    const db = getDb();
    const task = db.prepare('SELECT * FROM Tasks WHERE id = ?').get(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role === 'member' && task.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const rows = db
      .prepare(
        `SELECT a.*, u.name as userName, u.email as userEmail
         FROM Attachments a
         LEFT JOIN Users u ON u.id = a.userId
         WHERE a.taskId = ?
         ORDER BY a.uploadedAt DESC`
      )
      .all(taskId);

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const att = db.prepare('SELECT * FROM Attachments WHERE id = ?').get(req.params.id);
    if (!att) return res.status(404).json({ error: 'Attachment not found' });

    if (req.user.role === 'member' && att.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    db.prepare('DELETE FROM Attachments WHERE id = ?').run(req.params.id);

    try {
      if (att.filepath && fs.existsSync(att.filepath)) fs.unlinkSync(att.filepath);
    } catch (_) {
      // ignore file delete errors
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

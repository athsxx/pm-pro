require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const { initDatabase } = require('./db/database');

// Jobs (wired in Phase 3, but we boot safely even if they are stubs)
let startRecurringJob;
let startDeadlineReminderJob;
try {
  ({ startRecurringJob } = require('./jobs/recurring'));
} catch (_) {
  startRecurringJob = null;
}
try {
  ({ startDeadlineReminderJob } = require('./jobs/deadlineReminder'));
} catch (_) {
  startDeadlineReminderJob = null;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Ensure DB ready early
initDatabase();

// Mount routes (Phase 2 will implement the files; for now mount if present)
const routeModules = [
  ['auth', './routes/auth'],
  ['projects', './routes/projects'],
  ['tasks', './routes/tasks'],
  ['comments', './routes/comments'],
  ['attachments', './routes/attachments'],
  ['notifications', './routes/notifications'],
  ['timer', './routes/timer'],
  ['timelog', './routes/timelog'],
  ['baselines', './routes/baselines'],
  ['calendar', './routes/calendar'],
  ['reports', './routes/reports'],
  ['mood', './routes/mood']
];

for (const [name, modulePath] of routeModules) {
  try {
    const router = require(modulePath);
    app.use(`/api/${name}`, router);
  } catch (err) {
    // Route will be added in later phases
  }
}

// Spec-compatible mounts (frontend should use these)
try {
  const baselinesRouter = require('./routes/baselines');
  app.use('/api/projects/:id/baselines', baselinesRouter);
} catch (_) {}

try {
  const calendarRouter = require('./routes/calendar');
  app.use('/api/projects/:id/calendar', calendarRouter);
} catch (_) {}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Global error handler (Phase 6 will expand)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

const port = Number(process.env.PORT || 3001);
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' }
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('disconnect', () => {});
});

// Start cron jobs if implemented
if (typeof startRecurringJob === 'function') {
  startRecurringJob({ io });
}
if (typeof startDeadlineReminderJob === 'function') {
  startDeadlineReminderJob({ io });
}

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`PM Pro backend listening on http://localhost:${port}`);
});

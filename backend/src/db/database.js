const path = require('path');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { ensureTablesForPhase2 } = require('./helpers');

let db;

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

function initDatabase() {
  const dbPathFromEnv = process.env.DB_PATH || './pm-pro.db';
  const dbFilePath = path.isAbsolute(dbPathFromEnv)
    ? dbPathFromEnv
    : path.join(process.cwd(), dbPathFromEnv);

  db = new Database(dbFilePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables(db);
  ensureTablesForPhase2(db);
  seedIfEmpty(db);

  return db;
}

function createTables(dbConn) {
  dbConn.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      costRate REAL DEFAULT 0,
      overtimeRate REAL DEFAULT 0,
      maxUnits REAL DEFAULT 1,
      deviceToken TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      startDate TEXT,
      endDate TEXT,
      status TEXT DEFAULT 'active',
      managerId TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (managerId) REFERENCES Users(id)
    );

    CREATE TABLE IF NOT EXISTS Tasks (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      parentId TEXT,
      title TEXT NOT NULL,
      description TEXT,
      assigneeId TEXT,
      status TEXT DEFAULT 'not_started',
      progress INTEGER DEFAULT 0,
      startDate TEXT,
  endDate TEXT,
  dueDate TEXT,
      duration INTEGER DEFAULT 1,
      schedulingMode TEXT DEFAULT 'auto',
  constraintType TEXT DEFAULT 'ASAP',
      isInactive INTEGER DEFAULT 0,
      isRecurring INTEGER DEFAULT 0,
      recurrencePattern TEXT,
      costPerHour REAL DEFAULT 0,
      fixedCost REAL DEFAULT 0,
      actualCost REAL DEFAULT 0,
      baselineCost REAL DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES Projects(id),
      FOREIGN KEY (assigneeId) REFERENCES Users(id)
    );

    CREATE TABLE IF NOT EXISTS Baselines (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      baselineNumber INTEGER NOT NULL,
      name TEXT,
      savedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(projectId, baselineNumber),
      FOREIGN KEY (projectId) REFERENCES Projects(id)
    );

    CREATE TABLE IF NOT EXISTS BaselineSnapshots (
      id TEXT PRIMARY KEY,
      baselineId TEXT NOT NULL,
      taskId TEXT NOT NULL,
      startDate TEXT,
      endDate TEXT,
      duration INTEGER,
      progress INTEGER,
      cost REAL,
      FOREIGN KEY (baselineId) REFERENCES Baselines(id),
      FOREIGN KEY (taskId) REFERENCES Tasks(id)
    );

    CREATE TABLE IF NOT EXISTS ProjectCalendars (
      id TEXT PRIMARY KEY,
      projectId TEXT UNIQUE NOT NULL,
      name TEXT,
      workDays TEXT DEFAULT '1,2,3,4,5',
      workHoursPerDay INTEGER DEFAULT 8,
      holidays TEXT DEFAULT '[]',
      FOREIGN KEY (projectId) REFERENCES Projects(id)
    );

    CREATE TABLE IF NOT EXISTS TimeLog (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      userId TEXT NOT NULL,
      hours REAL NOT NULL,
      note TEXT,
      loggedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES Tasks(id),
      FOREIGN KEY (userId) REFERENCES Users(id)
    );

    CREATE TABLE IF NOT EXISTS Timer (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      userId TEXT NOT NULL,
      startedAt TEXT NOT NULL,
      stoppedAt TEXT,
      hours REAL,
      FOREIGN KEY (taskId) REFERENCES Tasks(id),
      FOREIGN KEY (userId) REFERENCES Users(id)
    );

    CREATE TABLE IF NOT EXISTS Comments (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      userId TEXT NOT NULL,
      text TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES Tasks(id),
      FOREIGN KEY (userId) REFERENCES Users(id)
    );

    CREATE TABLE IF NOT EXISTS Attachments (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      userId TEXT NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      mimetype TEXT,
      size INTEGER,
      uploadedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES Tasks(id),
      FOREIGN KEY (userId) REFERENCES Users(id)
    );

    CREATE TABLE IF NOT EXISTS Notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT,
      title TEXT,
      body TEXT,
      taskId TEXT,
      isRead INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES Users(id)
    );

    CREATE TABLE IF NOT EXISTS MoodCheckins (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      mood TEXT NOT NULL,
      note TEXT,
      checkedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES Users(id)
    );
  `);

  // Non-destructive migration: ensure dueDate exists for older DBs.
  try {
    const cols = dbConn.prepare("PRAGMA table_info('Tasks')").all();
    const hasDueDate = cols.some((c) => c.name === 'dueDate');
    if (!hasDueDate) {
      dbConn.exec('ALTER TABLE Tasks ADD COLUMN dueDate TEXT');
      // Backfill dueDate from endDate.
      dbConn.exec('UPDATE Tasks SET dueDate = endDate WHERE dueDate IS NULL');
    }
  } catch (_) {
    // ignore migration failures (fresh DBs will already have the column)
  }
}

function seedIfEmpty(dbConn) {
  const row = dbConn.prepare('SELECT COUNT(*) as count FROM Users').get();
  if (row && row.count > 0) return;

  const now = new Date().toISOString();

  const adminId = uuidv4();
  const aliceId = uuidv4();

  const insertUser = dbConn.prepare(
    `INSERT INTO Users (id, name, email, password, role, costRate, overtimeRate, maxUnits, deviceToken, createdAt)
     VALUES (@id, @name, @email, @password, @role, @costRate, @overtimeRate, @maxUnits, @deviceToken, @createdAt)`
  );

  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const alicePasswordHash = bcrypt.hashSync('password123', 10);

  const tx = dbConn.transaction(() => {
    insertUser.run({
      id: adminId,
      name: 'Admin',
      email: 'admin@projectmanager.com',
      password: adminPasswordHash,
      role: 'admin',
      costRate: 120,
      overtimeRate: 180,
      maxUnits: 1,
      deviceToken: null,
      createdAt: now
    });

    insertUser.run({
      id: aliceId,
      name: 'Alice',
      email: 'alice@team.com',
      password: alicePasswordHash,
      role: 'member',
      costRate: 60,
      overtimeRate: 90,
      maxUnits: 1,
      deviceToken: null,
      createdAt: now
    });

    const insertProject = dbConn.prepare(
      `INSERT INTO Projects (id, name, description, startDate, endDate, status, managerId, createdAt)
       VALUES (@id, @name, @description, @startDate, @endDate, @status, @managerId, @createdAt)`
    );

    const p1 = { id: uuidv4(), name: 'Website Relaunch', description: 'Q2 marketing site refresh', startDate: daysFromNowISO(0), endDate: daysFromNowISO(45), status: 'active', managerId: adminId, createdAt: now };
    const p2 = { id: uuidv4(), name: 'Mobile App MVP', description: 'Internal beta for field team', startDate: daysFromNowISO(0), endDate: daysFromNowISO(60), status: 'active', managerId: adminId, createdAt: now };

    insertProject.run(p1);
    insertProject.run(p2);

    // Default calendars
    const insertCalendar = dbConn.prepare(
      `INSERT INTO ProjectCalendars (id, projectId, name, workDays, workHoursPerDay, holidays)
       VALUES (@id, @projectId, @name, @workDays, @workHoursPerDay, @holidays)`
    );
    insertCalendar.run({ id: uuidv4(), projectId: p1.id, name: 'Default', workDays: '1,2,3,4,5', workHoursPerDay: 8, holidays: '[]' });
    insertCalendar.run({ id: uuidv4(), projectId: p2.id, name: 'Default', workDays: '1,2,3,4,5', workHoursPerDay: 8, holidays: '[]' });

    const insertTask = dbConn.prepare(
      `INSERT INTO Tasks (
        id, projectId, parentId, title, description, assigneeId, status, progress,
  startDate, endDate, dueDate, duration, schedulingMode, constraintType, isInactive, isRecurring, recurrencePattern,
        costPerHour, fixedCost, actualCost, baselineCost, createdAt
      ) VALUES (
        @id, @projectId, @parentId, @title, @description, @assigneeId, @status, @progress,
  @startDate, @endDate, @dueDate, @duration, @schedulingMode, @constraintType, @isInactive, @isRecurring, @recurrencePattern,
        @costPerHour, @fixedCost, @actualCost, @baselineCost, @createdAt
      )`
    );

    const statuses = [
      { status: 'not_started', progress: 0 },
      { status: 'in_progress', progress: 20 },
      { status: 'in_progress', progress: 55 },
      { status: 'blocked', progress: 10 },
      { status: 'done', progress: 100 }
    ];

    const makeTasksForProject = (project, offsetDays) => {
      for (let i = 1; i <= 5; i++) {
        const s = statuses[(i - 1) % statuses.length];
        const start = daysFromNowISO(offsetDays + (i - 1) * 3);
        const duration = 3;
        const end = daysFromNowISO(offsetDays + (i - 1) * 3 + duration);
        const baselineCost = 300 * i;
        const actualCost = s.progress > 0 ? baselineCost * (s.progress / 100) * 1.05 : 0;

        insertTask.run({
          id: uuidv4(),
          projectId: project.id,
          parentId: null,
          title: `Task ${i}: ${project.name}`,
          description: `Demo task ${i} for ${project.name}`,
          assigneeId: aliceId,
          status: s.status,
          progress: s.progress,
          startDate: start,
          endDate: null,
          dueDate: end,
          duration,
          schedulingMode: 'auto',
          constraintType: 'ASAP',
          isInactive: 0,
          isRecurring: 0,
          recurrencePattern: null,
          costPerHour: 60,
          fixedCost: 50,
          actualCost,
          baselineCost,
          createdAt: now
        });
      }
    };

    makeTasksForProject(p1, 0);
    makeTasksForProject(p2, 5);
  });

  tx();
}

function daysFromNowISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

module.exports = {
  initDatabase,
  getDb
};

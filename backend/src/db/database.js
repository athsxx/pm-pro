const path = require('path');
const Database = require('better-sqlite3');
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

    CREATE TABLE IF NOT EXISTS ProjectRisks (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      srNo TEXT,
      process TEXT,
      typeOfRisk TEXT,
      riskIdentified TEXT,
      likelihood1 TEXT,
      consequence1 TEXT,
      rpn1 TEXT,
      controlsMitigation TEXT,
      responsible TEXT,
      timeFrame TEXT,
      implementationStatus TEXT,
      likelihood2 TEXT,
      consequence2 TEXT,
      rpn2 TEXT,
      acceptable TEXT,
      remarks TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES Projects(id) ON DELETE CASCADE
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
  remainingDays REAL,
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

    const hasRemainingDays = cols.some((c) => c.name === 'remainingDays');
    if (!hasRemainingDays) {
      dbConn.exec('ALTER TABLE Tasks ADD COLUMN remainingDays REAL');
      // Default to duration for in-progress tasks when available.
      dbConn.exec("UPDATE Tasks SET remainingDays = COALESCE(remainingDays, duration) WHERE status = 'in_progress' AND remainingDays IS NULL");
    }
  } catch (_) {
    // ignore migration failures (fresh DBs will already have the column)
  }
}

const POC_SEED_USER_IDS = [
  'a0000001-0001-4001-8001-000000000001',
  'a0000001-0001-4001-8001-000000000002',
  'a0000001-0001-4001-8001-000000000003',
  'a0000001-0001-4001-8001-000000000004',
  'a0000001-0001-4001-8001-000000000005',
  'a0000001-0001-4001-8001-000000000006',
  'a0000001-0001-4001-8001-000000000007',
  'a0000001-0001-4001-8001-000000000008',
];

function seedIfEmpty(dbConn) {
  const row = dbConn.prepare('SELECT COUNT(*) as count FROM Users').get();
  if (row && row.count > 0) return;

  const now = new Date().toISOString();
  const plain = process.env.POC_DEFAULT_PASSWORD || 'pocchangeme';
  const passwordHash = bcrypt.hashSync(plain, 10);

  const insertUser = dbConn.prepare(
    `INSERT INTO Users (id, name, email, password, role, costRate, overtimeRate, maxUnits, deviceToken, createdAt)
     VALUES (@id, @name, @email, @password, @role, @costRate, @overtimeRate, @maxUnits, @deviceToken, @createdAt)`
  );

  const seeds = [
    {
      id: POC_SEED_USER_IDS[0],
      name: 'Admin Person 1',
      email: 'admin1@poc.local',
      role: 'admin',
      costRate: 120,
      overtimeRate: 180,
      maxUnits: 1,
    },
    {
      id: POC_SEED_USER_IDS[1],
      name: 'Manager Person 1',
      email: 'manager1@poc.local',
      role: 'manager',
      costRate: 100,
      overtimeRate: 150,
      maxUnits: 1,
    },
    ...[1, 2, 3, 4, 5, 6].map((n) => ({
      id: POC_SEED_USER_IDS[n + 1],
      name: `Member Person ${n}`,
      email: `member${n}@poc.local`,
      role: 'member',
      costRate: 80,
      overtimeRate: 120,
      maxUnits: 1,
    })),
  ];

  dbConn.transaction(() => {
    for (const u of seeds) {
      insertUser.run({
        ...u,
        password: passwordHash,
        deviceToken: null,
        createdAt: now,
      });
    }
  })();
}

module.exports = {
  initDatabase,
  getDb
};

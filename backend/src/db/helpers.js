const { v4: uuidv4 } = require('uuid');

function toBoolInt(v) {
  return v ? 1 : 0;
}

function parseJsonMaybe(value, fallback) {
  if (value == null) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function ensureTablesForPhase2(db) {
  if (!db) throw new Error('ensureTablesForPhase2(db) requires a db connection');
  db.exec(`
    CREATE TABLE IF NOT EXISTS TaskDependencies (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      predecessorId TEXT NOT NULL,
      successorId TEXT NOT NULL,
      type TEXT DEFAULT 'FS',
      lag INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES Projects(id),
      FOREIGN KEY (predecessorId) REFERENCES Tasks(id),
      FOREIGN KEY (successorId) REFERENCES Tasks(id)
    );
  `);
}

module.exports = {
  uuidv4,
  toBoolInt,
  parseJsonMaybe,
  nowIso,
  ensureTablesForPhase2
};

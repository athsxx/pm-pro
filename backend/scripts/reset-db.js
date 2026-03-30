require('dotenv').config();

const fs = require('fs');
const path = require('path');

const dbPathFromEnv = process.env.DB_PATH || './pm-pro.db';
const dbFilePath = path.isAbsolute(dbPathFromEnv)
  ? dbPathFromEnv
  : path.join(process.cwd(), dbPathFromEnv);

const paths = [dbFilePath, `${dbFilePath}-wal`, `${dbFilePath}-shm`];

for (const p of paths) {
  try {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log('removed', p);
    }
  } catch (err) {
    console.error('failed to remove', p, err.message);
    process.exit(1);
  }
}

console.log('database files cleared');

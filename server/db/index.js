import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store database file in server/data/pos.sqlite
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbFilePath = path.join(dataDir, 'pos.sqlite');

let SQL = null;
let db = null;
let isInitialized = false;

// Debounce save to disk to maximize performance while ensuring persistence
let saveTimeout = null;
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    forceSave();
  }, 100);
}

export function forceSave() {
  if (!db) return;
  try {
    const binaryArray = db.export();
    const buffer = Buffer.from(binaryArray);
    fs.writeFileSync(dbFilePath, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

export async function getDb() {
  if (isInitialized && db) {
    return dbInterface;
  }

  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (fs.existsSync(dbFilePath)) {
    try {
      const fileBuffer = fs.readFileSync(dbFilePath);
      db = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('Error reading existing database file, creating fresh one:', err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON;');
  isInitialized = true;

  // Persist immediately if created
  if (!fs.existsSync(dbFilePath)) {
    forceSave();
  }

  return dbInterface;
}

export const dbInterface = {
  getRawDb: () => db,

  run: (sql, params = []) => {
    if (!db) throw new Error('Database not initialized');
    // Ensure params is array or object
    const paramList = Array.isArray(params) ? params : [params];
    const stmt = db.prepare(sql);
    stmt.run(paramList);
    stmt.free();

    // In SQLite, get last inserted id & changes
    const lastIdRes = db.exec('SELECT last_insert_rowid() as id, changes() as count;');
    let lastInsertRowid = 0;
    let changes = 0;
    if (lastIdRes.length > 0 && lastIdRes[0].values.length > 0) {
      lastInsertRowid = lastIdRes[0].values[0][0];
      changes = lastIdRes[0].values[0][1];
    }
    scheduleSave();
    return { lastInsertRowid, changes };
  },

  query: (sql, params = []) => {
    if (!db) throw new Error('Database not initialized');
    const paramList = Array.isArray(params) ? params : [params];
    const stmt = db.prepare(sql);
    stmt.bind(paramList);

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  },

  get: (sql, params = []) => {
    if (!db) throw new Error('Database not initialized');
    const paramList = Array.isArray(params) ? params : [params];
    const stmt = db.prepare(sql);
    stmt.bind(paramList);

    let row = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();
    return row;
  },

  exec: (sql) => {
    if (!db) throw new Error('Database not initialized');
    const res = db.exec(sql);
    scheduleSave();
    return res;
  },

  transaction: (callback) => {
    if (!db) throw new Error('Database not initialized');
    db.run('BEGIN TRANSACTION;');
    try {
      const result = callback(dbInterface);
      db.run('COMMIT;');
      scheduleSave();
      return result;
    } catch (err) {
      db.run('ROLLBACK;');
      throw err;
    }
  },

  forceSave
};

export default dbInterface;

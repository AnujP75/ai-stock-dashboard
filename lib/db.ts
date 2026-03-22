import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Open static database
const db = new Database(path.join(dataDir, 'historical.db'));

// Initialize table
db.exec(`
  CREATE TABLE IF NOT EXISTS historical_data (
    ticker TEXT,
    date TEXT,
    close REAL,
    PRIMARY KEY (ticker, date)
  )
`);

export default db;

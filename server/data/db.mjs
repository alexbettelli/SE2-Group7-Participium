import sqlite from 'sqlite3'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.db');

const db = new sqlite.Database(dbPath, (err) => {
    if (err) throw err;
});

export default db;
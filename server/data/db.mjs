import sqlite from 'sqlite3'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isTestEnvironment = process.env.NODE_ENV === 'test';

const dbPath = isTestEnvironment 
  ? ':memory:' 
  : path.join(__dirname, 'database.db');



const db = new sqlite.Database(dbPath, (err) => {
    if (err) throw err;
    if (isTestEnvironment) {
        console.log('Using in-memory database for testing');
    }else{
        console.log('Connected to the SQLite database.');
    }
});

export default db;
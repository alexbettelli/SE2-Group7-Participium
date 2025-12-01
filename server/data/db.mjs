import sqlite from 'sqlite3'

export default db = new sqlite.Database('./database.db', (err) => {
    if (err) throw err;
})
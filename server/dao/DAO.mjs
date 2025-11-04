import sqlite from 'sqlite3'

const db = new sqlite.Database('./database.db', (err) => {
    if(err) throw err;
})
import sqlite from 'sqlite3'
import { User } from '../model/model.mjs';

const db = new sqlite.Database('./database.db', (err) => {
    if(err) throw err;
})


const addNewUser = (data) => {
    return new Promise((resolve, reject) => {
        const insertUsertSql = `
        INSERT INTO user (username, password, email, firstName, lastName, typeId) 
        VALUES ( ?, ?, ?, ?, ?, ?)
        `;
        
        console.log(data);
        console.log("Adding new user to the database...");
        db.run(insertUsertSql, 
            [data.username, data.password, data.email, data.firstName, data.lastName, data.typeId], 
            function (err) {
                if (err) return reject(err);            
                resolve(this.lastID);
            }
        ) 
    });    
}



const getUnassignedEmployees = () => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM user WHERE typeId = 5`; // typeId 5 = unassigned employee
        db.all(query, [], (err, rows) => {
            if (err) {
                return reject(err);
            }
            const employees = rows.map(row => new User(
                row.id,
                row.username,
                row.email,
                row.firstName,
                row.lastName,
                row.typeId,
                row.allowEmailNotification,
                row.telegramUsername,
                row.imageUrl
            ));
            resolve(employees);
        });
    });
}

const getUserByUsername = (username) => {
    return new Promise((res, rej) => {
        
        const query = `SELECT * FROM user WHERE username = ?`;
        db.get(query, [username], (err, row) => {
            if (err) {
                return rej(err);
            }
            if (row === undefined) {
                return res(null);
            } else {                
                const user = new User(
                    row.id,
                    row.username,
                    row.email,
                    row.firstName,
                    row.lastName,
                    row.typeId,
                    row.allowEmailNotification,
                    row.telegramUsername,
                    row.imageUrl
                );
                const password = row.password;
                const userInfo = {user, password}

                res(userInfo);    
            }
        });
    });
}

const DAO = {getUserByUsername, getUnassignedEmployees, addNewUser};

export default DAO
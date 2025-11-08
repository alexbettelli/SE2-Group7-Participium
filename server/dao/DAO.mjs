import sqlite from 'sqlite3'
import dayjs from 'dayjs';
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
        
        db.run(insertUsertSql, 
            [data.username, data.password, data.email, data.firstName, data.lastName, data.typeId], 
            function (err) {
                if (err) return reject(err);            
                resolve(this.lastID);
            }
        ) 
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

// REPORT

const addNewReport = (report) => {
    return new Promise((resolve, reject) => {
        db.run('BEGIN TRANSACTION');

        const now = dayjs().toString();

        const query1 = 'INSERT INTO Report (title, description, latitude, longitude, address, userId, catId, statusId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)' 
        const params1 = [ report.title, report.description, report.latitude, report.longitude, report.address, report.userId, report.catId, 1, now  ]
        db.run(query1, params1, function(err){
            if(err){
                reject(err);
                db.run('ROLLBACK');
            }
            report.id = this.lastID;
    
            for(let i=0; i<report.images.length; i++){
                const query2 = 'INSERT INTO report_image (reportId, imageUrl, uploadedAt) VALUES (?, ?, ?)'
                const params2 = [ report.id, `http://localhost:3001/images/reports/${report.id}/${report.images[i]}`, now ]
                db.run(query2, params2, function(err){
                    if(err){
                        db.run('ROLLBACK');
                        reject(err);
                    }

                    db.run('COMMIT', function(err){
                        if(err) reject(err);
                        resolve(report);
                    });
                })
            }
        });


    });

}

const DAO = {getUserByUsername, addNewUser, addNewReport}

export default DAO
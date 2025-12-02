import db from '../data/db.mjs';
import Mapper from '../utils/mapper.mjs'

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
                const user = Mapper.mapRowToUser(row);
                const password = row.password;
                const userInfo = { user, password }
                res(userInfo);
            }
        });
    });
}
const getUnassignedEmployees = () => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM user WHERE typeId = 5`; // typeId 5 = unassigned employee
        db.all(query, [], (err, rows) => {
            if (err) {
                return reject(err);
            }
            const employees = Mapper.mapRowsToUsers(rows);
            resolve(employees);
        });
    });
}
const assignEmployeeToOffice = (employeeId, officeId, roleId) => {
    return new Promise((resolve, reject) => {
        const updateUser = `
        UPDATE user
        SET typeId = ? 
        WHERE id = ?
        `;
        db.run(updateUser, [roleId, employeeId], function (err) {
            if (err) {
                return reject(err);
            }
            else if (roleId == 4) {
                const insertEmployeeOffice = `
              INSERT INTO office_employee (officeId, userId)
              VALUES (?, ?)
              `;
                db.run(insertEmployeeOffice, [officeId, employeeId], function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
}
const deleteEmployeeById = (employeeId) => {
    return new Promise((resolve, reject) => {
        const deleteUserSql = `
        DELETE FROM user WHERE id = ?
        `;
        db.run(deleteUserSql, [employeeId], function (err) {
            if (err) {
                return reject(err);
            }
            db.run("DELETE FROM office_employee WHERE userId = ?", [employeeId], function (err) {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}
const updateUserProfile = (userId, telegramUsername, allowEmailNotification, imageUrl) => {
    return new Promise((resolve, reject) => {
        const sql = `
      UPDATE user 
      SET telegramUsername = ?, 
          allowEmailNotification = ?, 
          imageUrl = ?
      WHERE id = ?
    `;

        db.run(sql, [
            telegramUsername,
            allowEmailNotification ? 1 : 0,
            imageUrl,
            userId
        ], function (err) {
            if (err) {
                console.error('Error updating user profile:', err);
                return reject(err);
            }
            getUserById(userId)
                .then(user => resolve(user))
                .catch(err => reject(err));
        });
    });
};
const getUserById = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = `
      SELECT *
      FROM user 
      WHERE id = ?
    `;
        db.get(sql, [userId], (err, row) => {
            if (err) {
                console.error('Error getting user by id:', err);
                reject(err);
            } else {
                const user = Mapper.mapRowToUser(row);
                resolve(user);
            }
        });
    });
};
/* const getUsernameByUserId = (userId) => {    
    return new Promise((resolve, reject) => {
        const query = `SELECT username FROM user WHERE id = ?`;
        db.get(query, [userId], (err, row) => {
            if (err) return reject(err);
            if (!row) return resolve(null);
            resolve(row.username);
        });
    });
}; */

const UserDAO = {
    addNewUser,
    getUserByUsername,
    getUserById,
    getUnassignedEmployees,
    assignEmployeeToOffice,
    deleteEmployeeById,
    updateUserProfile
};
export default UserDAO;

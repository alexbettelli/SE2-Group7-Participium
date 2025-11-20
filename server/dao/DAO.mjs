import sqlite from 'sqlite3'
import dayjs from 'dayjs';
import { User, Report, Message } from '../model/model.mjs';

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

const getOffices = () => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM office`;
        db.all(query, [], (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

const getRoles = () => {
  return new Promise((resolve,reject) => {
      const query = `SELECT * FROM user_type 
      Where id IN (3,4)`; //  3 = public relations, 4 = technician
      db.all(query, [], (err, rows) => {
          if (err) {
              return reject(err);
          }
          console.log(rows);
          resolve(rows);
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

const getUsernameByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT username FROM user WHERE id = ?`;
        db.get(query, [userId], (err, row) => {
            if (err) return reject(err);
            if (!row) return resolve(null);
            resolve(row.username);
        });
    });
};

const getCategoryById = (catId) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT categoryName FROM report_category WHERE id = ?`;
        db.get(query, [catId], (err, row) => {
            if (err) {
                return reject(err);
            }
            resolve(row);
        });
    });
}

const getStatusById = (statusId) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT statusName FROM report_status WHERE id = ?`;
        db.get(query, [statusId], (err, row) => {
            if (err) {
                return reject(err);
            }
            resolve(row);
        });
    });
}

// REPORT


const getReportsByUserId = async (userId) => {
    const query = `SELECT * FROM Report WHERE userId = ?`;
    return new Promise((resolve, reject) => {
        db.all(query, [userId], async (err, rows) => {
            if (err) {
                return reject(err);
            }
            if (!rows || rows.length === 0) {
                return resolve([]);
            }
            try {
                const reports = await Promise.all(rows.map(async (row) => {
                    // Get images
                    const images = await new Promise((res, rej) => {
                        const imgQuery = `SELECT imageUrl FROM report_image WHERE reportId = ?`;
                        db.all(imgQuery, [row.id], (imgErr, imgRows) => {
                            if (imgErr) return rej(imgErr);
                            res(imgRows ? imgRows.map(img => img.imageUrl) : []);
                        });
                    });
                    // Get category
                    const category = await getCategoryById(row.catId);
                    // Get status
                    const status = await getStatusById(row.statusId);
                    return new Report({
                        id: row.id,
                        title: row.title,
                        description: row.description,
                        latitude: row.latitude,
                        longitude: row.longitude,
                        address: row.address,
                        userId: row.userId,
                        catId: category.categoryName,
                        statusId: status.statusName,
                        officeId: row.officeId,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt,
                        rejectReason: row.rejectReason,
                        images,
                        anonymous: row.anonymous,
                        unreadNotifications: 4
                    });
                }));
                resolve(reports);
            } catch (e) {
                reject(e);
            }
        });
    });
}

const addNewReport = (report) => {
    return new Promise((resolve, reject) => {
        db.run('BEGIN TRANSACTION');

        const now = dayjs().toString();

        const query1 = 'INSERT INTO Report (title, description, latitude, longitude, address, userId, catId, statusId, createdAt, anonymous) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        const params1 = [ report.title, report.description, report.latitude, report.longitude, report.address, report.userId, report.catId, 1, now, report.anonymous || 0  ]
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

const getCategories = () => {
  return new Promise((resolve, reject) => {
      const query = `SELECT * FROM report_category`;
      db.all(query, [], (err, rows) => {
          if (err) {
              return reject(err);
          }
          resolve(rows);
      });
  });
}


const getAssignedReports = (userId) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT R.* FROM office O,office_employee OE, report R WHERE R.officeId = O.id AND OE.officeId = O.id AND OE.userId = ? AND R.statusId = (SELECT id FROM report_status WHERE statusName = 'Assigned')";
        db.all(query, [userId], (err, rows) => {
            if (err) return reject(false);
            const reports = rows.map(row => new Report(row));
            resolve(reports);
        });
    });
}

const getReportNotificationsByChannel = (reportId, channelId) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM notification WHERE reportId = ? AND channelId = ?`;
        db.all(query, [reportId, channelId], async (err, rows) => {
            if (err) return reject(err);
            try {
                const messages = await Promise.all(rows.map(async row => {
                    const senderUsername = row.senderId ? await getUsernameByUserId(row.senderId) : "System";
                    const receiverUsername = await getUsernameByUserId(row.receiverId);
                    return new Message({
                        id: row.id,
                        report: row.reportId,
                        senderId: row.senderId,
                        senderUsername,
                        receiverId: row.receiverId,
                        receiverUsername,
                        text: row.text,
                        channel: row.channelId,
                        sendAt: row.sendAt
                    });
                }));
                resolve(messages);
            } catch (e) {
                reject(e);
            }
        });
    });
};

const DAO = {getUserByUsername, getUnassignedEmployees, getOffices, getRoles, assignEmployeeToOffice, addNewUser, addNewReport, getCategories, getReportsByUserId, getCategoryById, getStatusById, getReportNotificationsByChannel, getUsernameByUserId, getAssignedReports};

export default DAO

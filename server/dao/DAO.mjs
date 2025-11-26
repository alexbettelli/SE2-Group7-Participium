import sqlite from 'sqlite3'
import dayjs from 'dayjs';
import Mapper from '../utils/mapper.mjs'

const db = new sqlite.Database('./data/database.db', (err) => {
    if(err) throw err;
})

const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;


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



const getOffices = () => {
    return new Promise((resolve, reject) => {
        const query = `SELECT O.*,
                 RC.id AS catId,
                 RC.categoryName,
                 OE.userId AS employeeId,
                 U.username, U.firstName, U.lastName, U.email
          FROM office O
          LEFT JOIN office_employee OE ON O.id = OE.officeId
          LEFT JOIN user U ON OE.userId = U.id
          LEFT JOIN report_category RC ON O.catId = RC.id
        `;
        db.all(query, [], (err, rows) => {
            if (err) {
                return reject(err);
            }
            const offices = Mapper.mapRowsToOffices(rows)
            resolve(offices);
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
          const roles = Mapper.mapRowsToRoles(rows);
          console.log(roles);
          resolve(roles);
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
                const user = Mapper.mapRowToUser(row);
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
            const category = Mapper.mapRowToCategory(row)
            resolve(category);
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
            const status = Mapper.mapRowToStatus(row);
            resolve(status);
        });
    });
}

// REPORT
const getAllReports = () => {
    const query = `
        select r.*,
               u.username, 
               rc.categoryName,
               i.id as imageId, 
               i.imageUrl,
               s.statusName
        from report r
        join user u on r.userId = u.id 
        join report_category rc on r.catId = rc.id
        join report_image i on r.id = i.reportId
        join report_status s on r.statusId = s.id
    `;
    return new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
            if (err) return reject(err);
            else {
                const reports = Mapper.mapRowsToReports(rows);
                resolve(reports);
            }    
      });
    });
}
const getReportsByUserId = async (userId) =>{
    const query = `
        select r.*,
               u.username, 
               e.username as employeeUsername,
               rc.categoryName,
               i.id as imageId, 
               i.imageUrl,
               s.statusName,
               n.id as messageId, 
               n.senderId, 
               sender.username as senderUsername, 
               n.receiverId, 
               receiver.username as receiverUsername,
               n.text, 
               n.sendAt, 
               n.isRead,
               unread.unreadNotifications
        from report r
        join user u on r.userId = u.id 
        left join user e on r.employeeId = e.id
        join report_category rc on r.catId = rc.id
        join report_image i on r.id = i.reportId
        join report_status s on r.statusId = s.id
        left join notification n on r.id = n.reportId and n.channelId = 1
        left join user sender on n.senderId = sender.id
        left join user receiver on n.receiverId = receiver.id
        left join (
            SELECT reportId, sum(isRead = 0) as unreadNotifications
            FROM notification
            WHERE channelId = 1 AND receiverId = ?
            GROUP BY reportId
        ) as unread on unread.reportId = r.id 
        where userId = ?`;

    return new Promise ((resolve, reject) => {
        db.all(query, [userId, userId], async (err, rows) => {
            if (err) {
                return reject(err);
            }
            if (!rows || rows.length === 0) {
                return resolve([]);
            }
            console.log(rows)
            const reports = Mapper.mapRowsToReports(rows);
            resolve(reports);
        })
    })
}
/* const getReportsByUserId = async (userId) => {
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
} */

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
                const params2 = [ report.id, report.images[i], now ]
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
          const categories = Mapper.mapRowsToCategories(rows);
          resolve(categories);
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
      console.log(`User ${userId} profile updated`);
      
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


const getAssignedReports = (userId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT  
                r.*, 
                u.username, 
                u.id AS userId,
                e.username AS employeeUsername, 
                ri.id AS imageId, 
                ri.imageUrl, 
                rs.statusName,
                rc.categoryName,
				n.id as messageId, 
               n.senderId, 
               sender.username as senderUsername, 
               n.receiverId, 
               receiver.username as receiverUsername,
               n.text, 
               n.sendAt, 
               n.isRead,
                (
                    SELECT SUM(n2.isRead = 0)
                    FROM notification n2
                    WHERE n2.reportId = r.id 
                    AND n2.channelId = 1
                    AND n2.receiverId = r.employeeId
                ) AS unreadNotifications
            FROM report r
            JOIN user u ON r.userId = u.id
            JOIN user e ON r.employeeId = e.id
            JOIN report_image ri ON r.id = ri.reportId
            JOIN report_status rs ON r.statusId = rs.id
            JOIN report_category rc ON r.catId = rc.id
			RIGHT JOIN notification n ON r.id = n.reportId AND n.channelId=1
			LEFT JOIN user sender ON n.senderId = sender.id
			JOIN user receiver ON n.receiverId = receiver.id
            WHERE r.employeeId = ?`;

        db.all(query, [userId], (err, rows) => {
            if (err) return reject(false);
            resolve(Mapper.mapRowsToReports(rows));
        });
    });
}

const updateReportStatus = (userId, reportId, statusId) => {
    return new Promise((resolve, reject) => {
        const query1 = "SELECT * FROM report WHERE id = ? AND employeeId = ?";
        db.get(query1, [reportId, userId], (err, row) => {
            if (err) return reject(err);
            if (row === undefined) {
                return resolve(false);
            }
            const now = dayjs().toString();
            const query2 = "UPDATE report SET statusId = ?, updatedAt = ? WHERE id = ?";
            db.run(query2, [statusId, now, reportId], function(err) {
                if (err) return reject(err);
                const now = dayjs().toString();
                const query3 = "INSERT INTO notification (reportId, receiverId, text, sendAt, channelId) VALUES (?, ?, ?, ?, ?)";
                let message = "Your report ";
                switch(+statusId) {
                    case 1:
                        message += "is waiting to be approved."
                        break;
                    case 2:
                        message += "has been assigned to the corresponding office."
                        break;
                    case 3:
                        message += "is being resolved";
                        break;
                    case 4:
                        message += "has been suspended.";
                        break;
                    case 5:
                        message += "has been rejected.";
                        break;
                    case 6:
                        message += "has been resolved. Thank you for your contribution!";
                        break;
                    default:
                        console.log(`Unknown statusId: ${statusId}`);
                        reject(new Error(`Unknown statusId: ${statusId}`));
                }
                db.run(query3, [reportId, row.userId, message, now, 1], function(err) {
                    if (err) return reject(err);
                    const newId = this.lastID;
                    db.get(`
                        SELECT n.*, 
                            c.name as channelName,
                            sender.id as senderId, sender.username as senderUsername, sender.email as senderEmail, sender.firstName as senderFirstName, sender.lastName as senderLastName, sender.typeId as senderTypeId,
                            receiver.id as receiverId, receiver.username as receiverUsername, receiver.email as receiverEmail, receiver.firstName as receiverFirstName, receiver.lastName as receiverLastName, receiver.typeId as receiverTypeId
                        FROM notification n
                        LEFT JOIN channel c ON n.channelId = c.id
                        LEFT JOIN user sender ON n.senderId = sender.id
                        LEFT JOIN user receiver ON n.receiverId = receiver.id
                        WHERE n.id = ?
                    `, [newId], (err, row) => {
                        if (err || !row) return reject(err);
                        const msg = Mapper.mapRowToMessage(row);
                        resolve(msg);
                    });
                });
            });
        });
    });
}

const getReportStatuses = async () => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM report_status`;
        db.all(query, [], (err, rows) => {
            if(err) return reject(err);
            resolve(rows);
        });
    });
}

const getUnassignedReports = () => {
  return new Promise((resolve, reject) => {
    const query = "SELECT R.*, RI.id AS imageId, RI.imageUrl, RC.categoryName, U.username FROM report R, report_image RI, report_category RC, user U WHERE R.statusId = 1 AND R.id = RI.reportId AND R.catId = RC.id AND R.userId = U.id";
    db.all(query, [], async (err, rows) => {
      if (err) return reject(err);
      
      const reports = Mapper.mapRowsToReports(rows);
      resolve(reports);
    });
  });
};

const assignReportToOfficer = (reportId, categoryId, officeId, officerId) => {
    return new Promise((resolve, reject) => {
        const query = `UPDATE report 
                       SET employeeId = ?, 
                           statusId = 2,
                           officeId = ?, 
                           catId = ?,
                           updatedAt = ?
                       WHERE id = ?`;
        const now = dayjs().toString();
        db.run(query, [officerId, officeId, categoryId, now, reportId], function (err) {
            if (err) return reject(err);
            resolve();
        });
    });
};

const rejectReport = (reportId, reason) => {
    return new Promise((resolve, reject) => {
        const query = `UPDATE report 
                       SET statusId = 5,
                            rejectReason = ?,
                            updatedAt = ?
                        WHERE id = ?`;
        const now = dayjs().toString();
        db.run(query, [reason, now, reportId], function (err) {
            if (err) return reject(err);
            resolve();
        });
    });
};

const createNotification = (message) => {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO notification (reportId, senderId, receiverId, text, channelId, sendAt)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const now = dayjs().toString();
        db.run(query, [
            message.reportId,
            message.senderId || null,
            message.receiverId,
            message.text,
            message.channelId,
            now
        ], function (err) {
            if (err) return reject(err);
            const newId = this.lastID;
            db.get(`
                SELECT n.*, 
                       c.name as channelName,
                       sender.id as senderId, sender.username as senderUsername, sender.email as senderEmail, sender.firstName as senderFirstName, sender.lastName as senderLastName, sender.typeId as senderTypeId,
                       receiver.id as receiverId, receiver.username as receiverUsername, receiver.email as receiverEmail, receiver.firstName as receiverFirstName, receiver.lastName as receiverLastName, receiver.typeId as receiverTypeId
                FROM notification n
                LEFT JOIN channel c ON n.channelId = c.id
                LEFT JOIN user sender ON n.senderId = sender.id
                LEFT JOIN user receiver ON n.receiverId = receiver.id
                WHERE n.id = ?
            `, [newId], (err, row) => {
                if (err || !row) return reject(err);
                const msg = Mapper.mapRowToMessage(row);
                resolve(msg);
            });
        });
    });
};

const getUnreadNotifications = (userId) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM notification WHERE receiverId = ?`; //!TODO: missing isRead field in the DB
        db.all(query, [userId], async (err, rows) => {
            if (err) {
              return reject(err);
          }
          resolve(rows.length);
        });
    });
}

const setNotificationsAsRead = (userId, reportId) => {
    return new Promise((resolve, reject) => {
        const query = `UPDATE notification SET isRead = 1 WHERE reportId = ? AND receiverId = ? AND isRead = 0`;
        db.run(query, [reportId, userId], function (err) {
            if (err) return reject(err);
            resolve(this.changes);
        });
    });
}



const DAO = {
    getUserByUsername, 
    getUnassignedEmployees, 
    getOffices, 
    getRoles, 
    assignEmployeeToOffice, 
    addNewUser,
    deleteEmployeeById,
    addNewReport, 
    getCategories, 
    getAllReports,
    getReportsByUserId,
    getUnassignedReports, 
    assignReportToOfficer,
    rejectReport,
    getCategoryById, 
    getStatusById, 
    getUsernameByUserId, 
    getAssignedReports, 
    updateUserProfile, 
    getUserById, 
    updateReportStatus,
    getReportStatuses,
    getUnreadNotifications,
    setNotificationsAsRead,
    createNotification
};

export default DAO;

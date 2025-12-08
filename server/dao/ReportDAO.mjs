import db from '../data/db.mjs';
import dayjs from 'dayjs';
import Mapper from '../utils/mapper.mjs'
import e from 'express';

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
const getReportsByUserId = async (userId) => {
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

    return new Promise((resolve, reject) => {
        db.all(query, [userId, userId], async (err, rows) => {
            if (err) {
                return reject(err);
            }
            if (!rows || rows.length === 0) {
                return resolve([]);
            }
            const reports = Mapper.mapRowsToReports(rows);
            resolve(reports);
        })
    })
}
const addNewReport = (report) => {
    return new Promise((resolve, reject) => {
        db.run('BEGIN TRANSACTION');

        const now = dayjs().toString();

        const query1 = 'INSERT INTO Report (title, description, latitude, longitude, address, userId, catId, statusId, createdAt, anonymous) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        const params1 = [report.title, report.description, report.latitude, report.longitude, report.address, report.userId, report.catId, 1, now, report.anonymous || 0]
        db.run(query1, params1, function (err) {
            if (err) {
                reject(err);
                db.run('ROLLBACK');
            }
            report.id = this.lastID;

            for (let i = 0; i < report.images.length; i++) {
                const query2 = 'INSERT INTO report_image (reportId, imageUrl, uploadedAt) VALUES (?, ?, ?)'
                const params2 = [report.id, report.images[i], now]
                db.run(query2, params2, function (err) {
                    if (err) {
                        db.run('ROLLBACK');
                        reject(err);
                    }

                    db.run('COMMIT', function (err) {
                        if (err) reject(err);
                        resolve(report);
                    });
                })
            }
        });
    });

}
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
                eo.name as externalOfficeName, 
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
            LEFT JOIN external_office eo ON r.externalOfficeId = eo.id
            JOIN user receiver ON n.receiverId = receiver.id
            WHERE r.employeeId = ?`;

        db.all(query, [userId], (err, rows) => {
            if (err) return reject(new Error(err.message || 'Database error'));
            resolve(Mapper.mapRowsToReports(rows));
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

const assignReportToExternalOffice = (reportId, externalOfficeId) => {
    return new Promise((resolve, reject) => {
        const query = `UPDATE report
                        SET externalOfficeId = ?,
                            statusId = 2,
                            updatedAt = ?
                        WHERE id = ?`;
        const now = dayjs().toString();
        db.run(query, [externalOfficeId, now, reportId], function (err) {
            if (err) return reject(err);
            resolve();
        });
    });
};

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
            db.run(query2, [statusId, now, reportId], function (err) {
                if (err) return reject(err);
                const now = dayjs().toString();
                const query3 = "INSERT INTO notification (reportId, receiverId, text, sendAt, channelId) VALUES (?, ?, ?, ?, ?)";
                let message = "Your report ";
                switch (+statusId) {
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
                        reject(new Error(`Unknown statusId: ${statusId}`));
                }
                db.run(query3, [reportId, row.userId, message, now, 1], function (err) {
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

const ReportDAO = {
    getAllReports,
    getReportsByUserId,
    addNewReport,
    rejectReport,
    getAssignedReports,
    getUnassignedReports,
    assignReportToOfficer,
    assignReportToExternalOffice,
    updateReportStatus
}
export default ReportDAO
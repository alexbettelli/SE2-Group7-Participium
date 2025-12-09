import db from '../data/db.mjs';
import dayjs from 'dayjs';
import Mapper from '../utils/mapper.mjs';

const getAllReports = () => {
    const query = `
          SELECT r.*, u.username, em.username AS externalMaintainerUsername,
             rc.categoryName,
             i.id AS imageId, i.imageUrl,
             s.statusName,
             co.id AS commentId,
             co.senderId AS commentSenderId,
             csender.username AS commentSenderUsername,
             co.receiverId AS commentReceiverId,
             creceiver.username AS commentReceiverUsername,
             co.text AS commentText,
             co.sendAt AS commentSendAt,
              co.isRead AS commentIsRead,
              unreadC.unreadComments
      FROM report r
      JOIN user u ON r.userId = u.id
      LEFT JOIN user em ON r.externalMaintainerId = em.id
      JOIN report_category rc ON r.catId = rc.id
      JOIN report_image i ON r.id = i.reportId
      JOIN report_status s ON r.statusId = s.id
      LEFT JOIN comment co ON r.id = co.reportId
      LEFT JOIN user csender ON co.senderId = csender.id
      LEFT JOIN user creceiver ON co.receiverId = creceiver.id
          LEFT JOIN (
           SELECT reportId, SUM(isRead = 0) AS unreadComments
           FROM comment
           GROUP BY reportId
          ) AS unreadC ON unreadC.reportId = r.id
    `;
    return new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
            if (err) return reject(err);
            const reports = Mapper.mapRowsToReports(rows);
            resolve(reports);
        });
    });
}

const getReportsByUserId = async (userId) => {
    const query = `
        select r.*,
               u.username, 
               e.username as employeeUsername,
               em.username as externalMaintainerUsername,
               rc.categoryName,
               i.id as imageId, 
               i.imageUrl,
               s.statusName,
            n.id as messageId,
            n.senderId as notificationSenderId,
            sender.username as notificationSenderUsername,
            n.receiverId as notificationReceiverId,
            receiver.username as notificationReceiverUsername,
            n.text as notificationText,
            n.sendAt as notificationSendAt,
            n.isRead as notificationIsRead,
            co.id as commentId,
            co.senderId as commentSenderId,
            csender.username as commentSenderUsername,
            co.receiverId as commentReceiverId,
            creceiver.username as commentReceiverUsername,
            co.text as commentText,
            co.sendAt as commentSendAt,
            co.isRead as commentIsRead,
                unread.unreadNotifications,
                unreadC.unreadComments
        from report r
        join user u on r.userId = u.id 
        left join user e on r.employeeId = e.id
        left join user em on r.externalMaintainerId = em.id
        join report_category rc on r.catId = rc.id
        join report_image i on r.id = i.reportId
        join report_status s on r.statusId = s.id
        left join notification n on r.id = n.reportId and n.channelId = 1
        left join user sender on n.senderId = sender.id
        left join user receiver on n.receiverId = receiver.id
        left join comment co on r.id = co.reportId
        left join user csender on co.senderId = csender.id
        left join user creceiver on co.receiverId = creceiver.id
        left join (
            SELECT reportId, sum(isRead = 0) as unreadNotifications
            FROM notification
            WHERE channelId = 1 AND receiverId = ?
            GROUP BY reportId
        ) as unread on unread.reportId = r.id 
        left join (
            SELECT reportId, sum(isRead = 0) as unreadComments
            FROM comment
            WHERE receiverId = ?
            GROUP BY reportId
        ) as unreadC on unreadC.reportId = r.id 
        where userId = ?`;

    return new Promise((resolve, reject) => {
        db.all(query, [userId, userId, userId], async (err, rows) => {
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
                em.username AS externalMaintainerUsername,
                ri.id AS imageId, 
                ri.imageUrl, 
                rs.statusName,
                rc.categoryName,
                eo.name AS externalOfficeName,
                -- Notification (distinct aliases)
                n.id AS messageId,
                n.senderId AS notificationSenderId,
                sender.username AS notificationSenderUsername,
                n.receiverId AS notificationReceiverId,
                receiver.username AS notificationReceiverUsername,
                n.text AS notificationText,
                n.sendAt AS notificationSendAt,
                n.isRead AS notificationIsRead,
                -- Comments (distinct aliases)
                co.id AS commentId,
                co.senderId AS commentSenderId,
                csender.username AS commentSenderUsername,
                co.receiverId AS commentReceiverId,
                creceiver.username AS commentReceiverUsername,
                co.text AS commentText,
                co.sendAt AS commentSendAt,
                co.isRead AS commentIsRead,
                (
                    SELECT SUM(n2.isRead = 0)
                    FROM notification n2
                    WHERE n2.reportId = r.id 
                    AND n2.channelId = 1
                    AND n2.receiverId = r.employeeId
                ) AS unreadNotifications,
                (
                    SELECT SUM(c2.isRead = 0)
                    FROM comment c2
                    WHERE c2.reportId = r.id
                    AND c2.receiverId = r.employeeId
                ) AS unreadComments
            FROM report r
            JOIN user u ON r.userId = u.id
            JOIN user e ON r.employeeId = e.id
            JOIN report_image ri ON r.id = ri.reportId
            JOIN report_status rs ON r.statusId = rs.id
            JOIN report_category rc ON r.catId = rc.id
            LEFT JOIN notification n ON r.id = n.reportId AND n.channelId = 1
            LEFT JOIN user sender ON n.senderId = sender.id
            LEFT JOIN user em ON r.externalMaintainerId = em.id
            LEFT JOIN comment co ON r.id = co.reportId
            LEFT JOIN user csender ON co.senderId = csender.id
            LEFT JOIN user creceiver ON co.receiverId = creceiver.id
            LEFT JOIN external_office eo ON r.externalOfficeId = eo.id
            LEFT JOIN user receiver ON n.receiverId = receiver.id
            WHERE r.employeeId = ?`;

        db.all(query, [userId], (err, rows) => {
            if (err) return reject(false);
            resolve(Mapper.mapRowsToReports(rows));
        });
    });
}
const getUnassignedReports = () => {
    return new Promise((resolve, reject) => {
                const query = `
                    SELECT R.*, U.username, RC.categoryName,
                                 RI.id AS imageId, RI.imageUrl,
                                 -- Comments (distinct aliases)
                                 CO.id AS commentId,
                                 CO.senderId AS commentSenderId,
                                 CSENDER.username AS commentSenderUsername,
                                 CO.receiverId AS commentReceiverId,
                                 CRECEIVER.username AS commentReceiverUsername,
                                 CO.text AS commentText,
                                 CO.sendAt AS commentSendAt,
                                 CO.isRead AS commentIsRead
                    FROM report R
                    JOIN user U ON R.userId = U.id
                    JOIN report_category RC ON R.catId = RC.id
                    JOIN report_image RI ON R.id = RI.reportId
                    LEFT JOIN comment CO ON R.id = CO.reportId
                    LEFT JOIN user CSENDER ON CO.senderId = CSENDER.id
                    LEFT JOIN user CRECEIVER ON CO.receiverId = CRECEIVER.id
                    WHERE R.statusId = 1
                `;
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


const getExternalOfficeAssignedReports = (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT r.*, u.username, e.username AS employeeUsername, em.username AS externalMaintainerUsername, rc.categoryName,
             ri.id AS imageId, ri.imageUrl, rs.statusName,
             -- Notification (distinct aliases)
             n.id AS messageId,
             n.senderId AS notificationSenderId,
             sender.username AS notificationSenderUsername,
             n.receiverId AS notificationReceiverId,
             receiver.username AS notificationReceiverUsername,
             n.text AS notificationText,
             n.sendAt AS notificationSendAt,
             n.isRead AS notificationIsRead,
             -- Comments (distinct aliases)
             co.id AS commentId,
             co.senderId AS commentSenderId,
             csender.username AS commentSenderUsername,
             co.receiverId AS commentReceiverId,
             creceiver.username AS commentReceiverUsername,
             co.text AS commentText,
             co.sendAt AS commentSendAt,
             co.isRead AS commentIsRead,
                         unreadC.unreadComments
      FROM report r
      JOIN report_status rs ON r.statusId = rs.id
      JOIN report_category rc on r.catId = rc.id
      JOIN user u on r.userId = u.id
      LEFT JOIN user e on r.employeeId = e.id
      LEFT JOIN user em on r.externalMaintainerId = em.id
      JOIN report_image ri on r.id = ri.reportId
      JOIN external_office_employee eoe ON eoe.userId = ?
      JOIN external_office eo ON eo.id = eoe.external_officeId
      LEFT JOIN notification n ON r.id = n.reportId AND n.channelId = 1
      LEFT JOIN user sender ON n.senderId = sender.id
      LEFT JOIN user receiver ON n.receiverId = receiver.id
            LEFT JOIN comment co ON r.id = co.reportId
            LEFT JOIN user csender ON co.senderId = csender.id
            LEFT JOIN user creceiver ON co.receiverId = creceiver.id
            LEFT JOIN (
                    SELECT reportId, SUM(isRead = 0) AS unreadComments
                    FROM comment
                    WHERE receiverId = ?
                    GROUP BY reportId
            ) AS unreadC ON unreadC.reportId = r.id
      WHERE r.catId = eo.catId 
        AND r.externalOfficeId = eo.id
        AND r.statusId = 2
      ORDER BY r.updatedAt DESC
    `;
        db.all(query, [userId, userId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows?.length ? Mapper.mapRowsToReports(rows) : []);
    });
  });
};

// Mostra solo i report accettati da quel maintainer (externalMaintainerId)
export const getExternalMaintainerMyReports = (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT r.*, u.username, e.username AS employeeUsername, em.username AS externalMaintainerUsername, rc.categoryName,
             ri.id AS imageId, ri.imageUrl, rs.statusName,
             -- Notification (distinct aliases)
             n.id AS messageId,
             n.senderId AS notificationSenderId,
             sender.username AS notificationSenderUsername,
             n.receiverId AS notificationReceiverId,
             receiver.username AS notificationReceiverUsername,
             n.text AS notificationText,
             n.sendAt AS notificationSendAt,
             n.isRead AS notificationIsRead,
             -- Comments (distinct aliases)
             co.id AS commentId,
             co.senderId AS commentSenderId,
             csender.username AS commentSenderUsername,
             co.receiverId AS commentReceiverId,
             creceiver.username AS commentReceiverUsername,
             co.text AS commentText,
             co.sendAt AS commentSendAt,
             co.isRead AS commentIsRead,
                         unreadC.unreadComments
      FROM report r
      JOIN report_status rs ON r.statusId = rs.id
      JOIN report_category rc on r.catId = rc.id
      JOIN user u on r.userId = u.id
            LEFT JOIN user e on r.employeeId = e.id
            LEFT JOIN user em on r.externalMaintainerId = em.id
      JOIN report_image ri on r.id = ri.reportId
      LEFT JOIN notification n ON r.id = n.reportId AND n.channelId = 1
      LEFT JOIN user sender ON n.senderId = sender.id
      LEFT JOIN user receiver ON n.receiverId = receiver.id
            LEFT JOIN comment co ON r.id = co.reportId
            LEFT JOIN user csender ON co.senderId = csender.id
            LEFT JOIN user creceiver ON co.receiverId = creceiver.id
            LEFT JOIN (
                    SELECT reportId, SUM(isRead = 0) AS unreadComments
                    FROM comment
                    WHERE receiverId = ?
                    GROUP BY reportId
            ) AS unreadC ON unreadC.reportId = r.id
      WHERE r.externalMaintainerId = ?
        AND r.statusId IN (2,3,6)
      ORDER BY r.updatedAt DESC
    `;
        db.all(query, [userId, userId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows?.length ? Mapper.mapRowsToReports(rows) : []);
    });
  });
};

export const updateExternalMaintainerReportStatus = (userId, reportId, statusId) => {
  return new Promise((resolve, reject) => {
        const now = dayjs().toString();
        const numericStatus = Number(statusId);
        // Only allow In Progress (3) or Resolved (6)
        if (!(numericStatus === 3 || numericStatus === 6)) {
            return resolve({ ok: false });
        }

        // Update report status
        const updateSql = `
            UPDATE report 
            SET statusId = ?, updatedAt = ?
            WHERE id = ?
                AND externalMaintainerId = ?
                AND externalOfficeId IN (
                    SELECT external_officeId FROM external_office_employee WHERE userId = ?
                )
        `;
        db.run(updateSql, [numericStatus, now, reportId, userId, userId], function (err) {
            if (err) return reject(err);
            if (this.changes === 0) return resolve({ ok: false });

            // Get report receivers
            db.get(`SELECT id, userId, employeeId FROM report WHERE id = ?`, [reportId], (err, repRow) => {
                if (err) return reject(err);
                if (!repRow) return resolve({ ok: false });

                // Compose message succinctly
                const message = numericStatus === 3
                    ? "Your report is being resolved"
                    : "Your report has been resolved. Thank you for your contribution!";

                const sendTime = dayjs().toString();

                // Insert notification with senderId NULL to citizen
                db.run(
                    `INSERT INTO notification (reportId, receiverId, text, sendAt, channelId) VALUES (?, ?, ?, ?, 1)`,
                    [reportId, repRow.userId, message, sendTime],
                    function (err) {
                        if (err) return reject(err);
                        const notifId = this.lastID;
                        db.get(
                            `SELECT n.*, 
                                            c.name as channelName,
                                            sender.id as senderId, sender.username as senderUsername, sender.email as senderEmail, sender.firstName as senderFirstName, sender.lastName as senderLastName, sender.typeId as senderTypeId,
                                            receiver.id as receiverId, receiver.username as receiverUsername, receiver.email as receiverEmail, receiver.firstName as receiverFirstName, receiver.lastName as receiverLastName, receiver.typeId as receiverTypeId
                             FROM notification n
                             LEFT JOIN channel c ON n.channelId = c.id
                             LEFT JOIN user sender ON n.senderId = sender.id
                             LEFT JOIN user receiver ON n.receiverId = receiver.id
                             WHERE n.id = ?`,
                            [notifId],
                            (err, notifRow) => {
                                if (err || !notifRow) return reject(err);
                                const notification = Mapper.mapRowToMessage(notifRow);

                                // Insert comment with senderId NULL to employee
                                db.run(
                                    `INSERT INTO comment (reportId, receiverId, text, sendAt) VALUES (?, ?, ?, ?)`,
                                    [reportId, repRow.employeeId || null, message, sendTime],
                                    function (err) {
                                        if (err) return reject(err);
                                        const commId = this.lastID;
                                        db.get(
                                            `SELECT co.*, 
                                                            sender.id as senderId, sender.username as senderUsername, sender.email as senderEmail, sender.firstName as senderFirstName, sender.lastName as senderLastName, sender.typeId as senderTypeId,
                                                            receiver.id as receiverId, receiver.username as receiverUsername, receiver.email as receiverEmail, receiver.firstName as receiverFirstName, receiver.lastName as receiverLastName, receiver.typeId as receiverTypeId
                                             FROM comment co
                                             LEFT JOIN user sender ON co.senderId = sender.id
                                             LEFT JOIN user receiver ON co.receiverId = receiver.id
                                             WHERE co.id = ?`,
                                            [commId],
                                            (err, commRow) => {
                                                if (err || !commRow) return reject(err);
                                                const comment = Mapper.mapRowToComment(commRow);
                                                return resolve({ ok: true, notification, comment });
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            });
        });
  });
};

const ReportDAO = {
  getAllReports,
  getReportsByUserId,
  addNewReport,
  rejectReport,
  getAssignedReports,
  getUnassignedReports,
  assignReportToOfficer,
  assignReportToExternalOffice,
  updateReportStatus,
  getExternalOfficeAssignedReports,
  getExternalMaintainerMyReports,
  updateExternalMaintainerReportStatus
};
export default ReportDAO;
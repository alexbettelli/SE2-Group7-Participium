import db from '../data/db.mjs';
import dayjs from 'dayjs';
import Mapper from '../utils/mapper.mjs';
import { getAsync, runAsync } from '../utils/dbAsyncHelper.mjs';

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
const addNewReport = async (report) => {
  const now = dayjs().toString();

  try {
    await runAsync('BEGIN TRANSACTION');

    const insertReportSql = `
      INSERT INTO report
      (title, description, latitude, longitude, address, userId, catId, statusId, createdAt, anonymous)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const reportResult = await runAsync(insertReportSql, [
      report.title,
      report.description,
      report.latitude,
      report.longitude,
      report.address,
      report.userId,
      report.catId,
      1,
      now,
      report.anonymous || 0
    ]);

    report.id = reportResult.lastID;

    const insertImageSql = `
      INSERT INTO report_image (reportId, imageUrl, uploadedAt)
      VALUES (?, ?, ?)
    `;

    for (const imageUrl of report.images || []) {
      await runAsync(insertImageSql, [report.id, imageUrl, now]);
    }

    await runAsync('COMMIT');
    return report;

  } catch (err) {
    await runAsync('ROLLBACK');
    throw err;
  }
};
const rejectReport = (reportId, userId, reason ) => {
    return new Promise((resolve, reject) => {
        const query = `UPDATE report 
                       SET statusId = 5,
                            rejectReason = ?,
                            updatedAt = ?
                        WHERE id = ?`;
        const now = dayjs().toString();
        db.run(query, [reason, now, reportId], function (err) {
            if (err) return reject(err);
            const query2 = `INSERT INTO notification (reportId, senderId, receiverId, text, channelId, sendAt) VALUES (?, ?, ?, ?, ?, ?)`;
            const text = `Your report has been rejected. \n Reason: ${reason}`
            db.run(query2, [reportId, null, userId, text, 1, now ], function (err) {
                if (err) return reject(err);
                resolve();
            });
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
            if (err) return reject(new Error(err.message || 'Database error'));
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
const assignReportToOfficer = (reportId, categoryId, officeId, officerId, userId) => {
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

            const query2 = `INSERT INTO notification (reportId, senderId, receiverId, text, channelId, sendAt) VALUES (?, ?, ?, ?, ?, ?)`;
            const text = `Your report has been approved, we will keep you updated.`
            db.run(query2, [reportId, null, userId, text, 1, now ], function (err) {
                if (err) return reject(err);
                resolve();
            });
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

const updateReportStatus = async (userId, reportId, statusId) => {
  const now = dayjs().toString();

  const report = await getAsync(
    `SELECT userId FROM report WHERE id = ? AND employeeId = ?`,
    [reportId, userId]
  );

  if (!report) return false;

  await runAsync(
    `UPDATE report SET statusId = ?, updatedAt = ? WHERE id = ?`,
    [statusId, now, reportId]
  );

  let message = 'Your report ';
  switch (+statusId) {
    case 3:
      message += 'is being resolved';
      break;
    case 4:
      message += 'has been suspended.';
      break;
    case 6:
      message += 'has been resolved. Thank you for your contribution!';
      break;
    default:
      throw new Error(`Unknown statusId: ${statusId}`);
  }

  const notifResult = await runAsync(
    `
    INSERT INTO notification (reportId, receiverId, text, sendAt, channelId)
    VALUES (?, ?, ?, ?, 1)
    `,
    [reportId, report.userId, message, now]
  );

  const notifRow = await getAsync(
    `
    SELECT n.*, 
           c.name AS channelName,
           sender.id AS senderId, sender.username AS senderUsername,
           sender.email AS senderEmail, sender.firstName AS senderFirstName,
           sender.lastName AS senderLastName, sender.typeId AS senderTypeId,
           receiver.id AS receiverId, receiver.username AS receiverUsername,
           receiver.email AS receiverEmail, receiver.firstName AS receiverFirstName,
           receiver.lastName AS receiverLastName, receiver.typeId AS receiverTypeId
    FROM notification n
    LEFT JOIN channel c ON n.channelId = c.id
    LEFT JOIN user sender ON n.senderId = sender.id
    LEFT JOIN user receiver ON n.receiverId = receiver.id
    WHERE n.id = ?
    `,
    [notifResult.lastID]
  );

  return Mapper.mapRowToMessage(notifRow);
};


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

export const updateExternalMaintainerReportStatus = async (userId, reportId, statusId) => {
  const now = dayjs().toString();

  try {
    /* ---------- ACCEPT REPORT ---------- */
    if (statusId === 'accept') {
      const result = await runAsync(
        `
        UPDATE report
        SET externalMaintainerId = ?, statusId = 3, updatedAt = ?
        WHERE id = ?
          AND statusId = 2
          AND externalOfficeId IN (
            SELECT external_officeId
            FROM external_office_employee
            WHERE userId = ?
          )
        `,
        [userId, now, reportId, userId]
      );

      if (result.changes === 0) return { ok: false };

      const report = await getAsync(
        `SELECT employeeId FROM report WHERE id = ?`,
        [reportId]
      );

      const commentResult = await runAsync(
        `
        INSERT INTO comment (reportId, senderId, receiverId, text, sendAt)
        VALUES (?, NULL, ?, ?, ?)
        `,
        [
          reportId,
          report?.employeeId || null,
          'The maintainer accepted the report and is starting work',
          now
        ]
      );

      const commentRow = await getAsync(
        `
        SELECT co.*,
               sender.id AS senderId, sender.username AS senderUsername,
               receiver.id AS receiverId, receiver.username AS receiverUsername
        FROM comment co
        LEFT JOIN user sender ON co.senderId = sender.id
        LEFT JOIN user receiver ON co.receiverId = receiver.id
        WHERE co.id = ?
        `,
        [commentResult.lastID]
      );

      return { ok: true, comment: Mapper.mapRowToComment(commentRow) };
    }

    /* ---------- UPDATE STATUS (3 or 6) ---------- */
    const numericStatus = Number(statusId);
    if (![3, 6].includes(numericStatus)) return { ok: false };

    const updateResult = await runAsync(
      `
      UPDATE report
      SET statusId = ?, updatedAt = ?
      WHERE id = ?
        AND externalMaintainerId = ?
        AND externalOfficeId IN (
          SELECT external_officeId
          FROM external_office_employee
          WHERE userId = ?
        )
      `,
      [numericStatus, now, reportId, userId, userId]
    );

    if (updateResult.changes === 0) return { ok: false };

    const report = await getAsync(
      `SELECT userId, employeeId FROM report WHERE id = ?`,
      [reportId]
    );

    const message =
      numericStatus === 3
        ? 'The maintainer is working on the report'
        : 'The report has been resolved by the maintainer!';

    /* ---------- NOTIFICATION ---------- */
    const notifResult = await runAsync(
      `
      INSERT INTO notification (reportId, receiverId, text, sendAt, channelId)
      VALUES (?, ?, ?, ?, 1)
      `,
      [reportId, report.userId, message, now]
    );

    const notificationRow = await getAsync(
      `
      SELECT n.*,
             c.name AS channelName,
             sender.id AS senderId, sender.username AS senderUsername,
             receiver.id AS receiverId, receiver.username AS receiverUsername
      FROM notification n
      LEFT JOIN channel c ON n.channelId = c.id
      LEFT JOIN user sender ON n.senderId = sender.id
      LEFT JOIN user receiver ON n.receiverId = receiver.id
      WHERE n.id = ?
      `,
      [notifResult.lastID]
    );

    /* ---------- COMMENT ---------- */
    const commentResult = await runAsync(
      `
      INSERT INTO comment (reportId, receiverId, text, sendAt)
      VALUES (?, ?, ?, ?)
      `,
      [reportId, report.employeeId || null, message, now]
    );

    const commentRow = await getAsync(
      `
      SELECT co.*,
             sender.id AS senderId, sender.username AS senderUsername,
             receiver.id AS receiverId, receiver.username AS receiverUsername
      FROM comment co
      LEFT JOIN user sender ON co.senderId = sender.id
      LEFT JOIN user receiver ON co.receiverId = receiver.id
      WHERE co.id = ?
      `,
      [commentResult.lastID]
    );

    return {
      ok: true,
      notification: Mapper.mapRowToMessage(notificationRow),
      comment: Mapper.mapRowToComment(commentRow)
    };

  } catch (err) {
    console.error(err);
    throw err;
  }
};

const getReportById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT r.*, 
                   u.id as userId, u.username, 
                   c.id as catId, c.categoryName,
                   s.id as statusId, s.statusName,
                   i.id as imageId, i.imageUrl
            FROM report r
            LEFT JOIN user u ON r.userId = u.id
            LEFT JOIN report_category c ON r.catId = c.id
            LEFT JOIN report_status s ON r.statusId = s.id
            LEFT JOIN report_image i ON r.id = i.reportId
            WHERE r.id = ?
        `;
        db.get(sql, [id], (err, row) => {
            if (err) return reject(err);
            resolve(Mapper.mapRowsToReport(row ? [row] : []));
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
  updateExternalMaintainerReportStatus,
  getReportById
};
export default ReportDAO;
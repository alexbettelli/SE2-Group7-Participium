import db from '../data/db.mjs';
import dayjs from 'dayjs';
import Mapper from '../utils/mapper.mjs'

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
/* const getUnreadNotifications = (userId) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM notification WHERE receiverId = ? AND isRead = 0`;
        db.all(query, [userId], async (err, rows) => {
            if (err) {
              return reject(err);
          }
          resolve(rows.length);
        });
    });
} */
const setNotificationsAsRead = (userId, reportId) => {
    return new Promise((resolve, reject) => {
        const query = `UPDATE notification SET isRead = 1 WHERE reportId = ? AND receiverId = ? AND isRead = 0`;
        db.run(query, [reportId, userId], function (err) {
            if (err) return reject(err);
            resolve(this.changes);
        });
    });
}


//COMMENTS

const createComment = (message) => {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO comment (reportId, senderId, receiverId, text, sendAt)
            VALUES (?, ?, ?, ?, ?)
        `;
        const now = dayjs().toString();
        db.run(query, [
            message.reportId,
            message.senderId || null,
            message.receiverId,
            message.text,
            now
        ], function (err) {
            if (err) return reject(err);
            const newId = this.lastID;
            db.get(`
                SELECT co.*, 
                       sender.id as senderId, sender.username as senderUsername, sender.email as senderEmail, sender.firstName as senderFirstName, sender.lastName as senderLastName, sender.typeId as senderTypeId,
                       receiver.id as receiverId, receiver.username as receiverUsername, receiver.email as receiverEmail, receiver.firstName as receiverFirstName, receiver.lastName as receiverLastName, receiver.typeId as receiverTypeId
                FROM comment co
                LEFT JOIN user sender ON co.senderId = sender.id
                LEFT JOIN user receiver ON co.receiverId = receiver.id
                WHERE co.id = ?
            `, [newId], (err, row) => {
                if (err || !row) return reject(err);
                const msg = Mapper.mapRowToComment(row);
                resolve(msg);
            });
        });
    });
};

const setCommentsAsRead = (userId, reportId) => {
    return new Promise((resolve, reject) => {
        const query = `UPDATE comment SET isRead = 1 WHERE reportId = ? AND receiverId = ? AND isRead = 0`;
        db.run(query, [reportId, userId], function (err) {
            if (err) return reject(err);
            resolve(this.changes);
        });
    });
}


const NotificationDAO = {
    createNotification,
    setNotificationsAsRead,
    createComment,
    setCommentsAsRead
}

export default NotificationDAO;
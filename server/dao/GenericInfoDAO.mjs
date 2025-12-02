import db from '../data/db.mjs';
import Mapper from '../utils/mapper.mjs'

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
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM user_type 
      Where id IN (3,4)`; //  3 = public relations, 4 = technician
        db.all(query, [], (err, rows) => {
            if (err) {
                return reject(err);
            }
            const roles = Mapper.mapRowsToRoles(rows);
            resolve(roles);
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
/* const getCategoryById = (catId) => {
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
} */
/* const getStatusById = (statusId) => {
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
} */
const getReportStatuses = async () => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM report_status`;
        db.all(query, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

const GenericInfoDAO = {
    getOffices,
    getRoles,
    getCategories,
    getReportStatuses
}

export default GenericInfoDAO;
import db from '../data/db.mjs';

const deleteOfficeById = (officeId) => {
    return new Promise((resolve, reject) => {
        const query = "DELETE FROM office WHERE id = ?"
        db.run(query, [officeId], function (err) {
            if (err) return reject(err);
            resolve();
        });
    });
}

const OfficeDAO = {
    deleteOfficeById
}

export default OfficeDAO;
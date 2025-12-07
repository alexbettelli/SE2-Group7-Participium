import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import request from 'supertest';

import db from '../data/db.mjs';
import app from '../server.mjs';


const schemaPath = path.join(process.cwd(), 'data', 'schema.sql');
const schema = fs.readFileSync(schemaPath, "utf-8");

const USER_TYPES = [
    { type: 'Citizen' },
    { type: 'System Administrator' },
    { type: 'Municipal Public Relations Officer' },
    { type: 'Technical Office Staff Member' },
    { type: 'Unassigned Employee' }
];
const USERS = [
    { username: 'user', password: 'userpassword', email: 'user@email.it', firstName: 'us', lastName: 'er', typeId: 1, allowEmailNotification: 1 },
    { username: 'admin', password: 'adminpassword', email: 'admin@email.it', firstName: 'ad', lastName: 'min', typeId: 2, allowEmailNotification: 0 },
    { username: 'userPr', password: 'prpassword', email: 'userPr@email.it', firstName: 'user', lastName: 'Pr', typeId: 3, allowEmailNotification: 0 },
    { username: 'userOfficer', password: 'officerpassword', email: 'userOfficer@email.it', firstName: 'user', lastName: 'officer', typeId: 4, allowEmailNotification: 0 },
];
const REPORT_CATEGORIES = [
    'Roads and Infrastructure',
    'Waste and Cleanliness',
    'Green Areas and Public Parks',
    'Public Transport and Mobility'
];
const REPORT_STATUSES = [
    'Pending Approval',
    'Assigned',
    'In Progress',
    'Suspended',
    'Rejected',
    'Resolved'
];
const OFFICES = [
    { name: 'Office for Road Maintenance', catId: 1 },
    { name: 'Office for Waste Management', catId: 2 },
    { name: 'Office for Urban Green Management', catId: 3 },
    { name: 'Office for Public Transportation', catId: 4 }
];
const REPORTS = [
    {
        title: "report1",
        description: "descrioption of report1",
        latitude: 45.035,
        longitude: 7.626,
        address: "Address of report1",
        userId: 1,
        catId: 1,
        statusId: 1,
        images: ['img2.png', 'img3.png'],
        anonymous: 0,
        createdAt: "Tue Nov 12 2025 15:42:10 GMT+0100",
    },
    {
        title: "report2",
        description: "descrioption of report2",
        latitude: 45.082,
        longitude: 7.634,
        address: "Address of report2",
        userId: 1,
        catId: 1,
        statusId: 1,
        images: ['img4.png', 'img5.png'],
        anonymous: 0,
        createdAt: "Tue Nov 12 2025 15:42:10 GMT+0100",
    },
    {
        title: "report3",
        description: "descrioption of report3",
        latitude: 45.058,
        longitude: 7.629,
        address: "Address of report3",
        userId: 1,
        catId: 2,
        statusId: 1,
        images: ['img6.png'],
        anonymous: 0,
        createdAt: "Tue Nov 12 2025 15:42:10 GMT+0100",
    }
]
const initializeSchema = () => {
    return new Promise((resolve, reject) => {
        db.exec(schema, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};
const insertInitialData = async () => {
    // Insert user types
    for (const type of USER_TYPES) {
        await new Promise((res, rej) =>
            db.run(`INSERT INTO user_type (id, type) VALUES (?, ?)`, [type.id, type.type], (err) => err ? rej(err) : res())
        );
    }

    // Insert users
    for (const user of USERS) {
        const hashedPassword = await bcrypt.hash(user.password, 8);
        await new Promise((res, rej) =>
            db.run(
                `INSERT INTO user (username, password, email, firstName, lastName, typeId, allowEmailNotification)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [user.username, hashedPassword, user.email, user.firstName, user.lastName, user.typeId, user.allowEmailNotification],
                (err) => err ? rej(err) : res()
            )
        );
    }

    // Insert categories
    for (const cat of REPORT_CATEGORIES) {
        await new Promise((res, rej) =>
            db.run(`INSERT INTO report_category (categoryName) VALUES (?)`, [cat], (err) => err ? rej(err) : res())
        );
    }

    // Insert status
    for (const status of REPORT_STATUSES) {
        await new Promise((res, rej) =>
            db.run(`INSERT INTO report_status (statusName) VALUES (?)`, [status], (err) => err ? rej(err) : res())
        );
    }

    // Insert office
    for (const office of OFFICES) {
        await new Promise((res, rej) =>
            db.run(`INSERT INTO office (name, catId) VALUES (?, ?)`, [office.name, office.catId], (err) => err ? rej(err) : res())
        );
    }
    await new Promise((res, rej) =>
        db.run(`INSERT INTO office_employee (officeId, userId) VALUES (?, ?)`, [1,4], (err) => err ? rej(err) : res())
    );
};
export const setupTestDatabase = async () => {
    try {
        await initializeSchema();
        await insertInitialData();
        console.log('Test database initialized successfully');
    } catch (error) {
        console.error('Error setting up test database:', error);
        throw error;
    }
};
export const teardownTestDatabase = () => {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};
export const setupAgent = () => {
    const agent = request.agent(app);
    return agent
};
export const login = async (agent, username, password) => {
    return await agent
        .post('/session')
        .send({ username, password })
};
export const loginAsUser = async (agent) => {
    return await agent
        .post('/session')
        .send({ username: "user", password: "userpassword" })
};
export const loginAsAdmin = async (agent) => {
    return await agent
        .post('/session')
        .send({ username: "admin", password: "adminpassword" })
};
export const loginAsPR = async (agent) => {
    return await agent
        .post('/session')
        .send({ username: "userPr", password: "prpassword" })
};
export const loginAsOfficer = async (agent) => {
    return await agent
        .post('/session')
        .send({ username: "userOfficer", password: "officerpassword" })
};
export const logout = async (agent) => {
    return await agent.delete('/sessions/current');
}

export const resetReports = async () => {
    let reportId;

    await new Promise((res, rej) =>
        db.run(`DELETE FROM report_image`, (err) => err ? rej(err) : res())
    );
    await new Promise((res, rej) =>
        db.run(`DELETE FROM report`, (err) => err ? rej(err) : res())
    );
    for (const report of REPORTS) {

        const result = await new Promise((res, rej) =>
            db.run(
                `INSERT INTO report (
                    title, description, latitude, longitude, address,
                    userId, catId, statusId, createdAt, anonymous
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    report.title, report.description, report.latitude, report.longitude,
                    report.address, report.userId, report.catId, report.statusId,
                    report.createdAt, report.anonymous
                ],
                function (err) {
                    if (err) return rej(err);
                    res(this);
                }
            )
        );

        reportId = result.lastID;

        for (const image of report.images) {
            const now = new Date().toISOString();

            await new Promise((res, rej) =>
                db.run(
                    `INSERT INTO report_image (reportId, imageUrl, uploadedAt)
                     VALUES (?, ?, ?)`,
                    [reportId, image, now],
                    function (err) {
                        if (err) return rej(err);
                        res(this);
                    }
                )
            );
        }
    }
};


export default {
    setupTestDatabase,
    teardownTestDatabase,
    setupAgent,
    login,
    loginAsUser,
    loginAsAdmin,
    loginAsPR,
    loginAsOfficer,
    logout,
    resetReports
};
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
    await agent
        .post('/sessions')
        .send({ username, password })
};
export const loginAsUser = async (agent) => {
    await agent
        .post('/sessions')
        .send({ username: "user", password: "userpassword" })
};
export const loginAsAdmin = async (agent) => {
    await agent
        .post('/sessions')
        .send({ username: "admin", password: "adminpassword" })
};
export const loginAsPR = async (agent) => {
    await agent
        .post('/sessions')
        .send({ username: "userPR", password: "prpassword" })
};
export const loginAsOfficer = async (agent) => {
    await agent
        .post('/sessions')
        .send({ username: "userOfficer", password: "officerpassword" })
};
export const logout = async (agent) => {
    await agent.delete('/sessions/current');
}


export default {
    setupTestDatabase,
    teardownTestDatabase,
    setupAgent,
    login,
    loginAsUser,
    loginAsAdmin,
    loginAsPR,
    loginAsOfficer,
    logout
};
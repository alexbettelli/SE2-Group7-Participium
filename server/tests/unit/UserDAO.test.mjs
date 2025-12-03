import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import bcrypt from 'bcrypt';
import UserDAO from '../../dao/UserDAO.mjs';
import {
    setupTestDatabase,
    teardownTestDatabase
} from '../setup.mjs';

describe('UserDAO', () => {

    beforeAll(async () => {
        await setupTestDatabase();
    });

    // Cleanup after all tests
    afterAll(async () => {
        await teardownTestDatabase();
    });

    describe('getUserByUsername', () => {
        it('returns user info when user exists', async () => {
            const info = await UserDAO.getUserByUsername('user');
            expect(info).toBeTruthy();
            expect(info).toHaveProperty('user');
            expect(info).toHaveProperty('password');
            expect(info.user.username).toBe('user');
        });

        it('returns null when not found', async () => {
            const info = await UserDAO.getUserByUsername('noone');
            expect(info).toBeNull();
        });

        it('handles null/undefined input gracefully', async () => {
            await expect(UserDAO.getUserByUsername(null)).resolves.toBeNull();
            await expect(UserDAO.getUserByUsername(undefined)).resolves.toBeNull();
        });
    })
    describe('getUserById', () => {
        it('should returns user by ID successfully', async () => {
            const userId = 1;

            const user = await UserDAO.getUserById(userId);

            expect(user).toBeDefined();
            expect(user.id).toBe(userId);
            expect(user).toHaveProperty('username', 'user');
        });

        it('should return null for non-existing user ID', async () => {
            const userId = 999;
            const user = await UserDAO.getUserById(userId);
            expect(user).toBeNull();
        })
    });
    describe('addNewUser', async () => {
        const userData = {
            username: 'newuser',
            password: await bcrypt.hash('password123', 8),
            email: 'test@example.com',
            firstName: 'New',
            lastName: 'User',
            typeId: 1
        };
        it('should create a new user successfully', async () => {
            const userId = await UserDAO.addNewUser(userData);
            expect(userId).toBeTypeOf('number');
            expect(userId).toBeGreaterThan(0);

            const fetched = await UserDAO.getUserByUsername('newuser');
            expect(fetched).toBeTruthy();
            expect(fetched.user.username).toBe('newuser');
        });

        it('should fail when creating user with duplicate username', async () => {
            await expect(UserDAO.addNewUser(userData)).rejects.toThrow();
        });
    })
    describe('getUnassignedEmployees', async () => {
        const unassigned_emp = {
            username: 'unassigned_emp',
            password: await bcrypt.hash('unemppass', 8),
            email: '',
            firstName: 'unassigned',
            lastName: 'emp',
            typeId: 5,
            allowEmailNotification: 0
        };
        it('should returns empty array when none are unassigned', async () => {
            const list = await UserDAO.getUnassignedEmployees();
            expect(Array.isArray(list)).toBe(true);
            expect(list.length).toBe(0);
        });
        it('should returns users with typeId == 5 successfully', async () => {
            await UserDAO.addNewUser(unassigned_emp);
            const list = await UserDAO.getUnassignedEmployees();
            expect(Array.isArray(list)).toBe(true);
            expect(list.length).toBe(1);
            expect(list.some(u => u.username === 'unassigned_emp')).toBe(true);
        });
    });
    describe('assignEmployeeToOffice', async () => {

        it('should assing an employee to an PR office successfully', async () => {
            const unassignedPR = {
                username: 'newPR',
                password: await bcrypt.hash('password123', 8),
                email: 'newPR@example.com',
                firstName: 'New',
                lastName: 'PR',
                typeId: 5
            };
            const newPRuserId = await UserDAO.addNewUser(unassignedPR);
            const assignedEmp = await UserDAO.assignEmployeeToOffice(newPRuserId, null, 3);
            expect(assignedEmp).toBe(undefined);
            const newPRuser = await UserDAO.getUserById(newPRuserId);
            console.log(newPRuser);
            expect(newPRuser.role.id).toBe(3);
        })
        it('should assing an employee to a technical office successfully', async () => {
            const unassignedOfficer = {
                username: 'newOfficer',
                password: await bcrypt.hash('password123', 8),
                email: 'newOfficer@example.com',
                firstName: 'New',
                lastName: 'Officer',
                typeId: 5
            };
            const newOfficerId = await UserDAO.addNewUser(unassignedOfficer);
            const assignedEmp = await UserDAO.assignEmployeeToOffice(newOfficerId, 2, 4);
            expect(assignedEmp).toBe(undefined);
            const newTechUser = await UserDAO.getUserById(newOfficerId);
            expect(newTechUser.role.id).toBe(4);
        })
    })    
    describe('updateUserProfile', () => {
        it('should updates user profile successfully', async () => {
            const userId = 1;
            const telegramUsername = 'new_telegram';
            const allowEmailNotification = 1;
            const imageUrl = 'image.png';

            await UserDAO.updateUserProfile(userId, telegramUsername, allowEmailNotification, imageUrl);
            const result = await UserDAO.getUserById(userId);

            expect(result).toBeDefined();
            expect(result.id).toBe(userId);
            expect(result.username).toBe('user');
            expect(result).toHaveProperty('telegramUsername', telegramUsername);
            expect(result).toHaveProperty('allowEmailNotification', allowEmailNotification);
            expect(result).toHaveProperty('imageUrl');
            expect(result.imageUrl).toContain(`/profiles/${imageUrl}`);
        });

        it('handles updating non-existing user gracefully', async () => {
            const userId = 999;
            const telegramUsername = 'ghost_telegram';
            const allowEmailNotification = 0;
            const imageUrl = 'ghost_image.png';

            const result = await UserDAO.updateUserProfile(userId, telegramUsername, allowEmailNotification, imageUrl);

            expect(result).toBeNull();
        });
    });
    describe('deleteEmployeeById', () => {
        it('should delete employee successfully', async () => {
            const employeeId = await UserDAO.addNewUser({
                username: 'todelete',
                password: await bcrypt.hash('pass', 8),
                email: 'delete@test.com',
                firstName: 'To',
                lastName: 'Delete',
                typeId: 5
            });

            await UserDAO.deleteEmployeeById(employeeId);

            const result = await UserDAO.getUserById(employeeId);
            expect(result).toBeNull();
        });
    });
});

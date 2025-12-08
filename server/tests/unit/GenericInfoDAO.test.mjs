import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import GenericInfoDAO from '../../dao/GenericInfoDAO.mjs';
import {
    setupTestDatabase,
    teardownTestDatabase
} from '../setup.mjs';

describe('GenericInfoDAO', () => {
    beforeAll(async () => {
        await setupTestDatabase();
    });

    // Cleanup after all tests
    afterAll(async () => {
        await teardownTestDatabase();
    });

    describe('getOffices', () => {
        it('returns seeded offices', async () => {
            const offices = await GenericInfoDAO.getOffices();
            expect(Array.isArray(offices)).toBe(true);
            expect(offices).toHaveLength(4);
            const names = offices.map(o => o.name);
            expect(names).toEqual(expect.arrayContaining(
                [
                    'Office for Road Maintenance',
                    'Office for Waste Management',
                    'Office for Urban Green Management',
                    'Office for Public Transportation',
                ]));
        });
    });

    describe('getCategories', () => {
        it('returns seeded categories', async () => {
            const categories = await GenericInfoDAO.getCategories();
            expect(Array.isArray(categories)).toBe(true);
            expect(categories).toHaveLength(4);
            const names = categories.map(c => c.categoryName);
            expect(names).toEqual(expect.arrayContaining(
                [
                    'Roads and Infrastructure',
                    'Waste and Cleanliness',
                    'Green Areas and Public Parks',
                    'Public Transport and Mobility'
                ]));
        })
    })
    describe('getRoles', () => {
        it('returns mucipal users roles', async () => {
            const roles = await GenericInfoDAO.getRoles();
            expect(Array.isArray(roles)).toBe(true);
            expect(roles).toHaveLength(2);
            const ids = roles.map(c => c.id);
            expect(ids).toEqual([3, 4]);
        }
        )
    })
    describe('getReportStatuses', () => {
        it('returns list of report statuses from DB', async () => {

            const result = await GenericInfoDAO.getReportStatuses();
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(6);
            const names = result.map(o => o.statusName);
            expect(names).toEqual(expect.arrayContaining(
                [
                    'Pending Approval',
                    'Assigned',
                    'In Progress',
                    'Suspended',
                    'Rejected',
                    'Resolved'
                ])
            );
        });
    });
});
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import db from '../../data/db.mjs';
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

    describe('getExternalOffices', () => {
        it('returns seeded external offices', async () => {
            const externalOffices = await GenericInfoDAO.getExternalOffices();
            expect(Array.isArray(externalOffices)).toBe(true);
            expect(externalOffices).toHaveLength(4);
            const names = externalOffices.map(o => o.name);
            expect(names).toEqual(expect.arrayContaining(
                [
                    'LAVORINCORSO',
                    'AMIAT S.p.A',
                    'ICEF S.r.l',
                    'GTT S.p.A'
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

    describe('GenericInfoDAO error handling from db failures', () => {
      it('handles db errors in getOffices', async () => {
          const dbAllMock = vi.spyOn(db, 'all').mockImplementation((query, params, callback) => {
              callback(new Error('DB error'), null);
          });
          await expect(GenericInfoDAO.getOffices()).rejects.toThrow('DB error');
          dbAllMock.mockRestore();
      });

      it('handles db errors in getExternalOffices', async () => {
          const dbAllMock = vi.spyOn(db, 'all').mockImplementation((query, params, callback) => {
              callback(new Error('DB error'), null);
          });
          await expect(GenericInfoDAO.getExternalOffices()).rejects.toThrow('DB error');
          dbAllMock.mockRestore();
      });

      it('handles db errors in getCategories', async () => {
          const dbAllMock = vi.spyOn(db, 'all').mockImplementation((query, params, callback) => {
              callback(new Error('DB error'), null);
          });
          await expect(GenericInfoDAO.getCategories()).rejects.toThrow('DB error');
          dbAllMock.mockRestore();
      });
      it('handles db errors in getRoles', async () => {
          const dbAllMock = vi.spyOn(db, 'all').mockImplementation((query, params, callback) => {
              callback(new Error('DB error'), null);
          }); 
          await expect(GenericInfoDAO.getRoles()).rejects.toThrow('DB error');
          dbAllMock.mockRestore();
      });
      it('handles db errors in getReportStatuses', async () => {
          const dbAllMock = vi.spyOn(db, 'all').mockImplementation((query, params, callback) => {
              callback(new Error('DB error'), null);
          });
          await expect(GenericInfoDAO.getReportStatuses()).rejects.toThrow('DB error');
          dbAllMock.mockRestore();
      });
    });
});


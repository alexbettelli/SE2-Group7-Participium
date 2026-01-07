import { describe, it, beforeAll, afterAll, expect, beforeEach, vi } from 'vitest';
import {
    setupTestDatabase,
    teardownTestDatabase,
    setupAgent,
    loginAsAdmin,
    logout,
    loginAsUser
} from '../setup.mjs';
import GenericInfoDAO from '../../dao/GenericInfoDAO.mjs';


describe('GET /offices', () => {

    let agent;

    beforeAll(async () => {
        await setupTestDatabase();
        agent = await setupAgent();
    });

    beforeEach(async () => {
        await logout(agent);
    });

    // Cleanup after all tests
    afterAll(async () => {
        await teardownTestDatabase();
    });
    it('200 OK', async () => {
        await loginAsAdmin(agent);
        const result = await agent.get('/offices');
        expect(result.status).toBe(200);
    });

    it('401 Unauthorized', async () => {
        const result = await agent.get('/offices');

        expect(result.status).toBe(401);

    });


    it('403 Forbidden', async () => {
        await loginAsUser(agent);
        const result = await agent.get('/offices');

        expect(result.status).toBe(403);
    });

    it('500 Internal Server Error', async () => {
        // Mock the DAO method to throw an error
        const getAllOfficesMock = vi.spyOn(GenericInfoDAO, 'getOffices').mockImplementation(() => {
            throw new Error('Database error');
        });
        await loginAsAdmin(agent);
        const result = await agent.get('/offices');
        expect(result.status).toBe(503);

        // Restore the original method
        getAllOfficesMock.mockRestore();
    });
});
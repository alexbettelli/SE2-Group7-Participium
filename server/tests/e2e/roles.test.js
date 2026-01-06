import { describe, it, beforeAll, afterAll, expect, beforeEach, vi } from 'vitest';
import {
    setupTestDatabase,
    teardownTestDatabase,
    setupAgent,
    loginAsUser,
    loginAsAdmin,
    logout
} from '../setup.mjs';
import GenericInfoDAO from '../../dao/GenericInfoDAO.mjs';

describe('GET /roles', () => {

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

    it('401 Unauthorized', async () => {        
        const result = await agent.get('/roles');        
        expect(result.status).toBe(401);
    });
    it('200 OK', async () => {
        const roles = [{ "id": 3, "type": "Municipal Public Relations Officer" }, 
            { "id": 4, "type": "Technical Office Staff Member" }, 
            { "id": 6, "type": "External Maintainer" }
        ];
     
        await loginAsAdmin(agent);
        const result = await agent.get('/roles');

        expect(result.status).toBe(200);
        expect(result.body).toEqual(roles);
    });  

    it('403 Forbidden', async () => {
        await loginAsUser(agent);
        const result = await agent.get('/roles');
        expect(result.status).toBe(403);
    });

    it('503 Service Unavailable', async () => {
        // Mock the DAO method to throw an error
        const getRolesMock = vi.spyOn(GenericInfoDAO, 'getRoles').mockImplementation(() => {
            throw new Error('Database error');
        });
        await loginAsAdmin(agent);
        const result = await agent.get('/roles');
        expect(result.status).toBe(503);
        // Restore the original method
        getRolesMock.mockRestore();
    });
});
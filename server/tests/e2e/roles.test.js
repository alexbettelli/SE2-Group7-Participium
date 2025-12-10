import { describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest';
import {
    setupTestDatabase,
    teardownTestDatabase,
    setupAgent,
    loginAsUser,
    loginAsAdmin,
    logout
} from '../setup.mjs';

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
        const roles = [{ "id": 3, "type": "Municipal Public Relations Officer" }, { "id": 4, "type": "Technical Office Staff Member" }];
     
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
});
import { describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest';
import {
    setupTestDatabase,
    teardownTestDatabase,
    setupAgent,
    loginAsAdmin,
    logout,
    loginAsUser
} from '../setup.mjs';


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
});
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
        // arrange
        const OFFICES = [
            { id: 1, name: 'Office for Road Maintenance', catId: 1 },
            { id: 2, name: 'Office for Waste Management', catId: 2 },
            { id: 3, name: 'Office for Urban Green Management', catId: 3 },
            { id: 4, name: 'Office for Public Transportation', catId: 4 }
        ];

        await loginAsAdmin(agent);
        const result = await agent.get('/offices');

        // assert
        expect(result.status).toBe(200);
        expect(result.body).toEqual(OFFICES);
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
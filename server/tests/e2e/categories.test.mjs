import { describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest';
import {
  setupTestDatabase,
  teardownTestDatabase,
  setupAgent,
  loginAsAdmin,
  logout
} from '../setup.mjs';


describe('E2E getCategories', () => {
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
  it('GET /categories - unauthorized', async () => {
    const res = await agent.get('/categories');
    expect(res.statusCode).toBe(401);
  });
  it('GET /categories - success', async () => {
    await loginAsAdmin(agent);
    const res = await agent.get('/categories');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });  
});

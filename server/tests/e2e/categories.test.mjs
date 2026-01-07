import { describe, it, beforeAll, afterAll, expect, beforeEach, vi} from 'vitest';
import {
  setupTestDatabase,
  teardownTestDatabase,
  setupAgent,
  loginAsAdmin,
  logout
} from '../setup.mjs';
import GenericInfoDAO from '../../dao/GenericInfoDAO.mjs';

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
  it('GET /categories - ok with no auth', async () => {
    const res = await agent.get('/categories');
    expect(res.statusCode).toBe(200);
  });
  it('GET /categories - success', async () => {
    await loginAsAdmin(agent);
    const res = await agent.get('/categories');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });  
  it('503 Service Unavailable', async () => {
    // Mock the DAO method to throw an error
    const getCategoriesMock = vi.spyOn(GenericInfoDAO, 'getCategories').mockImplementation(() => {
      throw new Error('Database error');
    });
    await loginAsAdmin(agent);
    const result = await agent.get('/categories');
    expect(result.status).toBe(503);
    // Restore the original method
    getCategoriesMock.mockRestore();
  });
});

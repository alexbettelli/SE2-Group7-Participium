import { describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest';
import {
  setupTestDatabase,
  teardownTestDatabase,
  setupTestUploadDirs,
  cleanupTestUploadDirs,
  setupAgent,
  loginAsUser,
  logout,
  login,
} from '../setup.mjs';
import path from 'node:path';

describe('E2E User Routes', () => {

  let agent;

  beforeAll(async () => {
    await setupTestDatabase();
    setupTestUploadDirs(); // Crea le cartelle di test per gli upload
    agent = await setupAgent();
  });

  beforeEach(async () => {
    await logout(agent);
  });

  // Cleanup after all tests
  afterAll(async () => {
    cleanupTestUploadDirs(); // Pulisce i file uploadati durante i test
    await teardownTestDatabase();
  });

  it('POST /session - wrong username', async () => {
    const res = await login(agent, 'wronguser', 'e2epassword');
    expect(res.statusCode).toBe(401);
  });

  it('POST /session - wrong password', async () => {
    const res = await login(agent, 'user', 'e2epassword');
    expect(res.statusCode).toBe(401);
  });

  it('POST /session - missing password', async () => {
    const res = await login(agent, 'user');
    expect([400, 401]).toContain(res.statusCode);
  });

  it('POST /session - login with user successfully', async () => {
    const res = await loginAsUser(agent);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('username', 'user');
  });

  it('GET /session/current - get current session for logged in user ', async () => {
    await loginAsUser(agent);
    const res = await agent.get('/session/current');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('username', 'user');
  });

  it('DELETE /sessions/current - logout', async () => {
    await loginAsUser(agent);
    const res = await agent.delete('/sessions/current');
    expect(res.statusCode).toBe(200);
  });

  it('PUT /api/user/profile - update profile with photo successfully', async () => {
    await loginAsUser(agent);

    const res = await agent.put('/api/user/profile')
      .field('telegramUsername', '@e2e_tele')
      .field('allowEmailNotification', '1')
      .attach('profilePhoto', path.join(__dirname, 'fixtures/img1.jpg'));

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body).toHaveProperty('imageUrl');
  });

  it('DELETE /api/user/profile/photo - delete profile photo', async () => {
    // First upload a profile photo
    await loginAsUser(agent);
    const uploadRes = await agent.put('/api/user/profile')
      .field('telegramUsername', '@e2e_tele_delete')
      .field('allowEmailNotification', '1')
      .attach('profilePhoto', path.join(__dirname, 'fixtures/img2.jpg'));

    expect(uploadRes.statusCode).toBe(200);
    expect(uploadRes.body).toHaveProperty('imageUrl');

    // Then delete the uploaded photo
    const deleteRes = await agent.delete('/api/user/profile/photo');
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body).toHaveProperty('message');
  });
});



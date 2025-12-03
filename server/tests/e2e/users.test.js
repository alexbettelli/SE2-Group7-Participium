import { describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest';
import {
  setupTestDatabase,
  teardownTestDatabase,
  setupAgent,
  loginAsUser,
  loginAsAdmin,
  logout,
  login,
} from '../setup.mjs';

describe('E2E User Routes', () => {

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

  const testUser = {
    username: 'e2euser',
    password: 'e2epassword',
    email: 'e2euser@example.com',
    firstName: 'E2E',
    lastName: 'User',
    typeId: 1
  };

  it('POST /user - missing password', async () => {
    const res = await agent.post('/user').send({
      username: 'nouserpass',
      email: 'nouserpass@example.com',
      firstName: 'No',
      lastName: 'Pass',
      typeId: 1
    });
    expect([400, 503]).toContain(res.statusCode);
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

  it('POST /user - register new user successfully', async () => {
    const res = await agent.post('/user').send(testUser);
    expect(res.statusCode).toBe(201);
  });
  it('POST /user - register new user with username already used', async () => {
    const res = await agent.post('/user').send(testUser);
    expect(res.statusCode).toBe(409);
    expect(res.body).toBeDefined();
    expect(res.body).toHaveProperty('error');
    
  });

  it('POST /session - login with user successfully', async () => {
    const res = await loginAsUser(agent);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('username', 'user');
  });
  it('POST /session - login with user successfully', async () => {
    const res = await agent.post('/session').send({
      username: testUser.username,
      password: testUser.password
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('username', testUser.username);
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
      .attach('profilePhoto', Buffer.from('fakeimage'), 'photo.jpg');

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();

    expect(res.body).toHaveProperty('imageUrl');
    
  });

  it('DELETE /api/user/profile/photo - delete profile photo', async () => {
    await loginAsUser(agent);

    const res = await agent.delete('/api/user/profile/photo');
    expect([200, 401, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('message');
    } else {
      expect(res.body).toHaveProperty('error');
    }
  });
});



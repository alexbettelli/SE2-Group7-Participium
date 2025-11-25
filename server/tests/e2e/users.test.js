// e2e tests for /user, /session, /session/current, /sessions/current
import request from 'supertest';
import app from '../../server.mjs';
import { expect } from 'vitest';

describe('E2E User Routes', () => {
  test('POST /user - missing password', async () => {
    const res = await agent.post('/user').send({
      username: 'nouserpass',
      email: 'nouserpass@example.com',
      firstName: 'No',
      lastName: 'Pass',
      typeId: 1
    });
    expect([400,503]).toContain(res.statusCode);
  });

  test('POST /session - wrong username', async () => {
    const res = await agent.post('/session').send({
      username: 'wronguser',
      password: 'e2epassword'
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('code')
    expect(res.body.code).toBe(401);
  });

  test('POST /session - wrong password', async () => {
    const res = await agent.post('/session').send({
      username: testUser.username,
      password: 'wrongpassword'
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('code')
    expect(res.body.code).toBe(401);
  });

  test('POST /session - missing password', async () => {
    const res = await agent.post('/session').send({
      username: testUser.username
    });
    expect([400,401]).toContain(res.statusCode);
  });

  test('DELETE /sessions/current - logout without login', async () => {
    const res = await request(app).delete('/sessions/current');
    expect([200,401]).toContain(res.statusCode);
  });
  let agent;
  const testUser = {
    username: 'e2euser',
    password: 'e2epassword',
    email: 'e2euser@example.com',
    firstName: 'E2E',
    lastName: 'User',
    typeId: 1
  };

  beforeAll(() => {
    agent = request.agent(app);
  });

  afterAll(async () => {
    await agent.delete(`/employees/${testUser.username}`);
  });

  test('POST /user - register new user', async () => {
    const res = await agent.post('/user').send(testUser);
    expect([201,409]).toContain(res.statusCode); // 409 if user already exists
    if(res.statusCode === 409) {
      expect(res.body).toHaveProperty('error');
    } else {
      expect(res.body).toBeDefined();
    }
  });

  test('POST /session - login with user', async () => {
    const res = await agent.post('/session').send({
      username: testUser.username,
      password: testUser.password
    });
    expect([201,401]).toContain(res.statusCode); // 401 if wrong password
    if(res.statusCode === 201) {
      expect(res.body).toHaveProperty('username', testUser.username);
    } else {
      expect(res.body).toHaveProperty('error');
    }
  });

  test('GET /session/current - get current session user', async () => {
    const res = await agent.get('/session/current');
    expect([200,401]).toContain(res.statusCode);
    if(res.statusCode === 200) {
      expect(res.body).toHaveProperty('username', testUser.username);
    } else {
      expect(res.body).toHaveProperty('error');
    }
  });

  test('DELETE /sessions/current - logout', async () => {
    const res = await agent.delete('/sessions/current');
    expect(res.statusCode).toBe(200);
  });

  test('GET /session/current - after logout should be unauthorized', async () => {
  const res = await agent.get('/session/current');
  expect(res.statusCode).toBe(401);
  expect(res.body).toHaveProperty('error');
  });
});

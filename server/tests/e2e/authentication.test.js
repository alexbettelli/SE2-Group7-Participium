import { describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest';
import {
  setupTestDatabase,
  teardownTestDatabase,
  setupAgent,
  logout
} from '../setup.mjs';

describe('E2E Authentication Routes', () => {
  let agent;

  beforeAll(async () => {
    await setupTestDatabase();
    agent = await setupAgent();
  });

  beforeEach(async () => {
    await logout(agent);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('POST /users/temporary', () => {
    const newUser = {
      username: 'newtempuser',
      password: 'newtemppassword',
      email: 'newtemp@example.com',
      firstName: 'New',
      lastName: 'Temp',
      typeId: 1,
      allowEmailNotifications: 1
    };

    it('201 OK', async () => {
      const res = await agent.post('/users/temporary').send(newUser);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message');
    });

    it('409 Conflict when username exists', async () => {
      const existingUser = {
        username: 'user',
        password: 'password123',
        email: 'existing@example.com',
        firstName: 'Existing',
        lastName: 'User',
        typeId: 1
      };
      const res = await agent.post('/users/temporary').send(existingUser);
      expect(res.statusCode).toBe(409);
    });

    it('400 Bad Request when OTP already valid', async () => {
      await agent.post('/users/temporary').send(newUser);
      const res = await agent.post('/users/temporary').send(newUser);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /otp/resend', () => {
    const tempUser = {
      username: 'resenduser',
      password: 'resendpassword',
      email: 'resend@example.com',
      firstName: 'Resend',
      lastName: 'User',
      typeId: 1
    };

    it('400 Bad Request when no temp user', async () => {
      const res = await agent.post('/otp/resend');
      expect(res.statusCode).toBe(400);
    });

    it('400 Bad Request when resend too soon', async () => {
      await agent.post('/users/temporary').send(tempUser);
      const res = await agent.post('/otp/resend');
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /users/temporary/verify', () => {
    const verifyUser = {
      username: 'verifyuser',
      password: 'verifypassword',
      email: 'verify@example.com',
      firstName: 'Verify',
      lastName: 'User',
      typeId: 1
    };

    it('400 Bad Request when no OTP found', async () => {
      const res = await agent.post('/users/temporary/verify').send({ otp: '123456' });
      expect(res.statusCode).toBe(400);
    });

    it('400 or 500 when OTP missing', async () => {
      await agent.post('/users/temporary').send(verifyUser);
      const res = await agent.post('/users/temporary/verify').send({});
      expect([400, 500]).toContain(res.statusCode);
    });

    it('400 Bad Request when OTP invalid', async () => {
      await agent.post('/users/temporary').send(verifyUser);
      const res = await agent.post('/users/temporary/verify').send({ otp: 'wrongotp' });
      expect(res.statusCode).toBe(400);
    });
  });
});


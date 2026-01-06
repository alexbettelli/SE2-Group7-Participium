import { describe, it, beforeAll, afterAll, expect, beforeEach, vi } from 'vitest';
import {
  setupTestDatabase,
  teardownTestDatabase,
  setupAgent,
  logout
} from '../setup.mjs';
import bcrypt from 'bcrypt';
import UserDAO from '../../dao/UserDAO.mjs';

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

    it('503 Bad Request', async () => {
      const invalidUser = {
        email: 'invalidemail',
        firstName: '',
        lastName: '',
        typeId: 1
      };
      const res = await agent.post('/users/temporary').send(invalidUser);
      expect(res.statusCode).toBe(503);
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

  describe('Bot verification endpoints', () => {
    it('POST /bot/verify/username -> 400 when telegramUsername missing', async () => {
      const res = await agent.post('/bot/verify/username').send({});
      expect(res.statusCode).toBe(400);
    });

    it('POST /bot/verify/username -> 404 when telegram username not found', async () => {
      const res = await agent.post('/bot/verify/username').send({ telegramUsername: '@noone' });
      expect(res.statusCode).toBe(404);
    });

    it('POST /bot/verify/username -> 200 returns username string when exists', async () => {
      const plain = 'bottemp123';
      const hashed = await bcrypt.hash(plain, 8);
      const user = {
        username: 'bot_verify_user',
        password: hashed,
        email: 'botverify@example.com',
        firstName: 'Bot',
        lastName: 'Verify',
        typeId: 1,
        allowEmailNotifications: 0
      };
      const created = await UserDAO.addNewUser(user);
      const id = created.id ?? created;
      await UserDAO.updateUserProfile(id, '@botverify');

      const res = await agent.post('/bot/verify/username').send({ telegramUsername: '@botverify' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('username');
      expect(typeof res.body.username).toBe('string');
      expect(res.body.username).toBe('bot_verify_user');
    });

    it('POST /bot/verify/username -> 503 and logs error when DAO throws', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const daoSpy = vi.spyOn(UserDAO, 'getUsernameByTelegramUsername').mockRejectedValue(new Error('simulated username DAO failure'));

      const res = await agent.post('/bot/verify/username').send({ telegramUsername: '@anything' });
      expect(res.statusCode).toBe(503);
      expect(consoleSpy).toHaveBeenCalled();
      const calledWith = consoleSpy.mock.calls.map(c => String(c[0])).join(' ');
      expect(calledWith).toMatch(/simulated username DAO failure/);

      daoSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('POST /bot/verify/password -> 400 when fields missing', async () => {
      const r1 = await agent.post('/bot/verify/password').send({ username: 'x' });
      expect(r1.statusCode).toBe(400);
      const r2 = await agent.post('/bot/verify/password').send({ password: 'x' });
      expect(r2.statusCode).toBe(400);
    });

    it('POST /bot/verify/password -> 401 when username not found or wrong password', async () => {
      const r1 = await agent.post('/bot/verify/password').send({ username: 'no_user', password: 'p' });
      expect(r1.statusCode).toBe(401);
      expect(r1.body).toHaveProperty('valid', false);

      const plain = 'rightpass';
      const hashed2 = await bcrypt.hash(plain, 8);
      const user2 = {
        username: 'botpw_user2',
        password: hashed2,
        email: 'botpw2@example.com',
        firstName: 'BotPW2',
        lastName: 'User2',
        typeId: 1,
        allowEmailNotifications: 0
      };
      await UserDAO.addNewUser(user2);

      const r2 = await agent.post('/bot/verify/password').send({ username: 'botpw_user2', password: 'wrong' });
      expect(r2.statusCode).toBe(401);
      expect(r2.body).toHaveProperty('valid', false);
    });

    it('POST /bot/verify/password -> 200 returns token and user on valid credentials', async () => {
      const plain = 'safepass123';
      const hashed = await bcrypt.hash(plain, 8);
      const user = {
        username: 'botpw_valid2',
        password: hashed,
        email: 'botpwvalid2@example.com',
        firstName: 'Valid2',
        lastName: 'User2',
        typeId: 1,
        allowEmailNotifications: 0
      };
      await UserDAO.addNewUser(user);

      const res = await agent.post('/bot/verify/password').send({ username: 'botpw_valid2', password: plain });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('valid', true);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('username', 'botpw_valid2');
    });

    it('POST /bot/verify/password -> 503 and logs error when DAO throws', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const daoSpy = vi.spyOn(UserDAO, 'getUserByUsername').mockRejectedValue(new Error('simulated password DAO failure'));

      const res = await agent.post('/bot/verify/password').send({ username: 'any', password: 'any' });
      expect(res.statusCode).toBe(503);
      expect(consoleSpy).toHaveBeenCalled();
      const calledWith = consoleSpy.mock.calls.map(c => String(c[0])).join(' ');
      expect(calledWith).toMatch(/simulated password DAO failure/);

      daoSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
});


import { describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest';
import {
  setupTestDatabase,
  teardownTestDatabase,
  setupAgent,
  loginAsUser,
  loginAsOfficer,
  logout
} from '../setup.mjs';
import NotificationDAO from '../../dao/NotificationDAO.mjs';





describe('E2E notifications routes', () => {
  let agent;
  let userId;
  const reportId = 1;
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
  describe('E2E /notifications', () => {
    it('should create a notification with valid data (null senderId)', async () => {
      const user = await loginAsOfficer(agent);
      userId = user.body.id
      const res = await agent.post('/notifications').send({
        reportId,
        senderId: null,
        receiverId: userId,
        text: "Another test notification",
        channelId: 1
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.text).toBe("Another test notification");
    });

    it('should create a notification with valid data', async () => {
      const user = await loginAsOfficer(agent);
      userId = user.body.id
      const res = await agent.post('/notifications').send({
        reportId,
        senderId: userId,
        receiverId: 1,
        text: "Another test notification",
        channelId: 1
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.text).toBe("Another test notification");
    });
    it('should fail with 400 if data is invalid', async () => {
      await loginAsOfficer(agent);
      const res = await agent.post('/notifications').send({});
      expect(res.status).toBe(400);
    });
    it('should fail with 503 on database error', async () => {
      // Mock the DAO method to throw an error
      const createNotificationMock = vi.spyOn(NotificationDAO, 'createNotification').mockImplementation(() => {
        throw new Error('Database error');
      });
      await loginAsOfficer(agent);
      const res = await agent.post('/notifications').send({
        reportId,
        senderId: userId,
        receiverId: 1,
        text: "Another test notification",
        channelId: 1
      });
      expect(res.status).toBe(503);
      // Restore the original method
      createNotificationMock.mockRestore();
    });

  });

  describe('E2E /notifications/read', () => {   

    it('should mark citizen notifications as read with valid reportId', async () => {
      await loginAsUser(agent);
      const res = await agent.post('/notifications/read').send({ reportId });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('readNotifications');
      expect(res.body.readNotifications).toBe(1);
    });
    it('should mark citizen notifications as read with valid reportId', async () => {
      await loginAsOfficer(agent);
      const res = await agent.post('/notifications/read').send({ reportId });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('readNotifications');
      expect(res.body.readNotifications).toBe(1);
    });

    it('should fail with 400 if reportId is missing', async () => {
      await loginAsUser(agent);
      const res = await agent.post('/notifications/read').send({});
      expect(res.status).toBe(400);
    });
    it('should fail with 500 on database error', async () => {
      // Mock the DAO method to throw an error

      const markNotificationsAsReadMock = vi.spyOn(NotificationDAO, 'setNotificationsAsRead').mockImplementation(() => {
        throw new Error('Database error');
      });
      await loginAsUser(agent);
      const res = await agent.post('/notifications/read').send({ reportId });
      expect(res.status).toBe(500);
      // Restore the original method
      markNotificationsAsReadMock.mockRestore();
    });
  });
});

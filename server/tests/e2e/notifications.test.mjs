import { describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest';
import {
  setupTestDatabase,
  teardownTestDatabase,
  setupAgent,
  loginAsUser,
  loginAsOfficer,
  logout
} from '../setup.mjs';






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
  });
});

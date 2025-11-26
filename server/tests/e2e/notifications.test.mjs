import request from 'supertest';
import app from '../../server.mjs';
import db from '../../dao/DAO.mjs';
import path from 'path';
const fakeImagePath = path.join(__dirname, 'fixtures', 'img1.jpg');

let agent;
let userId;
let reportId;
let notificationId;

const testUser = {
  username: 'notifuser',
  password: 'notifpass',
  email: 'notifuser@example.com',
  firstName: 'Notif',
  lastName: 'User',
  typeId: 1
};

beforeAll(async () => {
  agent = request.agent(app);
//create test user
  let userRes = await agent.post('/user').send(testUser);
  if (userRes.status === 201) {
    userId = userRes.body.id;
  }
//login with created user
  const loginRes = await agent.post('/session').send({
    username: testUser.username,
    password: testUser.password
  });
  userId = loginRes.body.id; 

  const reportRes = await agent
    .post('/users/reports')
    .field('title', 'Test Report')
    .field('description', 'Test notification report')
    .field('catId', 1)
    .field('officeId', 1)
    .field('latitude', "45.0703")
    .field('longitude', "7.6868")
    .attach('images', fakeImagePath);

  reportId = reportRes.body.reportId;

  const notifRes = await agent.post('/notifications').send({
    reportId,
    senderId: userId,
    receiverId: userId,
    text: "Test notification",
    channelId: 1
  });
  notificationId = notifRes.body.id;
});

afterAll(async () => {
  if (notificationId) {
    await db.run?.('DELETE FROM notifications WHERE id = ?', [notificationId]);
  }

  if (userId) {
    await db.run?.('DELETE FROM notifications WHERE senderId = ? OR receiverId = ?', [userId, userId]);
  }

  if (reportId) {
    await db.run?.('DELETE FROM reports WHERE id = ?', [reportId]);
  }

  if (userId) {
    await db.run?.('DELETE FROM users WHERE id = ?', [userId]);
  }
});

describe('E2E /notifications', () => {
  it('should create a notification with valid data', async () => {
    const res = await agent.post('/notifications').send({
      reportId,
      senderId: userId,
      receiverId: userId,
      text: "Another test notification",
      channelId: 1
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.text).toBe("Another test notification");
    //cleanup
    await agent.delete(`/notifications/${res.body.id}`);
  });

  it('should fail with 400 if data is invalid', async () => {
    const res = await agent.post('/notifications').send({});
    expect(res.status).toBe(400);
  });

  it('should return 503 if DAO.createNotification throws', async () => {
    const original = db.createNotification;
    //mock that throws error
    db.createNotification = async () => { throw new Error('DB error'); };

    const res = await agent.post('/notifications').send({
      reportId: 9999,
      senderId: userId,
      receiverId: userId,
      text: "Errore",
      channelId: 1
    });
    expect(res.status).toBe(503);
    //restore original method
    db.createNotification = original;
  });

  it('should return 500 if DAO.setNotificationsAsRead throws', async () => {
    const original = db.setNotificationsAsRead;
    // mock that throws error
    db.setNotificationsAsRead = async () => { throw new Error('DB error'); };
    const res = await agent.post('/notifications/read').send({ reportId: 9999 });
    expect(res.status).toBe(500);
    // restore original method
    db.setNotificationsAsRead = original;
  });
});

describe('E2E /notifications/read', () => {
  it('should mark notifications as read with valid reportId', async () => {
    const res = await agent.post('/notifications/read').send({ reportId });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('readNotifications');
  });

  it('should fail with 400 if reportId is missing', async () => {
    const res = await agent.post('/notifications/read').send({});
    expect(res.status).toBe(400);
  });


});
import request from 'supertest';
import app from '../../server.mjs';
import db from '../../dao/DAO.mjs';
import path from 'path';
import fs from 'fs';

let agent;
const userId = 25; 
let reportId;
let notificationToReadId;
let imageFilename;

const fakeImagePath = path.join(__dirname, 'fixtures', 'img1.jpg');

beforeAll(async () => {
  agent = request.agent(app);
  await agent.post('/session').send({
    username: 'mario.rossi',
    password: 'mariorossi'
  });


  const reportRes = await agent
    .post('/users/reports')
    .field('title', 'Test Report Notifiche')
    .field('description', 'Report per test notifiche')
    .field('catId', 1)
    .field('officeId', 1)
    .field('latitude', "45.0703")
    .field('longitude', "7.6868")
    .field('address', 'Via Test 123')
    .attach('images', fakeImagePath);

  expect(reportRes.status).toBe(201);
  reportId = reportRes.body.reportId;

  imageFilename = reportRes.body.images[0]?.imageUrl?.split('/').pop();
});

afterAll(async () => {
  await db.run('DELETE FROM notification WHERE reportId = ?', [reportId]);
  await db.run('DELETE FROM report_image WHERE reportId = ?', [reportId]);
  await db.run('DELETE FROM report WHERE id = ?', [reportId]);
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
    
    await db.run('DELETE FROM notification WHERE id = ?', [res.body.id]);
  });

  it('should fail with 400 if data is invalid', async () => {
    const res = await agent.post('/notifications').send({});
    expect(res.status).toBe(400);
  });

  it('should return 503 if DAO.createNotification throws', async () => {
    const original = db.createNotification;
    db.createNotification = async () => { throw new Error('DB error'); };

    const res = await agent.post('/notifications').send({
      reportId: 9999,
      senderId: userId,
      receiverId: userId,
      text: "Errore",
      channelId: 1
    });
    expect(res.status).toBe(503);

    db.createNotification = original;
  });

  it('should return 500 if DAO.setNotificationsAsRead throws', async () => {
    const original = db.setNotificationsAsRead;
    db.setNotificationsAsRead = async () => { throw new Error('DB error'); };
    const res = await agent.post('/notifications/read').send({ reportId: 9999 });
    expect(res.status).toBe(500);
    db.setNotificationsAsRead = original;
  });
});

describe('E2E /notifications/read', () => {
  beforeEach(async () => {
    const res = await agent.post('/notifications').send({
      reportId,
      senderId: userId,
      receiverId: userId,
      text: "Notifica da marcare come letta",
      channelId: 1
    });
    notificationToReadId = res.body.id;
  });

  afterEach(async () => {

    await db.run('DELETE FROM notification WHERE id = ?', [notificationToReadId]);
  });

  it('should mark notifications as read with valid reportId', async () => {
    const before = await db.all('SELECT isRead FROM notification WHERE id = ?', [notificationToReadId]);
    expect(before[0].isRead).toBe(0);

    const res = await agent.post('/notifications/read').send({ reportId });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('readNotifications');

    const after = await db.all('SELECT isRead FROM notification WHERE id = ?', [notificationToReadId]);
    expect(after[0].isRead).toBe(1);
  });

  it('should fail with 400 if reportId is missing', async () => {
    const res = await agent.post('/notifications/read').send({});
    expect(res.status).toBe(400);
  });
});
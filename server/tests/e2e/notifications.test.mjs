import request from 'supertest';
import app from '../../server.mjs';
import db from '../../dao/DAO.mjs';


let agent;
let userId;
const reportId = 38; // <-- usa qui l'id di un report ESISTENTE nel db
let notificationToReadId;

beforeAll(async () => {
  agent = request.agent(app);
  const loginRes = await agent.post('/session').send({
    username: 'Itacyma',
    password: 'ClaudioMartini'
  });
  userId = loginRes.body.id;
  console.log('User loggato:', userId);
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
    // Log notifica creata
    const notif = await db.all('SELECT * FROM notification WHERE id = ?', [notificationToReadId]);
    console.log('Notifica creata:', notif[0]);
  });

  afterEach(async () => {
    await db.run('DELETE FROM notification WHERE id = ?', [notificationToReadId]);
  });

  it('should mark notifications as read with valid reportId', async () => {
    const before = await db.all('SELECT * FROM notification WHERE id = ?', [notificationToReadId]);
    console.log('Prima della read:', before[0]);

    const res = await agent.post('/notifications/read').send({ reportId });
    console.log('Risposta /notifications/read:', res.status, res.body);

    const after = await db.all('SELECT * FROM notification WHERE id = ?', [notificationToReadId]);
    console.log('Dopo la read:', after[0]);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('readNotifications');
    expect(after[0].isRead).toBe(1);
  });

  it('should fail with 400 if reportId is missing', async () => {
    const res = await agent.post('/notifications/read').send({});
    expect(res.status).toBe(400);
  });
});
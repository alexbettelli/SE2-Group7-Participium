import { describe, it, expect, vi, beforeEach } from "vitest";
import request from 'supertest';
import app from "../../server.mjs";
import DAO from "../../dao/DAO.mjs";
import path from "path";

vi.spyOn(DAO, 'addNewReport');
vi.spyOn(DAO, 'rejectReport');
vi.spyOn(DAO, 'createNotification');
vi.spyOn(DAO, 'assignReportToOfficer');


beforeEach(() => {
    vi.clearAllMocks();
});

describe('POST /reports', () => {
    it('201 OK', async () => {
        // arrange
        const credentials = { "username": "mario.rossi", "password": "mariorossi" };
        
        // act
        const auth = await request(app).post('/session').send(credentials);
        const result = await request(app).post('/users/reports').set('Cookie', auth.headers['set-cookie'] ?? [])
            .field('title', 'Test report')
            .field('description', 'Some description')
            .field('latitude', '12.34')
            .field('longitude', '56.78')
            .field('address', '123 Street')
            .field('catId', '1')
            .attach('images', path.join(__dirname, 'fixtures/img1.jpg'))
            .attach('images', path.join(__dirname, 'fixtures/img2.jpg'))
            .attach('images', path.join(__dirname, 'fixtures/img3.jpg'));

        // assert
        expect(result.status).toBe(201);
        expect(DAO.addNewReport).toHaveBeenCalledTimes(1);
        
    });

    it('400 Bad Request', async () => {
        // arrange
        const credentials = { "username": "mario.rossi", "password": "mariorossi" };

        // act
        const auth = await request(app).post('/session').send(credentials);
        const result = await request(app).post('/users/reports').set('Cookie', auth.headers['set-cookie'] ?? [])
            .field('title', 'Test report')
            .field('description', 'Some description')
            .field('latitude', '12.34')
            .field('longitude', '56.78')
            .field('address', '123 Street')
            .field('catId', '1');

        // assert
        expect(result.status).toBe(400);
        expect(DAO.addNewReport).toHaveBeenCalledTimes(0);
    });

    it('401 Unauthorized', async () => {
        // act
        const result = await request(app).post('/users/reports');

        // assert
        expect(result.status).toBe(401);
        expect(DAO.addNewReport).toHaveBeenCalledTimes(0);
    });
});

describe('GET /reports/unassigned', () => {
    it('401 Unauthorized when not logged in', async () => {
        const res = await request(app).get('/reports/unassigned');
        expect(res.statusCode).toBe(401);
    });

    it('403 Forbidden for non PR officer', async () => {
        const auth = await request(app).post('/session').send({ username: 'mario.rossi', password: 'mariorossi' });
        const res = await request(app)
            .get('/reports/unassigned')
            .set('Cookie', auth.headers['set-cookie'] ?? []);

        expect(res.statusCode).toBe(403);
    });

    it('200 OK and returns an array for PR officer', async () => {
        const auth = await request(app).post('/session').send({ username: 'carla.rossi', password: 'CarlaRossi' });
        expect(auth.statusCode).toBe(201);
        const res = await request(app)
            .get('/reports/unassigned')
            .set('Cookie', auth.headers['set-cookie'] ?? []);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

describe('GET /reports/assigned', () => {
    it('401 Unauthorized when not logged in', async () => {
        const res = await request(app).get('/reports/assigned');
        expect(res.statusCode).toBe(401);
    });

    it('403 Forbidden for non technician user', async () => {
        const auth = await request(app).post('/session').send({ username: 'mario.rossi', password: 'mariorossi' });
        const res = await request(app)
            .get('/reports/assigned')
            .set('Cookie', auth.headers['set-cookie'] ?? []);

        expect(res.statusCode).toBe(403);
    });

    it('200 OK and returns an array for technician', async () => {
        const auth = await request(app).post('/session').send({ username: 'giulio.verdi', password: 'GiulioVerdi' });
        expect(auth.statusCode).toBe(201);
        const res = await request(app)
            .get('/reports/assigned')
            .set('Cookie', auth.headers['set-cookie'] ?? []);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

describe('GET /reports/statuses', () => {
    it('401 Unauthorized when not logged in', async () => {
        const res = await request(app).get('/reports/statuses');
        expect(res.statusCode).toBe(401);
    });

    it('200 OK and returns an array when logged in', async () => {
        const auth = await request(app).post('/session').send({ username: 'mario.rossi', password: 'mariorossi' });
        const res = await request(app)
            .get('/reports/statuses')
            .set('Cookie', auth.headers['set-cookie'] ?? []);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

describe('GET /users/myreports', () => {
    it('401 Unauthorized when not logged in', async () => {
        const res = await request(app).get('/users/myreports');
        expect(res.statusCode).toBe(401);
    });

    it('200 OK and returns an array for logged in citizen', async () => {
        const auth = await request(app).post('/session').send({ username: 'mario.rossi', password: 'mariorossi' });
        const res = await request(app)
            .get('/users/myreports')
            .set('Cookie', auth.headers['set-cookie'] ?? []);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

describe('PATCH /reports/:id', () => {
    const existingAssignedReportId = 35; // assigned to technician giulio.verdi
    const nonExistingReportId = -1; // id that does not exist in the DB

    it('401 Unauthorized when not logged in', async () => {
        const res = await request(app).patch(`/reports/${existingAssignedReportId}`).query({ statusId: 3 });
        expect(res.statusCode).toBe(401);
    });

    it('403 Forbidden for non technician user', async () => {
        const auth = await request(app).post('/session').send({ username: 'mario.rossi', password: 'mariorossi' });
        const res = await request(app)
            .patch(`/reports/${existingAssignedReportId}`)
            .query({ statusId: 3 })
            .set('Cookie', auth.headers['set-cookie'] ?? []);

        expect(res.statusCode).toBe(403);
    });

    it('404 Not Found for report not assigned to technician', async () => {
        const auth = await request(app).post('/session').send({ username: 'giulio.verdi', password: 'GiulioVerdi' });
        expect(auth.statusCode).toBe(201);
        const res = await request(app)
            .patch(`/reports/${nonExistingReportId}`)
            .query({ statusId: 3 })
            .set('Cookie', auth.headers['set-cookie'] ?? []);

        expect([404, 500]).toContain(res.statusCode);
    });

    it('200 OK when technician updates status of an assigned report', async () => {
        const auth = await request(app).post('/session').send({ username: 'giulio.verdi', password: 'GiulioVerdi' });
        expect(auth.statusCode).toBe(201);
        const res = await request(app)
            .patch(`/reports/${existingAssignedReportId}`)
            .query({ statusId: 3 })
            .set('Cookie', auth.headers['set-cookie'] ?? []);

        expect(res.statusCode).toBe(200);
    });
});

describe('POST /reports/assign', () => {
    it('401 Unauthorized when not logged in', async () => {
        const res = await request(app).post('/reports/assign').send({ reportId: 1, technicianId: 2 });
        expect(res.status).toBe(401);
        expect(DAO.assignReportToOfficer).toHaveBeenCalledTimes(0);
    });
    it('403 Forbidden for non PR officer', async () => {
        const auth = await request(app).post('/session').send({ username: 'mario.rossi', password: 'mariorossi' });
        const res = await request(app)
            .post('/reports/assign')
            .set('Cookie', auth.headers['set-cookie'] ?? [])
            .send({ reportId: 1, technicianId: 2 });
        expect(res.status).toBe(403);
        expect(DAO.assignReportToOfficer).toHaveBeenCalledTimes(0);
    });

    it('200 OK and triggers DAO.assignReportToOfficer for PR officer', async () => {
        const auth = await request(app).post('/session').send({ username: 'carla.rossi', password: 'CarlaRossi' });
        expect(auth.status).toBe(201);
        const payload = { reportId : 1, userId : 1, categoryId: 1, officeId: 1, officerId: 1 };
        const res = await request(app)
            .post('/reports/assign')
            .set('Cookie', auth.headers['set-cookie'] ?? [])
            .send(payload);
        expect(res.status).toBe(200);
        
        expect(DAO.assignReportToOfficer).toHaveBeenCalledTimes(1);
    });
});


describe('POST /reports/reject', () => {
  it('401 Unauthorized when not logged in', async () => {
    const res = await request(app).post('/reports/reject').send({ reportId: 1, userId: 1, reason: 'reason' });
    expect(res.status).toBe(401);
    expect(DAO.rejectReport).toHaveBeenCalledTimes(0);
    expect(DAO.createNotification).toHaveBeenCalledTimes(0);
  });

  it('403 Forbidden for non PR officer', async () => {
    const auth = await request(app).post('/session').send({ username: 'mario.rossi', password: 'mariorossi' });
    const res = await request(app)
      .post('/reports/reject')
      .set('Cookie', auth.headers['set-cookie'] ?? [])
      .send({ reportId: 1, userId: 1, reason: 'reason' });

    expect(res.status).toBe(403);
    expect(DAO.rejectReport).toHaveBeenCalledTimes(0);
    expect(DAO.createNotification).toHaveBeenCalledTimes(0);
  });

  it('200 OK and triggers DAO.rejectReport and DAO.createNotification for PR officer', async () => {
    const auth = await request(app).post('/session').send({ username: 'carla.rossi', password: 'CarlaRossi' });
    expect(auth.status).toBe(201);

    const payload = { reportId: 1, userId: 1, reason: 'Not valid' };
    const res = await request(app)
      .post('/reports/reject')
      .set('Cookie', auth.headers['set-cookie'] ?? [])
      .send(payload);

    expect(res.status).toBe(200);
    expect(DAO.rejectReport).toHaveBeenCalledTimes(1);
    expect(DAO.createNotification).toHaveBeenCalledTimes(1);
  });

});

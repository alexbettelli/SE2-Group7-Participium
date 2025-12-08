import { describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest';
import {
    setupTestDatabase,
    teardownTestDatabase,
    setupTestUploadDirs,
    cleanupTestUploadDirs,
    resetReports,
    setupAgent,
    loginAsUser,
    loginAsOfficer,
    loginAsPR,
    logout
} from '../setup.mjs';
import path from "path";

describe('E2E reports routes', () => {
    let agent;

    beforeAll(async () => {
        await setupTestDatabase();
        await resetReports();
        setupTestUploadDirs();
        agent = await setupAgent();
    });

    beforeEach(async () => {
        await logout(agent);
    });
    // Cleanup after all tests
    afterAll(async () => {
        cleanupTestUploadDirs();
        await teardownTestDatabase();
    });
    describe('GET /reports/statuses', () => {
        it('401 Unauthorized when not logged in', async () => {
            const res = await agent.get('/reports/statuses');
            expect(res.statusCode).toBe(401);
        });

        it('200 OK and returns an array when logged in', async () => {
            await loginAsOfficer(agent);
            const res = await agent.get('/reports/statuses');

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });
    describe('POST /reports', () => {
        it('201 OK', async () => {
            await loginAsUser(agent)
            const result = await agent.post('/users/reports')
                .field('title', 'Test report')
                .field('description', 'Some description')
                .field('latitude', '12.34')
                .field('longitude', '56.78')
                .field('address', '123 Street')
                .field('catId', 1)
                .attach('images', path.join(__dirname, 'fixtures/img1.jpg'))
                .attach('images', path.join(__dirname, 'fixtures/img2.jpg'))
                .attach('images', path.join(__dirname, 'fixtures/img3.jpg'));

            expect(result.status).toBe(201);

        });

        it('400 Bad Request - no images', async () => {
            await loginAsUser(agent)

            const result = await agent.post('/users/reports')
                .field('title', 'Test report')
                .field('description', 'Some description')
                .field('latitude', '12.34')
                .field('longitude', '56.78')
                .field('address', '123 Street')
                .field('catId', '1');

            expect(result.status).toBe(400);
        });

        it('401 Unauthorized', async () => {
            const result = await agent.post('/users/reports');
            expect(result.status).toBe(401);
        });
    });
    describe('GET /reports', () => {
        it('401 Unauthorized when not logged in', async () => {
            const res = await agent.get('/users/myreports');
            expect(res.statusCode).toBe(401);
        });

        it('200 OK and returns an array for logged in citizen', async () => {
            await loginAsUser(agent);
            const res = await agent.get('/reports');

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });
    describe('GET /users/myreports', () => {
        it('401 Unauthorized when not logged in', async () => {
            const res = await agent.get('/users/myreports');
            expect(res.statusCode).toBe(401);
        });

        it('200 OK and returns an array for logged in citizen', async () => {
            await loginAsUser(agent);
            const res = await agent.get('/users/myreports');

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });
    describe('GET /reports/unassigned', () => {
        it('401 Unauthorized when not logged in', async () => {
            const res = await agent.get('/reports/unassigned');
            expect(res.statusCode).toBe(401);
        });

        it('403 Forbidden for non PR officer', async () => {
            await loginAsUser(agent);
            const res = await agent.get('/reports/unassigned');

            expect(res.statusCode).toBe(403);
        });

        it('200 OK and returns an array for PR officer', async () => {
            await loginAsPR(agent)
            const res = await agent.get('/reports/unassigned');

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body.length).toBe(4); // All reports are unassigned initially 3+1
        });
    });
    describe('POST /reports/assign', () => {
        it('401 Unauthorized when not logged in', async () => {
            const res = await agent.post('/reports/assign').send({ reportId: 1, technicianId: 4 });
            expect(res.status).toBe(401);
        });
        it('403 Forbidden for non PR officer', async () => {
            await loginAsUser(agent);
            const res = await agent
                .post('/reports/assign')
                .send({ reportId: 1, technicianId: 4 });
            expect(res.status).toBe(403);
        });

        it('200 OK for PR officer', async () => {
            await loginAsPR(agent)
            const payload = { reportId: 1, userId: 1, categoryId: 1, officeId: 1, officerId: 4 };
            const res = await agent
                .post('/reports/assign')
                .send(payload);
            expect(res.status).toBe(200);
        });
    });
    describe('GET /reports/assigned', () => {
        it('401 Unauthorized when not logged in', async () => {
            const res = await agent.get('/reports/assigned');
            expect(res.statusCode).toBe(401);
        });

        it('403 Forbidden for non technician user', async () => {
            await loginAsUser(agent);
            const res = await agent.get('/reports/assigned');

            expect(res.statusCode).toBe(403);
        });

        it('200 OK and returns an array for technician', async () => {
            await loginAsOfficer(agent);
            const res = await agent.get('/reports/assigned');

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);

        });
    });
    describe('PATCH /reports/:id', () => {
        const existingAssignedReportId = 1; 

        it('401 Unauthorized when not logged in', async () => {
            const res = await agent.patch(`/reports/${existingAssignedReportId}`).query({ statusId: 3 });
            expect(res.statusCode).toBe(401);
        });

        it('403 Forbidden for non technician user', async () => {
            await loginAsUser(agent);
            const res = await agent
                .patch(`/reports/${existingAssignedReportId}`)
                .query({ statusId: 3 })
                ;

            expect(res.statusCode).toBe(403);
        });

        it('200 OK when technician updates status of an assigned report', async () => {
            await loginAsOfficer(agent);
            const res = await agent
                .patch(`/reports/${existingAssignedReportId}`)
                .query({ statusId: 3 });

            expect(res.statusCode).toBe(200);
        });
    });    
    describe('POST /reports/reject', () => {
        it('401 Unauthorized when not logged in', async () => {
            const res = await agent.post('/reports/reject').send({ reportId: 1, userId: 1, reason: 'reason' });
            expect(res.status).toBe(401);
        });

        it('403 Forbidden for non PR officer', async () => {
            await loginAsUser(agent);
            const res = await agent
                .post('/reports/reject')
                .send({ reportId: 1, userId: 1, reason: 'reason' });

            expect(res.status).toBe(403);
        });

        it('200 OK for PR officer', async () => {
            await loginAsPR(agent);

            const payload = { reportId: 1, userId: 1, reason: 'Not valid' };
            const res = await agent
                .post('/reports/reject')
                .send(payload);

            expect(res.status).toBe(200);
        });

    });

});

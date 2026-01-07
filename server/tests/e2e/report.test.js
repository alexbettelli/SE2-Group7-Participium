import { describe, it, beforeAll, afterAll, expect, beforeEach,vi } from 'vitest';
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
    logout,
    loginAsAdmin
} from '../setup.mjs';
import path from "node:path";
import ReportDAO from '../../dao/ReportDAO.mjs';
import GenericInfoDAO from '../../dao/GenericInfoDAO.mjs';

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
        it('500 Service Unavailable on DB error', async () => {
            // Mock the DAO method to throw an error
            const getReportStatusesMock = vi.spyOn(GenericInfoDAO, 'getReportStatuses').mockImplementation(() => {
                throw new Error('Database error');
            });
            await loginAsOfficer(agent);
            const result = await agent.get('/reports/statuses');
            expect(result.status).toBe(500);
            // Restore the original method
            getReportStatusesMock.mockRestore();
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
        it('500 Service Unavailable on DB error', async () => {
            // Mock the DAO method to throw an error
            const createReportMock = vi.spyOn(ReportDAO, 'addNewReport').mockImplementation(() => {
                throw new Error('Database error');
            });
            await loginAsUser(agent);
            const result = await agent.post('/users/reports')
                .field('title', 'Test report')
                .field('description', 'Some description')
                .field('latitude', '12.34')
                .field('longitude', '56.78')
                .field('address', '123 Street')
                .field('catId', 1)
                .attach('images', path.join(__dirname, 'fixtures/img1.jpg'));
            expect(result.status).toBe(503);
            // Restore the original method
            createReportMock.mockRestore();
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
        it('503 Service Unavailable on DB error', async () => {
            // Mock the DAO method to throw an error
            const getReportsMock = vi.spyOn(ReportDAO, 'getAllReports').mockImplementation(() => {
                throw new Error('Database error');
            });
            await loginAsUser(agent);
            const result = await agent.get('/reports');
            expect(result.status).toBe(503);
            // Restore the original method
            getReportsMock.mockRestore();
        });
    });

    describe('GET /reports/:id', () => {
        it('401 Unauthorized when not logged in', async () => {
            const res = await agent.get('/reports/1');
            expect(res.statusCode).toBe(401);
        });

        it('403 Forbidden when accessing another user\'s report', async () => {
            await loginAsOfficer(agent);
            const res = await agent.get('/reports/3'); // Report 2 belongs to userId 2
            expect(res.statusCode).toBe(403);
        });

        it('404 Not Found for non-existing report', async () => {
            await loginAsUser(agent);
            const res = await agent.get('/reports/9999'); // Non-existing report
            expect(res.statusCode).toBe(404);
        });
        
        it('200 OK ' , async () => {
            await loginAsUser(agent);
            const res = await agent.get('/reports/1');
            expect(res.statusCode).toBe(200);
        });
        
        it('503 Service Unavailable on DB error', async () => {
            // Mock the DAO method to throw an error
            const getReportByIdMock = vi.spyOn(ReportDAO, 'getReportById').mockImplementation(() => {
                throw new Error('Database error');
            });
            await loginAsUser(agent);
            const result = await agent.get('/reports/1');
            expect(result.status).toBe(503);
            // Restore the original method
            getReportByIdMock.mockRestore();
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
        it('503 Service Unavailable on DB error', async () => {
            // Mock the DAO method to throw an error
            const getUserReportsMock = vi.spyOn(ReportDAO, 'getReportsByUserId').mockImplementation(() => {
                throw new Error('Database error');
            });
            await loginAsUser(agent);
            const result = await agent.get('/users/myreports');
            expect(result.status).toBe(503);
            // Restore the original method
            getUserReportsMock.mockRestore();
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
        it('503 Service Unavailable on DB error', async () => {
            // Mock the DAO method to throw an error
            const getUnassignedReportsMock = vi.spyOn(ReportDAO, 'getUnassignedReports').mockImplementation(() => {
                throw new Error('Database error');
            });
            await loginAsPR(agent);
            const result = await agent.get('/reports/unassigned');
            expect(result.status).toBe(500);
            // Restore the original method
            getUnassignedReportsMock.mockRestore();
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
        it('503 Service Unavailable on DB error', async () => {
            // Mock the DAO method to throw an error
            const assignReportMock = vi.spyOn(ReportDAO, 'assignReportToOfficer').mockImplementation(() => {
                throw new Error('Database error');
            });
            await loginAsPR(agent);
            const result = await agent.post('/reports/assign').send({ reportId: 1, userId: 1, categoryId: 1, officeId: 1, officerId: 4 });
            expect(result.status).toBe(500);
            // Restore the original method
            assignReportMock.mockRestore();
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
        it('503 Service Unavailable on DB error', async () => {
            // Mock the DAO method to throw an error
            const getAssignedReportsMock = vi.spyOn(ReportDAO, 'getAssignedReports').mockImplementation(() => {
                throw new Error('Database error');
            });
            await loginAsOfficer(agent);
            const result = await agent.get('/reports/assigned');
            expect(result.status).toBe(500);
            // Restore the original method
            getAssignedReportsMock.mockRestore();
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
        it('404 Not Found when technician tries to update a non-existing report', async () => {
            await loginAsOfficer(agent);
            const nonExistingReportId = 9999;
            const res = await agent
                .patch(`/reports/${nonExistingReportId}`)
                .query({ statusId: 3 });
            expect(res.statusCode).toBe(404);
        });
        it('500 Service Unavailable on DB error', async () => {
            // Mock the DAO method to throw an error
            const updateReportStatusMock = vi.spyOn(ReportDAO, 'updateReportStatus').mockImplementation(() => {
                throw new Error('Database error');
            });
            await loginAsOfficer(agent);
            const result = await agent.patch(`/reports/${existingAssignedReportId}`).query({ statusId: 3 });
            expect(result.status).toBe(500);
            // Restore the original method
            updateReportStatusMock.mockRestore();
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
        it('500 Service Unavailable on DB error', async () => {
            // Mock the DAO method to throw an error
            const rejectReportMock = vi.spyOn(ReportDAO, 'rejectReport').mockImplementation(() => {
                throw new Error('Database error');
            });
            await loginAsPR(agent);
            const result = await agent.post('/reports/reject').send({ reportId: 1, userId: 1, reason: 'Not valid' });
            expect(result.status).toBe(500);
            // Restore the original method
            rejectReportMock.mockRestore();
        });
    });
    describe('GET /reports/officer/:officerId/office/:officeId', () => {
        it('200 OK and returns an array for logged in officer', async () => {
            await loginAsAdmin(agent);
            const res = await agent.get('/reports/officer/4/office/1');
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
        it('401 Unauthorized when not logged in', async () => {
            const res = await agent.get('/reports/officer/4/office/1');
            expect(res.statusCode).toBe(401);
        });

        it('403 Forbidden for non technician user', async () => {
            await loginAsUser(agent);
            const res = await agent.get('/reports/officer/4/office/1');
            expect(res.statusCode).toBe(403);
        });

        it('500 Service Unavailable on DB error', async () => {
            // Mock the DAO method to throw an error
            const getReportsByOfficerAndOfficeMock = vi.spyOn(ReportDAO, 'getReportsByOfficerAndOffice').mockImplementation(() => {
                throw new Error('Database error');
            });
            await loginAsAdmin(agent);
            const result = await agent.get('/reports/officer/4/office/1');
            expect(result.status).toBe(500);
            // Restore the original method
            getReportsByOfficerAndOfficeMock.mockRestore();
        });
    });
    describe('POST /reports/reassign', () => {
        it('200 OK for Admin user', async () => {
            await loginAsAdmin(agent);
            const payload = { reportId: 1, newOfficerId: 4 };
            const res = await agent
                .post('/reports/reassign')
                .send(payload);
            expect(res.status).toBe(200);
        });

        it('401 Unauthorized when not logged in', async () => {
            const res = await agent.post('/reports/reassign').send({ reportId: 1, newOfficerId: 4 });
            expect(res.status).toBe(401);
        }); 
        it('403 Forbidden for non Admin user', async () => {
            await loginAsUser(agent);
            const res = await agent
                .post('/reports/reassign')
                .send({ reportId: 1, technicianId: 4 });
            expect(res.status).toBe(403);
        });

        it('500 Service Unavailable on DB error', async () => {
            // Mock the DAO method to throw an error
            const reassignReportMock = vi.spyOn(ReportDAO, 'reassignReportToOfficer').mockImplementation(() => {
                throw new Error('Database error');
            });
            await loginAsAdmin(agent);
            const result = await agent.post('/reports/reassign').send({ reportId: 1, newOfficerId: 4 });
            expect(result.status).toBe(500);
            // Restore the original method
            reassignReportMock.mockRestore();
        });
    });
});

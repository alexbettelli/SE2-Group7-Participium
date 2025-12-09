import { describe, it, beforeAll, afterAll, expect, beforeEach, vi } from 'vitest';
import ReportDAO from '../../dao/ReportDAO.mjs';
import db from '../../data/db.mjs';

import {
    setupTestDatabase,
    teardownTestDatabase,
    resetReports
} from '../setup.mjs';

describe('ReportDAO', () => {

    beforeAll(async () => {
        await setupTestDatabase();        
    });
    beforeEach(async () => {
        await resetReports();
    });

    // Cleanup after all tests
    afterAll(async () => {
        await teardownTestDatabase();
    });

    describe('getAllReports', () => {
        it('should return all the existing reports', async () => {

            const reports = await ReportDAO.getAllReports();
            expect(Array.isArray(reports)).toBe(true);
            expect(reports).toHaveLength(3);
            let report1 = reports[0];
            expect(report1.id).toBe(1);
            expect(report1.title).toBe('report1');
            expect(report1.user.username).toBe('user');
            expect(Array.isArray(report1.images)).toBe(true);
            expect(report1.images).toHaveLength(2);
            expect(report1.images[0].imageUrl).toContain(`/reports/${report1.id}/img2.png`);
        });
    });

    describe('getReportsByUserId', () => {
        it('should return reports for a given user id', async () => {

            const reports = await ReportDAO.getReportsByUserId(1);
            expect(Array.isArray(reports)).toBe(true);
            expect(reports).toHaveLength(3);
            let report1 = reports[0];
            expect(report1.id).toBe(1);
            expect(report1.title).toBe('report1');
            expect(report1.user.username).toBe('user');
            expect(Array.isArray(report1.images)).toBe(true);
            expect(report1.images).toHaveLength(2);
            expect(report1.images[0].imageUrl).toContain(`/reports/${report1.id}/img2.png`);

            expect(reports[1].id).toBe(2);
            expect(reports[1].title).toBe('report2');
            expect(reports[1].user.username).toBe('user');

            expect(reports[2].id).toBe(3);
            expect(reports[2].title).toBe('report3');
            expect(reports[2].user.username).toBe('user');

        });
        it('should return empty array for user with no reports', async () => {
            const reports = await ReportDAO.getReportsByUserId(999);
            expect(Array.isArray(reports)).toBe(true);
            expect(reports).toHaveLength(0);
        });
    });

    describe('addNewReport', () => {
        it('should add a new report successfully', async () => {
            const newReport = {
                title: "new report",
                description: "description of new report",
                latitude: 45.10000,
                longitude: 32.25,
                address: "addresss of new report",
                userId: 1,
                catId: 1,
                statusId: 1,
                createdAt: "Tue Nov 12 2025 15:42:10 GMT+0100",
                anonymous: 0,
                images: ['img1.png']
            }
            const report = await ReportDAO.addNewReport(newReport);
            expect(report).toBeTruthy();
            expect(report.id).toBeTruthy();
            expect(report.id).toBe(4); // since we had 3 reports initially
            expect(report.title).toBe("new report");
            expect(report.description).toBe("description of new report");
            expect(report.latitude).toBe(45.10000);
            expect(report.longitude).toBe(32.25);
            expect(report.address).toBe("addresss of new report");
            expect(report.userId).toBe(1);
            expect(report.catId).toBe(1);
            expect(report.statusId).toBe(1);
            expect(report.createdAt).toBe("Tue Nov 12 2025 15:42:10 GMT+0100");
            expect(report.anonymous).toBe(0);
            expect(Array.isArray(report.images)).toBe(true);
            expect(report.images.length).toBe(1);
        });
    });

    describe('getUnassignedReports', () => {
        it('should returns mapped reports for unassigned reports', async () => {

            const reports = await ReportDAO.getUnassignedReports();
            expect(Array.isArray(reports)).toBe(true);
            expect(reports.length).toBe(3);
            expect(reports[0].title).toBe('report1');
            expect(reports[0].user.username).toBe('user');

        });
        it('should not return assigned reports', async () => {            
            const unassignedBefore = await ReportDAO.getUnassignedReports();
            const reportToAssign = unassignedBefore[0];
            
            const assignment = {
                reportId : reportToAssign.id, 
                categoryId : 1, 
                officeId : 1, 
                officerId : 4, 
                userId : 1
            }
            await ReportDAO.assignReportToOfficer(assignment.reportId, assignment.categoryId, assignment.officeId, assignment.officerId, assignment.userId);

            const unassignedAfter = await ReportDAO.getUnassignedReports();
            const assignedReport = unassignedAfter.find(r => r.id === reportToAssign.id);

            expect(assignedReport).toBeUndefined();
            expect(unassignedAfter.length).toBe(unassignedBefore.length - 1);
        });
    });

    describe('assignReportToOfficer', () => {
        it('should assign report to officer successfully', async () => {
            const unassigned = await ReportDAO.getUnassignedReports();
            const reportId = unassigned[0].id;

            const assignment = {
                reportId : reportId, 
                categoryId : 1, 
                officeId : 1, 
                officerId : 4, 
                userId : unassigned[0].user.id
            }
            
            await ReportDAO.assignReportToOfficer(assignment.reportId, assignment.categoryId, assignment.officeId, assignment.officerId, assignment.userId)

            const reports = await ReportDAO.getAssignedReports(4);
           
            const assignedReport = reports.find(r => r.id === reportId);

            expect(assignedReport).toBeDefined();
            expect(assignedReport.employee.id).toBe(4);
            expect(assignedReport.status.id).toBe(2); // Assigned status
            expect(assignedReport.office.id).toBe(1);
        });

        it('should update category when assigning', async () => {
            const unassigned = await ReportDAO.getUnassignedReports();
            const reportId = unassigned[0].id;

            const assignment = {
                reportId : reportId, 
                categoryId : 3, 
                officeId : 3, 
                officerId : 4, 
                userId : 1
            }

            await ReportDAO.assignReportToOfficer(assignment.reportId, assignment.categoryId, assignment.officeId, assignment.officerId, assignment.userId);

            const reports = await ReportDAO.getAssignedReports(4);
            const assignedReport = reports.find(r => r.id === reportId);

            expect(assignedReport).toBeDefined();
            expect(assignedReport.category.id).toBe(3);
        });
        
    });


    describe('getAssignedReports', () => {
        it('should return reports assigned to a specific officer', async () => {

            const unassigned = await ReportDAO.getUnassignedReports();

            await ReportDAO.assignReportToOfficer(unassigned[0].id, 1, 1, 4, unassigned[0].user.id);
            await ReportDAO.assignReportToOfficer(unassigned[1].id, 1, 1, 4, unassigned[0].user.id);

            const reports = await ReportDAO.getAssignedReports(4);
            expect(Array.isArray(reports)).toBe(true);
            expect(reports.length).toBeGreaterThanOrEqual(2);

            reports.forEach(report => {
                expect(report.employee.id).toBe(4);
                expect(report.employee.username).toBe('userOfficer');
            });
        });
    });

    describe('updateReportStatus', () => {       

        it('should update report status "In Progress" message', async () => {
            const unassigned = await ReportDAO.getUnassignedReports();
            const reportId = unassigned[0].id;

            await ReportDAO.assignReportToOfficer(reportId, 1, 1, 4, unassigned[0].user.id);
            const result = await ReportDAO.updateReportStatus(4, reportId, 3);

            expect(result.text).toBe('Your report is being resolved');
            expect(result.receiver.id).toBe(1); // Original report owner
            expect(result.receiver.username).toBe('user');
        });

        it('should update report status "Suspended" message', async () => {
            const unassigned = await ReportDAO.getUnassignedReports();
            const reportId = unassigned[0].id;

            await ReportDAO.assignReportToOfficer(reportId, 1, 1, 4, unassigned[0].user.id);
            const result = await ReportDAO.updateReportStatus(4, reportId, 4);

            expect(result.text).toBe('Your report has been suspended.');
        });

        it('should update report status "Resolved" message', async () => {
            const unassigned = await ReportDAO.getUnassignedReports();
            const reportId = unassigned[0].id;

            await ReportDAO.assignReportToOfficer(reportId, 1, 1, 4, unassigned[0].user.id);
            const result = await ReportDAO.updateReportStatus(4, reportId, 6);

            expect(result.text).toBe('Your report has been resolved. Thank you for your contribution!');
        });

        it('should throw error for invalid officer updating status', async () => {
            const unassigned = await ReportDAO.getUnassignedReports();
            const reportId = unassigned[0].id;
            await ReportDAO.assignReportToOfficer(reportId, 1, 1, 4, unassigned[0].user.id);

            const result = await ReportDAO.updateReportStatus(999, reportId, 3);
            expect(result).toBe(false);
        });

        it('should throw error for invalid report id', async () => {
            const result = await ReportDAO.updateReportStatus(4, 9999, 3);
            expect(result).toBe(false);
        });

        it('should throw error for invalid status id', async () => {
            const unassigned = await ReportDAO.getUnassignedReports();
            const reportId = unassigned[0].id;
            await ReportDAO.assignReportToOfficer(reportId, 1, 1, 4, unassigned[0].user.id);
            await expect(ReportDAO.updateReportStatus(4, reportId, 9999)).rejects.toThrow();
            
        });
    });
    describe('rejectReport', () => {
        it('should update report status and reason', async () => {
            const unassigned = await ReportDAO.getUnassignedReports();
            const reportId = unassigned[0].id;
            
            await expect(ReportDAO.rejectReport(reportId, unassigned[0].user.id, 'not valid'))
                .resolves.toBeUndefined();
            
            // Verify the report was rejected
            const reports = await ReportDAO.getAllReports();
            const rejectedReport = reports.find(r => r.id === reportId);
            
            expect(rejectedReport).toBeDefined();
            expect(rejectedReport.status.id).toBe(5);
            expect(rejectedReport.rejectReason).toBe('not valid');
        });
    });

    
    describe('assignReportToExternalOffice', () => {
        it('should assign report to external office successfully', async () => {
            
            const newReport = {
                title: "new report",
                description: "description of new report",
                latitude: 45.10000,
                longitude: 32.25,
                address: "addresss of new report",
                userId: 1,
                catId: 1,
                statusId: 1,
                createdAt: "Tue Nov 12 2025 15:42:10 GMT+0100",
                anonymous: 0,
                images: ['img1.png']
            }
            const report = await ReportDAO.addNewReport(newReport);
            expect(report).toBeTruthy();
            
            
            await ReportDAO.assignReportToOfficer(report.id, 1, 1, 4, 1);
            const result = await ReportDAO.assignReportToExternalOffice(report.id, 1);
            expect(result).toBeUndefined(); 
        });
    });

    describe("getExternalOfficesAssignedReports", () => {
        it("should return reports assigned to external offices", async () => {
            const reports = await ReportDAO.getExternalOfficeAssignedReports(5);
            expect(Array.isArray(reports)).toBe(true);
            expect(reports.length).toBe(0); 

            const newReport = {
                title: "new report",
                description: "description of new report",
                latitude: 45.10000,
                longitude: 32.25,
                address: "addresss of new report",
                userId: 1,
                catId: 1,
                statusId: 1,
                createdAt: "Tue Nov 12 2025 15:42:10 GMT+0100",
                anonymous: 0,
                images: ['img1.png']
            }
            const report = await ReportDAO.addNewReport(newReport);
            expect(report).toBeTruthy();
            
            
            await ReportDAO.assignReportToOfficer(report.id, 1, 1, 4, 1);
            await ReportDAO.assignReportToExternalOffice(report.id, 1);
            const result = await ReportDAO.getExternalOfficeAssignedReports(5);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(1); 
            expect(result[0].id).toBe(report.id);

        });
    });
    describe("getExternalMaintainerReports", () => {
        it("should return reports assigned to external maintainer", async () => {
            const newReport = {
                title: "new report",
                description: "description of new report",
                latitude: 45.10000,
                longitude: 32.25,
                address: "addresss of new report",
                userId: 1,
                catId: 1,
                statusId: 1,
                createdAt: "Tue Nov 12 2025 15:42:10 GMT+0100",
                anonymous: 0,
                images: ['img1.png']
            }
            const report = await ReportDAO.addNewReport(newReport);
            expect(report).toBeTruthy();
            
            
            await ReportDAO.assignReportToOfficer(report.id, 1, 1, 4, 1);
            await ReportDAO.assignReportToExternalOffice(report.id, 1);
            const result = await ReportDAO.getExternalOfficeAssignedReports(5);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(1); 
            expect(result[0].id).toBe(report.id);

            const reports = await ReportDAO.getExternalMaintainerMyReports(5);
            expect(Array.isArray(reports)).toBe(true);
            expect(reports.length).toBe(0);
            const result2 = await ReportDAO.updateExternalMaintainerReportStatus(5, report.id, 'accept');
            expect(result2.ok).toBe(true);
            expect(result2.comment.text).toBe('The maintainer accepted the report and is starting work');
            const reportsAfter = await ReportDAO.getExternalMaintainerMyReports(5);
            expect(Array.isArray(reportsAfter)).toBe(true);
            expect(reportsAfter.length).toBe(1);
            expect(reportsAfter[0].id).toBe(report.id);
        });
    });

    describe("updateExternalMaintainerReportStatus", () => {
        it("should update report status by external maintainer", async () => {
            const newReport = {
                    title: "new report",
                    description: "description of new report",
                    latitude: 45.10000,
                    longitude: 32.25,
                    address: "addresss of new report",
                    userId: 1,
                    catId: 1,
                    statusId: 1,
                    createdAt: "Tue Nov 12 2025 15:42:10 GMT+0100",
                    anonymous: 0,
                    images: ['img1.png']
                }
            const report = await ReportDAO.addNewReport(newReport);
            expect(report).toBeTruthy();
            
            
            await ReportDAO.assignReportToOfficer(report.id, 1, 1, 4, 1);
            await ReportDAO.assignReportToExternalOffice(report.id, 1);

            
            const result = await ReportDAO.updateExternalMaintainerReportStatus(5, report.id, 'accept');
            expect(result.ok).toBe(true);
            expect(result.comment.text).toBe('The maintainer accepted the report and is starting work');

            const result1 = await ReportDAO.updateExternalMaintainerReportStatus(5, report.id, 'accept');
            expect(result1.ok).toBe(false);

            const result2 = await ReportDAO.updateExternalMaintainerReportStatus(5, report.id, 3);
            expect(result2.ok).toBe(true);
            expect(result2.comment.text).toBe("The maintainer is working on the report");

            const result2_1 = await ReportDAO.updateExternalMaintainerReportStatus(5, report.id, 3);
            expect(result2_1.ok).toBe(true);

            const result2_2 = await ReportDAO.updateExternalMaintainerReportStatus(5, report.id, 4);
            expect(result2_2.ok).toBe(false);

            const result3 = await ReportDAO.updateExternalMaintainerReportStatus(5, report.id, 6);
            expect(result3.ok).toBe(true);
            expect(result3.comment.text).toBe("The report has been resolved by the maintainer!");
        });
    });

    describe("rejection errors for ReportDAO", () => {
        it("reject by getReportsByUserId", async () => {
            vi.spyOn(db, 'all').mockImplementationOnce((query, params, callback) => {
                callback(new Error('Database error'), null);
            });

            await expect(ReportDAO.getReportsByUserId(1)).rejects.toThrow('Database error');
        });

        
    });
});
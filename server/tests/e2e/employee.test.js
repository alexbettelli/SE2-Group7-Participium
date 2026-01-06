import { describe, it, beforeAll, afterAll, expect, beforeEach, vi } from 'vitest';
import UserDAO from '../../dao/UserDAO.mjs';
import {
    setupTestDatabase,
    teardownTestDatabase,
    setupAgent,
    loginAsUser,
    loginAsAdmin,
    logout
} from '../setup.mjs';



describe('E2E Employee Routes', () => {
    let agent;
    let idCreatedEmployee;

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

    describe("POST /employees", () => {
        let newEmployee = {
            username: "usernameProva",
            password: "passwordProva",
            email: "emailprova@gmail.com",
            firstName: "username",
            lastName: "Prova"
        }
        let existingUsername = {
            username : "user",
            password : "passwordProva",
            email : "emailprova@gmail.com",
            firstName : "username",
            lastName : "Prova"
        }  
        it("bad request when missing fields", async () => {
            await loginAsAdmin(agent);
            const res = await agent.post('/employees').send({
                username: "usernameProva",
                password: "passwordProva",
                email: "",
                firstName: "username",
                // lastName missing
            });
            expect(res.statusCode).toBe(503);
        });
        it("create an employee without being authenticated", async () => {
            const res = await agent.post('/employees').send(newEmployee)

            expect(res.statusCode).toBe(401);
        })
        it("create an employee without being an admin", async () => {
            await loginAsUser(agent);
            const res = await agent.post('/employees').send(newEmployee);

            expect(res.statusCode).toBe(403);
        })
        it("create an employee with an existing username", async () => {
            await loginAsAdmin(agent);
            const res = await agent.post('/employees').send(existingUsername);

            expect(res.statusCode).toBe(409);
        })
        it("create an employee correctly", async () => {
            await loginAsAdmin(agent);
            const res = await agent.post('/employees').send(newEmployee);

            expect(res.statusCode).toBe(201);
            expect(res.headers['content-type']).toMatch(/json/);
            expect(typeof res.body).toBe('number');
            idCreatedEmployee = res.body;
        })
        
    })
    describe("GET /employees/unassigned", () => {
        it("get all employees without being authenticated", async () => {
             
            const res = await agent.get('/employees/unassigned')

            expect(res.statusCode).toBe(401);
        })
        it("get all employees without being an admin", async () => {
            await loginAsUser(agent);
            const res = await agent.get('/employees/unassigned');

            expect(res.statusCode).toBe(403);
        })
        it("get all employees correctly", async () => {
            await loginAsAdmin(agent);
            const res = await agent.get('/employees/unassigned');

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            res.body.forEach(employee => {
                expect(employee).toHaveProperty('id');
                expect(typeof employee.id).toBe('number');
                expect(employee).toHaveProperty('username');
                expect(typeof employee.username).toBe('string');
                expect(employee).toHaveProperty('email');
                expect(typeof employee.email).toBe('string');
                expect(employee).toHaveProperty('firstName');
                expect(typeof employee.firstName).toBe('string');
                expect(employee).toHaveProperty('lastName');
                expect(typeof employee.lastName).toBe('string');
                expect(employee).toHaveProperty('role');
                expect(employee.role.id).toBe(5);
                expect(employee).toHaveProperty('allowEmailNotification');
                expect(typeof employee.role.id).toBe('number');
                expect(employee).toHaveProperty('telegramUsername');
                expect(employee).toHaveProperty('imageUrl');
            })
        })
    })
    describe("POST /employees/assign", () => {
        
        
        it("assign an employee without being authenticated", async () => {
            const assignedEmployee = { "employeeId": idCreatedEmployee, "roleId": 4, "officeId": 2 }
            
            const res = await agent.post('/employees/assign').send(assignedEmployee)

            expect(res.statusCode).toBe(401);
        })
        it("assing an employee without being an admin", async () => {
            const assignedEmployee = { "employeeId": idCreatedEmployee, "roleId": 4, "officeId": 2 }
            await loginAsUser(agent);
            const res = await agent.post('/employees/assign').send(assignedEmployee);

            expect(res.statusCode).toBe(403);
        })

        it("assign an employee correctly", async () => {
            
            const assignedEmployee = { "employeeId": idCreatedEmployee, "roleId": 4, "officeId": 2 }
            await loginAsAdmin(agent);
            const res = await agent.post('/employees/assign').send(assignedEmployee);

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toMatch(/json/);
        })
    })
    describe("DELETE /employees/:id", () => {
        it("delete an employee without being authenticated", async () => {
            const res = await agent.delete(`/employees/${idCreatedEmployee}`);
            expect(res.statusCode).toBe(401);
        })
        it("delete an employee without being an admin", async () => {
            await loginAsUser(agent);
            const res = await agent.delete(`/employees/${idCreatedEmployee}`);
            expect(res.statusCode).toBe(403);
        })

        it("delete an employee with invalid id", async () => {
            await loginAsAdmin(agent);
            const res = await agent.delete(`/employees/invalidId`);
            expect(res.statusCode).toBe(400);
        })

        it("delete a non-existing employee", async () => {
            await loginAsAdmin(agent);
            const res = await agent.delete(`/employees/99999`);
            expect(res.statusCode).toBe(404);
        })

        it("delete an employee correctly", async () => {
            await loginAsAdmin(agent);
            const res = await agent.delete(`/employees/${idCreatedEmployee}`);
            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toMatch(/json/);
        })
    })

    describe("GET /employees/technical-officers", () => {
        it("get all technical officers without being authenticated", async () => {
            const res = await agent.get('/employees/technical-officers')

            expect(res.statusCode).toBe(401);
        })
        it("get all technical officers without being an admin", async () => {
            await loginAsUser(agent);
            const res = await agent.get('/employees/technical-officers');
            expect(res.statusCode).toBe(403);
        })
        it("get all technical officers correctly", async () => {
            await loginAsAdmin(agent);
            const res = await agent.get('/employees/technical-officers');
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            res.body.forEach(employee => {
                expect(employee).toHaveProperty('id');
                expect(typeof employee.id).toBe('number');
                expect(employee).toHaveProperty('username');
                expect(typeof employee.username).toBe('string');
            })
        })
    })

    describe("POST /employees/technical-officers/assign", () => {
        it("assign technical officer without being authenticated", async () => {
            const technicalOfficer = { "employeeId": 3 }
            const res = await agent.post('/employees/technical-officers/assign').send(technicalOfficer)
            expect(res.statusCode).toBe(401);
        })
        it("assign technical officer without being an admin", async () => {
            const technicalOfficer = { "employeeId": 3 }
            await loginAsUser(agent);
            const res = await agent.post('/employees/technical-officers/assign').send(technicalOfficer);
            expect(res.statusCode).toBe(403);
        })

        it("assign technical officer correctly", async () => {
            const technicalOfficer = { "officerId": 3 , "officeId": 2 }
            await loginAsAdmin(agent);
            const res = await agent.post('/employees/technical-officers/assign').send(technicalOfficer);
            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toMatch(/json/);
        })
    })

    describe("DELETE /employees/technical-officers/remove", () => {
        it("remove technical officer without being authenticated", async () => {
            const technicalOfficer = { "employeeId": 3 }
            const res = await agent.delete('/employees/technical-officers/remove').send(technicalOfficer)
            expect(res.statusCode).toBe(401);
        })
        it("remove technical officer without being an admin", async () => {
            const technicalOfficer = { "employeeId": 3 }
            await loginAsUser(agent);
            const res = await agent.delete('/employees/technical-officers/remove').send(technicalOfficer);
            expect(res.statusCode).toBe(403);
        })  
        it("remove technical officer correctly", async () => {
            const technicalOfficer = { "officerId": 3 , "officeId": 2 }
            await loginAsAdmin(agent);
            const res = await agent.delete('/employees/technical-officers/remove').send(technicalOfficer);
            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toMatch(/json/);
        })
    })

    describe("Mock database failure", () => {
        beforeEach(() => {
            vi.spyOn(UserDAO, 'deleteEmployeeById').mockRejectedValue(new Error('Database failure'));
            vi.spyOn(UserDAO, 'assignEmployeeToOffice').mockRejectedValue(new Error('Database failure'));
            vi.spyOn(UserDAO, 'getUnassignedEmployees').mockRejectedValue(new Error('Database failure'));
            vi.spyOn(UserDAO, 'getTechnicalOfficers').mockRejectedValue(new Error('Database failure'));
            vi.spyOn(UserDAO, 'assignOfficerToOffice').mockRejectedValue(new Error('Database failure'));
            vi.spyOn(UserDAO, 'removeOfficerFromOffice').mockRejectedValue(new Error('Database failure'));
        });
        afterEach(() => {
            vi.restoreAllMocks();
        });

        it("should handle database failure on GET /employees/unassigned", async () => {
            await loginAsAdmin(agent);
            const res = await agent.get('/employees/unassigned');
            expect(res.statusCode).toBe(503);
        });
        it("should handle database failure on GET /employees/technical-officers", async () => {
            await loginAsAdmin(agent);
            const res = await agent.get('/employees/technical-officers');
            expect(res.statusCode).toBe(503);
        });
        it("should handle database failure on DELETE /employees/:id", async () => {
            await loginAsAdmin(agent);
            const res = await agent.delete('/employees/1');
            expect(res.statusCode).toBe(503);
        });
        it("should handle database failure on POST /employees/assign", async () => {
            const assignedEmployee = { "employeeId": 1, "roleId": 4, "officeId": 2 }
            await loginAsAdmin(agent);
            const res = await agent.post('/employees/assign').send(assignedEmployee);
            expect(res.statusCode).toBe(503);
        });
        it("should handle database failure on POST /employees/technical-officers/assign", async () => {
            const technicalOfficer = { "employeeId": 3 }
            await loginAsAdmin(agent);
            const res = await agent.post('/employees/technical-officers/assign').send(technicalOfficer);
            expect(res.statusCode).toBe(503);
        });
        it("should handle database failure on DELETE /employees/technical-officers/remove", async () => {
            const technicalOfficer = { "employeeId": 3 }
            await loginAsAdmin(agent);
            const res = await agent.delete('/employees/technical-officers/remove').send(technicalOfficer);
            expect(res.statusCode).toBe(503);
        });
    });
});



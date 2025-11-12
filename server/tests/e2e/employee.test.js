import request from 'supertest';
import app from '../../server.mjs';
import { describe, expect, it } from 'vitest';

describe('E2E Employee Routes', () => {  
    
    describe("POST /employees", () => {      
        let newEmployee = {
            username : "usernameProva",
            password : "passwordProva",
            email : "emailprova@gmail.com",
            firstName : "username",
            lastName : "Prova"
        }
        let existingUsername = {
            username : "marioRossi",
            password : "passwordProva",
            email : "emailprova@gmail.com",
            firstName : "username",
            lastName : "Prova"
        }  
        it("create an employee without being authenticated", async () => {
           const res = await request(app).post('/employees').send(newEmployee)
            
            expect(res.statusCode).toBe(401);
        })
        it("create an employee without being an admin", async () => {
            const auth = await request(app).post('/session').send({ "username": "marioRossi", "password": "Password123!" });
            const res = await request(app).post('/employees').set('Cookie', auth.headers['set-cookie'] ?? []).send(newEmployee);
            
            expect(res.statusCode).toBe(403);
        })
        it("create an employee with an existing username", async () => {
            const auth = await request(app).post('/session').send({ "username": "marioRossi", "password": "Password123!" });
            const res = await request(app).post('/employees').set('Cookie', auth.headers['set-cookie'] ?? []).send(existingUsername);
            
            expect(res.statusCode).toBe(403);
        })
        it("create an employee correctly", async () => {
            const auth = await request(app).post('/session').send({ "username": "admin", "password": "adminpassword" });
            const res = await request(app).post('/employees').set('Cookie', auth.headers['set-cookie'] ?? []).send(newEmployee);
            
            expect(res.statusCode).toBe(201);
            expect(res.headers['content-type']).toMatch(/json/); 
            expect(typeof res.body).toBe('number');
        })
    })  
    describe("GET /employees/unassigned", () => {
        it("get all employees without being authenticated", async () => {
            const res = await request(app).get('/employees/unassigned')
            
            expect(res.statusCode).toBe(401);
        })
        it("get all employees without being an admin", async () => {
            const auth = await request(app).post('/session').send({ "username": "marioRossi", "password": "Password123!" });
            const res = await request(app).get('/employees/unassigned').set('Cookie', auth.headers['set-cookie'] ?? []);
            
            expect(res.statusCode).toBe(403);
        })        
        it("get all employees correctly", async () => {
            const auth = await request(app).post('/session').send({ "username": "admin", "password": "adminpassword" });
            const res = await request(app).get('/employees/unassigned').set('Cookie', auth.headers['set-cookie'] ?? []);
            
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
                expect(employee).toHaveProperty('typeId');
                expect(employee.typeId).toBe(5);
                expect(employee).toHaveProperty('allowEmailNotification');
                expect(typeof employee.typeId).toBe('number');
                expect(employee).toHaveProperty('telegramUsername');
                expect(employee).toHaveProperty('imageUrl');
            })     
        })
    })  
    describe("POST /employees/assign", () => {
        let assignedEmployee = {
            "employeeId" : 16,
            "roleId": 4,
            "officeId": 2
        }
        it("assign an employee without being authenticated", async () => {
           const res = await request(app).post('/employees/assign').send(assignedEmployee)
            
            expect(res.statusCode).toBe(401);
        })
        it("assing an employee without being an admin", async () => {
            const auth = await request(app).post('/session').send({ "username": "marioRossi", "password": "Password123!" });
            const res = await request(app).post('/employees/assign').set('Cookie', auth.headers['set-cookie'] ?? []).send(assignedEmployee);
            
            expect(res.statusCode).toBe(403);
        })
        
        it("assign an employee correctly", async () => {
            const auth = await request(app).post('/session').send({ "username": "admin", "password": "adminpassword" });
            const res = await request(app).post('/employees/assign').set('Cookie', auth.headers['set-cookie'] ?? []).send(assignedEmployee);
            
            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toMatch(/json/); 
        })
    })  
});

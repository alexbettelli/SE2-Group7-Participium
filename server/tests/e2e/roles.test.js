import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../server.mjs";
import DAO from "../../dao/DAO.mjs";

vi.mock('../../dao/DAO.mjs', async () => {
    const actual = await vi.importActual('../../dao/DAO.mjs');

    return {
        ...actual,
        default: {
            ...actual.default,
            getRoles: vi.fn()
        }
    }
});

beforeEach(() => {
    vi.clearAllMocks();
})

describe('GET /roles', () => {
    it('200 OK', async () => {
        // arrange
        const roles = [ { "id": 3, "type": "Municipal Public Relations Officer"}, { "id": 4, "type": "Technical Office Staff Member" } ];
        DAO.getRoles.mockResolvedValue(roles);

        // act
        const auth = await request(app).post('/session').send({ "username": "admin", "password": "adminpassword" });
        const result = await request(app).get('/roles').set('Cookie', auth.headers['set-cookie'] ?? []);

        // assert
        expect(result.status).toBe(200);
        expect(result.body).toEqual(roles);
        expect(DAO.getRoles).toHaveBeenCalledTimes(1);
    });

    it('401 Unauthorized', async () => {
        // act
        const result = await request(app).get('/roles');

        // assert
        expect(result.status).toBe(401);
        expect(DAO.getRoles).toHaveBeenCalledTimes(0);
        
    });

    
    it('403 Forbidden', async () => {
        // act
        const auth = await request(app).post('/session').send({ "username": "mario.rossi", "password": "mariorossi" });
        const result = await request(app).get('/roles').set('Cookie', auth.headers['set-cookie'] ?? []);

        // assert
        expect(result.status).toBe(403);
        expect(DAO.getRoles).toHaveBeenCalledTimes(0);
    });


    it('503 Service Unvailable', async () => {
        // arrange
        DAO.getRoles.mockImplementation(() => {throw new Error()});

        // act
        const auth = await request(app).post('/session').send({ "username": "admin", "password": "adminpassword" });
        const result = await request(app).get('/roles').set('Cookie', auth.headers['set-cookie'] ?? []);

        // assert
        expect(result.status).toBe(503);
        expect(DAO.getRoles).toHaveBeenCalledTimes(1);
        expect(DAO.getRoles).toThrow;   
    });
});
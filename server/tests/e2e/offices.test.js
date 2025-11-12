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
            getOffices: vi.fn()
        }
    }
});

beforeEach(() => {
    vi.clearAllMocks();
})

describe('GET /offices', () => {
    it('200 OK', async () => {
        // arrange
        const offices = [ { "id": 1, "name": "name 1", "catId": 1 } ];
        DAO.getOffices.mockResolvedValue(offices);

        // act
        const auth = await request(app).post('/session').send({ "username": "myadmin", "password": "myadmin" });
        const result = await request(app).get('/offices').set('Cookie', auth.headers['set-cookie'] ?? []);

        // assert
        expect(result.status).toBe(200);
        expect(result.body).toEqual(offices);
        expect(DAO.getOffices).toHaveBeenCalledTimes(1);
    });

    it('401 Unauthorized', async () => {
        // act
        const result = await request(app).get('/offices');

        // assert
        expect(result.status).toBe(401);
        expect(DAO.getOffices).toHaveBeenCalledTimes(0);
        
    });

    
    it('403 Forbidden', async () => {
        // act
        const auth = await request(app).post('/session').send({ "username": "marioRossi", "password": "Password123!" });
        const result = await request(app).get('/offices').set('Cookie', auth.headers['set-cookie'] ?? []);

        // assert
        expect(result.status).toBe(403);
        expect(DAO.getOffices).toHaveBeenCalledTimes(0);
    });


    it('503 Service Unvailable', async () => {
        // arrange
        DAO.getOffices.mockImplementation(() => {throw new Error()});

        // act
        const auth = await request(app).post('/session').send({ "username": "myadmin", "password": "myadmin" });
        const result = await request(app).get('/offices').set('Cookie', auth.headers['set-cookie'] ?? []);

        // assert
        expect(result.status).toBe(503);
        expect(DAO.getOffices).toHaveBeenCalledTimes(1);
        expect(DAO.getOffices).toThrow;
    });
});
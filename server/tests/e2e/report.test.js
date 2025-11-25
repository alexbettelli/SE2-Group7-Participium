import { describe, it, expect, vi, beforeEach, expect } from "vitest";
import request from 'supertest';
import app from "../../server.mjs";
import DAO from "../../dao/DAO.mjs";
import path from "path";

vi.spyOn(DAO, 'addNewReport');

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
// e2e tests for /user, /session, /session/current, /sessions/current
import request from 'supertest';
import app from '../../server.mjs';
import { expect } from 'vitest';
import DAO from '../../dao/DAO.mjs';

describe('E2E getCategories', () => {
  test('GET /categories - success', async () => {
    const auth = await request(app).post('/session').send({ "username": "admin", "password": "adminpassword" });
    const res = await request(app).get('/categories').set('Cookie', auth.headers['set-cookie'] ?? []);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /categories - unauthorized', async () => {
    const res = await request(app).get('/categories');
    expect(res.statusCode).toBe(401);
  });


  test("GET /categories - 503 Service Unavailable", async () => {
    const auth = await request(app)
      .post('/session')
      .send({ username: "admin", password: "adminpassword" });

    // Salva la funzione originale
    const originalGetCategories = DAO.getCategories;

    // Mock: forza errore
    DAO.getCategories = async () => { throw new Error("DB failure"); };

    const res = await request(app)
      .get('/categories')
      .set('Cookie', auth.headers['set-cookie'] ?? []);

    // Controlla che l'app gestisca l'errore
    assert.equal(res.statusCode, 503);

    // Ripristina funzione originale
    DAO.getCategories = originalGetCategories;
  });
});

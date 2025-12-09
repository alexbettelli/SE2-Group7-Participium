import { describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest';
import {
	setupTestDatabase,
	teardownTestDatabase,
	setupAgent,
	loginAsUser,
	loginAsOfficer,
	logout
} from '../setup.mjs';


describe('E2E comments routes', () => {
	let agent;
	let userId;
	const reportId = 1;

	beforeAll(async () => {
		await setupTestDatabase();
		agent = await setupAgent();
	});

	beforeEach(async () => {
		await logout(agent);
	});

	afterAll(async () => {
		await teardownTestDatabase();
	});

	describe('POST /comments', () => {
		it('should create a comment with null senderId', async () => {
			const user = await loginAsOfficer(agent);
			userId = user.body.id;
			const res = await agent.post('/comments').send({
				reportId,
				senderId: null,
				receiverId: userId,
				text: 'Officer visible comment'
			});
			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty('id');
			expect(res.body.text).toBe('Officer visible comment');
		});

		it('should create a comment with valid data (sender present)', async () => {
			const user = await loginAsOfficer(agent);
			userId = user.body.id;
			const res = await agent.post('/comments').send({
				reportId,
				senderId: userId,
				receiverId: 1,
				text: 'Comment from officer to citizen'
			});
			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty('id');
			expect(res.body.text).toBe('Comment from officer to citizen');
		});

		it('should fail with 400 if data is invalid', async () => {
			await loginAsOfficer(agent);
			const res = await agent.post('/comments').send({});
			expect(res.status).toBe(400);
		});
	});

	describe('POST /comments/read', () => {
		it('should mark comments as read with valid reportId for citizen', async () => {
			await loginAsUser(agent);
			const res = await agent.post('/comments/read').send({ reportId });
			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty('success', true);
			expect(res.body).toHaveProperty('readComments');
			expect(typeof res.body.readComments).toBe('number');
		});

		it('should fail with 400 if reportId is missing', async () => {
			await loginAsUser(agent);
			const res = await agent.post('/comments/read').send({});
			expect(res.status).toBe(400);
		});
	});
});


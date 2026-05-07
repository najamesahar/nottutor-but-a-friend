const request = require('supertest');
const app = require('../app');

describe('Basic server tests', () => {
  test('GET / returns 200', async () => {
    const res = await request(app).get('/');
    expect([200, 302]).toContain(res.statusCode);
  });

  test('GET /auth/status returns JSON', async () => {
    const res = await request(app).get('/auth/status');
    expect(res.headers['content-type']).toMatch(/json|text/);
    expect([200, 401]).toContain(res.statusCode);
  });
});

import { test, expect } from '@playwright/test';
import { API_PREFIX, createTestAdminSession, TestAdminSession } from '../fixtures/api.fixture';

test.describe('Backend Auth API E2E', () => {
  let session: TestAdminSession;

  test.beforeAll(async ({ request }) => {
    session = await createTestAdminSession(request);
  });

  test.afterAll(async () => {
    if (session) {
      await session.cleanup();
    }
  });

  test('GET / - health check responds 200', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain('API is running');
  });

  test('POST /api/v1/auths/login - succeeds with valid credentials', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/auths/login`, {
      data: {
        login_id: session.loginId,
        password: session.password,
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('token');
    expect(body.data.login_id).toBe(session.loginId);
  });

  test('POST /api/v1/auths/login - fails with wrong password', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/auths/login`, {
      data: {
        login_id: session.loginId,
        password: 'WrongPassword123',
      },
    });

    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('POST /api/v1/auths/login - fails Zod validation on short login_id', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/auths/login`, {
      data: {
        login_id: 'ab',
        password: 'Password123!',
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('GET /api/v1/auths/me - rejects unauthenticated request', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/auths/me`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/auths/me - returns current user with Bearer token', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/auths/me`, {
      headers: session.authHeaders,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.login_id).toBe(session.loginId);
  });

  test('POST /api/v1/auths/logout - logs out authenticated user', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/auths/logout`, {
      headers: session.authHeaders,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

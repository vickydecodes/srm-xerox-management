import { test, expect } from '@playwright/test';
import { API_PREFIX, createTestAdminSession, TestAdminSession } from '../fixtures/api.fixture';

test.describe('Backend Dashboard API E2E', () => {
  let session: TestAdminSession;

  test.beforeAll(async ({ request }) => {
    session = await createTestAdminSession(request);
  });

  test.afterAll(async () => {
    if (session) await session.cleanup();
  });

  test('GET /api/v1/dashboards/super-admin - fetches super admin dashboard stats', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/dashboards/super-admin`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('GET /api/v1/dashboards/branch-admin - rejects super_admin with 403', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/dashboards/branch-admin`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(403);
  });

  test('GET /api/v1/dashboards/manager - rejects super_admin with 403', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/dashboards/manager`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(403);
  });

  test('GET /api/v1/dashboards/department-admin - rejects super_admin with 403', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/dashboards/department-admin`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(403);
  });

  test('GET /api/v1/dashboards/shop-admin - rejects super_admin with 403', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/dashboards/shop-admin`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(403);
  });

  test('GET /api/v1/dashboards/staff - rejects super_admin with 403', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/dashboards/staff`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(403);
  });
});

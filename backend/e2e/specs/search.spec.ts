import { test, expect } from '@playwright/test';
import { API_PREFIX, createTestAdminSession, TestAdminSession } from '../fixtures/api.fixture';

test.describe('Backend Search API E2E', () => {
  let session: TestAdminSession;

  test.beforeAll(async ({ request }) => {
    session = await createTestAdminSession(request);
  });

  test.afterAll(async () => {
    if (session) await session.cleanup();
  });

  test('GET /api/v1/searches/products - searches products with query', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/searches/products?q=`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

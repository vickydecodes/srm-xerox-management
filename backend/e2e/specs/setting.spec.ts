import { test, expect } from '@playwright/test';
import { API_PREFIX, createTestAdminSession, TestAdminSession } from '../fixtures/api.fixture';

test.describe('Backend Setting API E2E', () => {
  let session: TestAdminSession;

  test.beforeAll(async ({ request }) => {
    session = await createTestAdminSession(request);
  });

  test.afterAll(async () => {
    if (session) await session.cleanup();
  });

  test('GET /api/v1/settings - fetches settings', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/settings`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('PUT /api/v1/settings - updates settings', async ({ request }) => {
    const res = await request.put(`${API_PREFIX}/settings`, {
      headers: session.authHeaders,
      data: {
        pdfTitle: 'SRM Xerox Bill',
        pdfPaperSize: 'A4',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

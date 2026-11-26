import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { API_PREFIX, createTestAdminSession, prisma, TestAdminSession } from '../fixtures/api.fixture';

test.describe('Backend Shop API CRUD E2E', () => {
  let session: TestAdminSession;
  let shopId: string;
  const suffix = randomUUID().slice(0, 6).toUpperCase();

  test.beforeAll(async ({ request }) => {
    session = await createTestAdminSession(request);
  });

  test.afterAll(async () => {
    if (shopId) await prisma.shop.deleteMany({ where: { id: shopId } }).catch(() => {});
    if (session) await session.cleanup();
  });

  test('POST /api/v1/shops - creates shop', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/shops`, {
      headers: session.authHeaders,
      data: {
        name: `PW Shop ${suffix}`,
        phone: '9876543210',
        email: `pwshop_${suffix}@srm.edu`,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    shopId = body.data._id || body.data.id;
  });

  test('GET /api/v1/shops - fetches shops list', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/shops`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/v1/shops/:id - fetches shop by ID', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/shops/${shopId}`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
  });

  test('PUT /api/v1/shops/:id - updates shop', async ({ request }) => {
    const res = await request.put(`${API_PREFIX}/shops/${shopId}`, {
      headers: session.authHeaders,
      data: { name: `PW Shop Updated ${suffix}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe(`PW Shop Updated ${suffix}`);
  });

  test('DELETE /api/v1/shops/:id & retrieve & erase', async ({ request }) => {
    const delRes = await request.delete(`${API_PREFIX}/shops/${shopId}`, {
      headers: session.authHeaders,
    });
    expect(delRes.status()).toBe(200);

    const retRes = await request.put(`${API_PREFIX}/shops/${shopId}/retrieve`, {
      headers: session.authHeaders,
    });
    expect(retRes.status()).toBe(200);

    const eraseRes = await request.delete(`${API_PREFIX}/shops/${shopId}/erase`, {
      headers: session.authHeaders,
    });
    expect(eraseRes.status()).toBe(200);
    shopId = '';
  });
});

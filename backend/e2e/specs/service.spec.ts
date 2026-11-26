import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { API_PREFIX, createTestAdminSession, prisma, TestAdminSession } from '../fixtures/api.fixture';

test.describe('Backend Service API CRUD E2E', () => {
  let session: TestAdminSession;
  let serviceId: string;
  const suffix = randomUUID().slice(0, 6).toUpperCase();

  test.beforeAll(async ({ request }) => {
    session = await createTestAdminSession(request);
  });

  test.afterAll(async () => {
    if (serviceId) await prisma.service.deleteMany({ where: { id: serviceId } }).catch(() => {});
    if (session) await session.cleanup();
  });

  test('POST /api/v1/services - creates a service', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/services`, {
      headers: session.authHeaders,
      data: {
        name: `PW Service ${suffix}`,
        description: 'Playwright test service',
        unit: 'per page',
        price: 5,
        isWorkOrder: false,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    serviceId = body.data._id || body.data.id;
  });

  test('GET /api/v1/services - fetches services', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/services`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/v1/services/:id - fetches service by ID', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/services/${serviceId}`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
  });

  test('PUT /api/v1/services/:id - updates service', async ({ request }) => {
    const res = await request.put(`${API_PREFIX}/services/${serviceId}`, {
      headers: session.authHeaders,
      data: { price: 8 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.price).toBe(8);
  });

  test('DELETE /api/v1/services/:id/erase - erases service', async ({ request }) => {
    const res = await request.delete(`${API_PREFIX}/services/${serviceId}/erase`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    serviceId = '';
  });
});

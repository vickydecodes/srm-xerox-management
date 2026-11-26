import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { API_PREFIX, createTestAdminSession, prisma, TestAdminSession } from '../fixtures/api.fixture';

test.describe('Backend Order API CRUD E2E', () => {
  let session: TestAdminSession;
  let branchId: string;
  let deptId: string;
  let orderId: string;
  const suffix = randomUUID().slice(0, 6).toUpperCase();

  test.beforeAll(async ({ request }) => {
    session = await createTestAdminSession(request);
    const branch = await prisma.branch.create({
      data: { name: `PW Order Branch ${suffix}`, code: `PWOB-${suffix}`, active: true },
    });
    branchId = branch.id;

    const dept = await prisma.department.create({
      data: { name: `PW Order Dept ${suffix}`, code: `PWOD-${suffix}`, branch: branchId, active: true },
    });
    deptId = dept.id;

    await prisma.user.update({
      where: { id: session.userId },
      data: { branch: branchId, department: deptId },
    });
  });

  test.afterAll(async () => {
    if (orderId) await prisma.order.deleteMany({ where: { id: orderId } }).catch(() => {});
    if (deptId) await prisma.department.deleteMany({ where: { id: deptId } }).catch(() => {});
    if (branchId) await prisma.branch.deleteMany({ where: { id: branchId } }).catch(() => {});
    if (session) await session.cleanup();
  });

  test('POST /api/v1/orders - creates an order draft', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/orders`, {
      headers: session.authHeaders,
      data: {
        orderType: 'XEROX_ORDER',
        purpose: `Playwright order ${suffix}`,
        attachmentEmail: 'pw@srm.edu',
        items: [
          {
            type: 'Service',
            item: 'dummy-service',
            name: 'A4 Print',
            quantity: 10,
            price: 2,
          },
        ],
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    orderId = body.data._id || body.data.id;
  });

  test('GET /api/v1/orders - fetches orders', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/orders`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/v1/orders/:id - fetches order by ID', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/orders/${orderId}`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
  });

  test('PUT /api/v1/orders/:id - updates order', async ({ request }) => {
    const res = await request.put(`${API_PREFIX}/orders/${orderId}`, {
      headers: session.authHeaders,
      data: { purpose: `Updated PW order ${suffix}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.purpose).toBe(`Updated PW order ${suffix}`);
  });

  test('DELETE /api/v1/orders/:id & erase', async ({ request }) => {
    const delRes = await request.delete(`${API_PREFIX}/orders/${orderId}`, {
      headers: session.authHeaders,
    });
    expect(delRes.status()).toBe(200);

    const eraseRes = await request.delete(`${API_PREFIX}/orders/${orderId}/erase`, {
      headers: session.authHeaders,
    });
    expect(eraseRes.status()).toBe(200);
    orderId = '';
  });
});

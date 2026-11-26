import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { API_PREFIX, createTestAdminSession, prisma, TestAdminSession } from '../fixtures/api.fixture';

test.describe('Backend XeroxOrder API CRUD E2E', () => {
  let session: TestAdminSession;
  let branchId: string;
  let deptId: string;
  let xeroxOrderId: string;
  const suffix = randomUUID().slice(0, 6).toUpperCase();

  test.beforeAll(async ({ request }) => {
    session = await createTestAdminSession(request);
    const branch = await prisma.branch.create({
      data: { name: `PW Xerox Branch ${suffix}`, code: `PWXB-${suffix}`, active: true },
    });
    branchId = branch.id;

    const dept = await prisma.department.create({
      data: { name: `PW Xerox Dept ${suffix}`, code: `PWXD-${suffix}`, branch: branchId, active: true },
    });
    deptId = dept.id;

    await prisma.user.update({
      where: { id: session.userId },
      data: { branch: branchId, department: deptId },
    });
  });

  test.afterAll(async () => {
    if (xeroxOrderId) await prisma.xeroxOrder.deleteMany({ where: { id: xeroxOrderId } }).catch(() => {});
    if (deptId) await prisma.department.deleteMany({ where: { id: deptId } }).catch(() => {});
    if (branchId) await prisma.branch.deleteMany({ where: { id: branchId } }).catch(() => {});
    if (session) await session.cleanup();
  });

  test('POST /api/v1/xerox-orders - creates xerox order draft', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/xerox-orders`, {
      headers: session.authHeaders,
      data: {
        branch: branchId,
        department: deptId,
        purpose: `PW Xerox Print ${suffix}`,
        items: [],
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    xeroxOrderId = body.data._id || body.data.id;
  });

  test('GET /api/v1/xerox-orders - fetches xerox orders', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/xerox-orders`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/v1/xerox-orders/:id - fetches xerox order by ID', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/xerox-orders/${xeroxOrderId}`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /api/v1/xerox-orders/:id/erase - erases xerox order', async ({ request }) => {
    const res = await request.delete(`${API_PREFIX}/xerox-orders/${xeroxOrderId}/erase`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    xeroxOrderId = '';
  });
});

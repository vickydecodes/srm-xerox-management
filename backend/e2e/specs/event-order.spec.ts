import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { API_PREFIX, createTestAdminSession, prisma, TestAdminSession } from '../fixtures/api.fixture';

test.describe('Backend EventOrder API CRUD E2E', () => {
  let session: TestAdminSession;
  let branchId: string;
  let deptId: string;
  let eventOrderId: string;
  const suffix = randomUUID().slice(0, 6).toUpperCase();

  test.beforeAll(async ({ request }) => {
    session = await createTestAdminSession(request);
    const branch = await prisma.branch.create({
      data: { name: `PW Event Branch ${suffix}`, code: `PWEB-${suffix}`, active: true },
    });
    branchId = branch.id;

    const dept = await prisma.department.create({
      data: { name: `PW Event Dept ${suffix}`, code: `PWED-${suffix}`, branch: branchId, active: true },
    });
    deptId = dept.id;

    await prisma.user.update({
      where: { id: session.userId },
      data: { branch: branchId, department: deptId },
    });
  });

  test.afterAll(async () => {
    if (eventOrderId) await prisma.eventOrder.deleteMany({ where: { id: eventOrderId } }).catch(() => {});
    if (deptId) await prisma.department.deleteMany({ where: { id: deptId } }).catch(() => {});
    if (branchId) await prisma.branch.deleteMany({ where: { id: branchId } }).catch(() => {});
    if (session) await session.cleanup();
  });

  test('POST /api/v1/event-orders - creates event order draft', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/event-orders`, {
      headers: session.authHeaders,
      data: {
        branch: branchId,
        department: deptId,
        eventName: `PW Symposium ${suffix}`,
        eventDate: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
        approvedReferralNumber: `REF-${suffix}`,
        approvedDate: new Date().toISOString(),
        attachmentEmail: 'pw@srm.edu',
        items: [],
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    eventOrderId = body.data._id || body.data.id;
  });

  test('GET /api/v1/event-orders - fetches event orders', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/event-orders`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/v1/event-orders/:id - fetches event order by ID', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/event-orders/${eventOrderId}`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /api/v1/event-orders/:id/erase - erases event order', async ({ request }) => {
    const res = await request.delete(`${API_PREFIX}/event-orders/${eventOrderId}/erase`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    eventOrderId = '';
  });
});

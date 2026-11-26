import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { API_PREFIX, createTestAdminSession, prisma, TestAdminSession } from '../fixtures/api.fixture';

test.describe('Backend Department API CRUD E2E', () => {
  let session: TestAdminSession;
  let branchId: string;
  let deptId: string;
  const suffix = randomUUID().slice(0, 6).toUpperCase();

  test.beforeAll(async ({ request }) => {
    session = await createTestAdminSession(request);
    const branch = await prisma.branch.create({
      data: { name: `PW Dept Branch ${suffix}`, code: `PWDB-${suffix}`, active: true },
    });
    branchId = branch.id;
  });

  test.afterAll(async () => {
    if (deptId) await prisma.department.deleteMany({ where: { id: deptId } }).catch(() => {});
    if (branchId) await prisma.branch.deleteMany({ where: { id: branchId } }).catch(() => {});
    if (session) await session.cleanup();
  });

  test('POST /api/v1/departments - creates department', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/departments`, {
      headers: session.authHeaders,
      data: {
        name: `PW Department ${suffix}`,
        code: `PWD-${suffix}`,
        branch: branchId,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    deptId = body.data._id || body.data.id;
    expect(deptId).toBeTruthy();
  });

  test('POST /api/v1/departments - returns 400 on invalid payload', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/departments`, {
      headers: session.authHeaders,
      data: { name: 'A', code: '' },
    });
    expect(res.status()).toBe(400);
  });

  test('GET /api/v1/departments - fetches paginated departments', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/departments`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/v1/departments/:id - fetches department by ID', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/departments/${deptId}`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data._id || body.data.id).toBe(deptId);
  });

  test('PUT /api/v1/departments/:id - updates department', async ({ request }) => {
    const res = await request.put(`${API_PREFIX}/departments/${deptId}`, {
      headers: session.authHeaders,
      data: { name: `PW Dept Updated ${suffix}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe(`PW Dept Updated ${suffix}`);
  });

  test('PATCH /api/v1/departments/:id/active-status & DELETE & PUT retrieve & DELETE erase', async ({ request }) => {
    const statusRes = await request.patch(`${API_PREFIX}/departments/${deptId}/active-status`, {
      headers: session.authHeaders,
      data: { active: false },
    });
    expect(statusRes.status()).toBe(200);

    const delRes = await request.delete(`${API_PREFIX}/departments/${deptId}`, {
      headers: session.authHeaders,
    });
    expect(delRes.status()).toBe(200);

    const retRes = await request.put(`${API_PREFIX}/departments/${deptId}/retrieve`, {
      headers: session.authHeaders,
    });
    expect(retRes.status()).toBe(200);

    const eraseRes = await request.delete(`${API_PREFIX}/departments/${deptId}/erase`, {
      headers: session.authHeaders,
    });
    expect(eraseRes.status()).toBe(200);
    deptId = '';
  });
});

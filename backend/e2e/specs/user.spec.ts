import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { API_PREFIX, createTestAdminSession, prisma, TestAdminSession } from '../fixtures/api.fixture';

test.describe('Backend User API CRUD E2E', () => {
  let session: TestAdminSession;
  let branchId: string;
  let createdUserId: string;
  const suffix = randomUUID().slice(0, 6).toUpperCase();

  test.beforeAll(async ({ request }) => {
    session = await createTestAdminSession(request);
    const branch = await prisma.branch.create({
      data: { name: `PW User Branch ${suffix}`, code: `PWUB-${suffix}`, active: true },
    });
    branchId = branch.id;
  });

  test.afterAll(async () => {
    if (createdUserId) await prisma.user.deleteMany({ where: { id: createdUserId } }).catch(() => {});
    if (branchId) await prisma.branch.deleteMany({ where: { id: branchId } }).catch(() => {});
    if (session) await session.cleanup();
  });

  test('POST /api/v1/users - creates a branch_admin user', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/users`, {
      headers: session.authHeaders,
      data: {
        name: `PW User ${suffix}`,
        email: `pwuser_${suffix.toLowerCase()}@srm.edu`,
        phone: '9876543210',
        password: 'Password123',
        role: 'branch_admin',
        branch: branchId,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    createdUserId = body.data._id || body.data.id;
  });

  test('GET /api/v1/users - fetches users list', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/users`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('PUT /api/v1/users/:id - updates user', async ({ request }) => {
    const res = await request.put(`${API_PREFIX}/users/${createdUserId}`, {
      headers: session.authHeaders,
      data: { name: `PW User Updated ${suffix}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe(`PW User Updated ${suffix}`);
  });

  test('DELETE /api/v1/users/:id/erase - erases user', async ({ request }) => {
    const res = await request.delete(`${API_PREFIX}/users/${createdUserId}/erase`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    createdUserId = '';
  });
});

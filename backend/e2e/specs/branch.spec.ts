import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { API_PREFIX, createTestAdminSession, prisma, TestAdminSession } from '../fixtures/api.fixture';

test.describe('Backend Branch API CRUD E2E', () => {
  let session: TestAdminSession;
  let createdBranchId: string;
  const suffix = randomUUID().slice(0, 6).toUpperCase();
  const branchCode = `PW-${suffix}`;
  const updatedCode = `PWU-${suffix}`;

  test.beforeAll(async ({ request }) => {
    session = await createTestAdminSession(request);
  });

  test.afterAll(async () => {
    if (createdBranchId) {
      await prisma.branch.deleteMany({
        where: { id: createdBranchId },
      }).catch(() => {});
    }
    if (session) {
      await session.cleanup();
    }
  });

  test('GET /api/v1/branches - rejects unauthenticated request', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/branches`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/branches - creates a new branch', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/branches`, {
      headers: session.authHeaders,
      data: {
        name: `Playwright Branch ${suffix}`,
        code: branchCode,
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.code).toBe(branchCode);
    createdBranchId = body.data._id || body.data.id;
    expect(createdBranchId).toBeTruthy();
  });

  test('POST /api/v1/branches - returns 400 on invalid payload', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/branches`, {
      headers: session.authHeaders,
      data: {
        name: 'A',
        code: '',
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('GET /api/v1/branches - returns paginated branches', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/branches`, {
      headers: session.authHeaders,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/v1/branches/:id - fetches branch by ID', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/branches/${createdBranchId}`, {
      headers: session.authHeaders,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data._id || body.data.id).toBe(createdBranchId);
  });

  test('PUT /api/v1/branches/:id - updates branch', async ({ request }) => {
    const res = await request.put(`${API_PREFIX}/branches/${createdBranchId}`, {
      headers: session.authHeaders,
      data: {
        name: `Updated Branch ${suffix}`,
        code: updatedCode,
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.code).toBe(updatedCode);
  });

  test('PATCH /api/v1/branches/:id/active-status - toggles active status', async ({ request }) => {
    const res = await request.patch(`${API_PREFIX}/branches/${createdBranchId}/active-status`, {
      headers: session.authHeaders,
      data: { active: false },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.active).toBe(false);
  });

  test('DELETE /api/v1/branches/:id - soft deletes branch', async ({ request }) => {
    const res = await request.delete(`${API_PREFIX}/branches/${createdBranchId}`, {
      headers: session.authHeaders,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('PUT /api/v1/branches/:id/retrieve - retrieves soft-deleted branch', async ({ request }) => {
    const res = await request.put(`${API_PREFIX}/branches/${createdBranchId}/retrieve`, {
      headers: session.authHeaders,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('DELETE /api/v1/branches/:id/erase - permanently erases branch', async ({ request }) => {
    const res = await request.delete(`${API_PREFIX}/branches/${createdBranchId}/erase`, {
      headers: session.authHeaders,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    createdBranchId = '';
  });
});

import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { API_PREFIX, createTestAdminSession, prisma, TestAdminSession } from '../fixtures/api.fixture';

test.describe('Backend Product API CRUD E2E', () => {
  let session: TestAdminSession;
  let productId: string;
  const suffix = randomUUID().slice(0, 6).toUpperCase();

  test.beforeAll(async ({ request }) => {
    session = await createTestAdminSession(request);
  });

  test.afterAll(async () => {
    if (productId) {
      await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
    }
    if (session) await session.cleanup();
  });

  test('POST /api/v1/products - creates a product', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/products`, {
      headers: session.authHeaders,
      data: {
        name: `PW Product ${suffix}`,
        description: 'E2E product test',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    productId = body.data._id || body.data.id;
  });

  test('GET /api/v1/products - fetches products', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/products`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/v1/products/:id - fetches product by ID', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/products/${productId}`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data._id || body.data.id).toBe(productId);
  });

  test('PUT /api/v1/products/:id - updates product', async ({ request }) => {
    const res = await request.put(`${API_PREFIX}/products/${productId}`, {
      headers: session.authHeaders,
      data: {
        description: 'Updated E2E description',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.description).toBe('Updated E2E description');
  });

  test('DELETE /api/v1/products/:id/erase - erases product', async ({ request }) => {
    const res = await request.delete(`${API_PREFIX}/products/${productId}/erase`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    productId = '';
  });
});

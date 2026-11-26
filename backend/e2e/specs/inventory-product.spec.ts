import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { API_PREFIX, createTestAdminSession, prisma, TestAdminSession } from '../fixtures/api.fixture';

test.describe('Backend InventoryProduct API E2E', () => {
  let session: TestAdminSession;
  let productId: string;
  let inventoryId: string;
  let inventoryProductId: string;
  const suffix = randomUUID().slice(0, 6).toUpperCase();

  test.beforeAll(async ({ request }) => {
    session = await createTestAdminSession(request);
    const inv = await prisma.inventory.create({
      data: { name: `PW Inv ${suffix}`, active: true },
    });
    inventoryId = inv.id;

    const prod = await prisma.product.create({
      data: { name: `PW Prod ${suffix}`, code: `PW-P-${suffix}`, active: true },
    });
    productId = prod.id;
  });

  test.afterAll(async () => {
    if (inventoryProductId) {
      await prisma.inventoryProduct.deleteMany({ where: { id: inventoryProductId } }).catch(() => {});
    }
    if (productId) {
      await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
    }
    if (inventoryId) {
      await prisma.inventory.deleteMany({ where: { id: inventoryId } }).catch(() => {});
    }
    if (session) await session.cleanup();
  });

  test('POST /api/v1/inventory-products - links product to inventory', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/inventory-products`, {
      headers: session.authHeaders,
      data: {
        inventory: inventoryId,
        product: productId,
        quantity: 50,
        price: 120,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    inventoryProductId = body.data._id || body.data.id;
  });

  test('GET /api/v1/inventory-products - fetches inventory products', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/inventory-products`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/v1/inventory-products/:id - fetches inventory product by ID', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/inventory-products/${inventoryProductId}`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data._id || body.data.id).toBe(inventoryProductId);
  });

  test('PUT /api/v1/inventory-products/:id - updates stock & price', async ({ request }) => {
    const res = await request.put(`${API_PREFIX}/inventory-products/${inventoryProductId}`, {
      headers: session.authHeaders,
      data: { quantity: 75, price: 130 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.quantity).toBe(75);
  });

  test('PATCH /api/v1/inventory-products/:id/active-status & DELETE & PUT retrieve & DELETE erase', async ({ request }) => {
    const statusRes = await request.patch(`${API_PREFIX}/inventory-products/${inventoryProductId}/active-status`, {
      headers: session.authHeaders,
      data: { active: false },
    });
    expect(statusRes.status()).toBe(200);

    const delRes = await request.delete(`${API_PREFIX}/inventory-products/${inventoryProductId}`, {
      headers: session.authHeaders,
    });
    expect(delRes.status()).toBe(200);

    const retRes = await request.put(`${API_PREFIX}/inventory-products/${inventoryProductId}/retrieve`, {
      headers: session.authHeaders,
    });
    expect(retRes.status()).toBe(200);

    const eraseRes = await request.delete(`${API_PREFIX}/inventory-products/${inventoryProductId}/erase`, {
      headers: session.authHeaders,
    });
    expect(eraseRes.status()).toBe(200);
  });
});

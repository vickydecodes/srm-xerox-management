import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { API_PREFIX, createTestAdminSession, prisma, TestAdminSession } from '../fixtures/api.fixture';

test.describe('Backend Bill & Concurrent Stock Deduction E2E', () => {
  let session: TestAdminSession;
  let inventoryId: string;
  let productId: string;
  let inventoryProductId: string;
  const createdBillIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    session = await createTestAdminSession(request);
    const suffix = randomUUID().slice(0, 6);

    const inventory = await prisma.inventory.create({
      data: { name: `PW Inventory ${suffix}`, active: true },
    });
    inventoryId = inventory.id;

    const product = await prisma.product.create({
      data: {
        name: `PW Paper ${suffix}`,
        code: `PW-P-${suffix}`,
        description: 'Playwright concurrency test product',
        active: true,
      },
    });
    productId = product.id;

    const invProd = await prisma.inventoryProduct.create({
      data: {
        inventory: inventoryId,
        product: productId,
        quantity: 10,
        price: 25,
        active: true,
      },
    });
    inventoryProductId = invProd.id;
  });

  test.afterAll(async () => {
    if (createdBillIds.length > 0) {
      await prisma.bill.deleteMany({ where: { id: { in: createdBillIds } } }).catch(() => {});
    }
    if (inventoryProductId) {
      await prisma.inventoryProduct.deleteMany({ where: { id: inventoryProductId } }).catch(() => {});
    }
    if (productId) {
      await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
    }
    if (inventoryId) {
      await prisma.inventory.deleteMany({ where: { id: inventoryId } }).catch(() => {});
    }
    if (session) {
      await session.cleanup();
    }
  });

  test('POST /api/v1/bills - prevents overselling when two requests claim full stock simultaneously', async ({ request }) => {
    const payload = {
      paymentMethod: 'CASH',
      items: [
        {
          type: 'InventoryProduct',
          item: inventoryProductId,
          name: 'PW Paper',
          quantity: 10,
          price: 25,
        },
      ],
    };

    const [res1, res2] = await Promise.all([
      request.post(`${API_PREFIX}/bills`, {
        headers: session.authHeaders,
        data: payload,
      }),
      request.post(`${API_PREFIX}/bills`, {
        headers: session.authHeaders,
        data: payload,
      }),
    ]);

    const statuses = [res1.status(), res2.status()].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 400]);

    for (const res of [res1, res2]) {
      const body = await res.json();
      if (res.status() === 201) {
        const billId = body.data?._id || body.data?.id;
        if (billId) createdBillIds.push(billId);
      } else {
        expect(body.success).toBe(false);
        expect(body.message).toMatch(/Insufficient stock/i);
      }
    }

    const updatedInvProd = await prisma.inventoryProduct.findUnique({
      where: { id: inventoryProductId },
    });
    expect(updatedInvProd?.quantity).toBe(0);
  });

  test('GET /api/v1/bills - fetches bills list', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/bills`, {
      headers: session.authHeaders,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

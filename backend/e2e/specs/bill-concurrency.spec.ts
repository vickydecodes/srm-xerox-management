import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { API_PREFIX, createTestAdminSession, prisma, TestAdminSession } from '../fixtures/api.fixture';

test.describe('Backend Bill Lifecycle & Concurrency E2E', () => {
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
        quantity: 50,
        price: 25,
        active: true,
      },
    });
    inventoryProductId = invProd.id;
  });

  test.afterAll(async () => {
    if (createdBillIds.length > 0) {
      await prisma.billItem.deleteMany({ where: { bill: { in: createdBillIds } } }).catch(() => {});
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

  test('POST /api/v1/bills - creates a single bill and deducts inventory', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/bills`, {
      headers: session.authHeaders,
      data: {
        paymentMethod: 'CASH',
        items: [
          {
            type: 'InventoryProduct',
            item: inventoryProductId,
            name: 'PW Paper',
            quantity: 5,
            price: 25,
          },
        ],
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    const billId = body.data?._id || body.data?.id;
    expect(billId).toBeTruthy();
    createdBillIds.push(billId);

    const updatedInvProd = await prisma.inventoryProduct.findUnique({
      where: { id: inventoryProductId },
    });
    expect(updatedInvProd?.quantity).toBe(45);
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

  test('GET /api/v1/bills/:id - retrieves a created bill by ID', async ({ request }) => {
    expect(createdBillIds.length).toBeGreaterThan(0);
    const targetId = createdBillIds[0];

    const res = await request.get(`${API_PREFIX}/bills/${targetId}`, {
      headers: session.authHeaders,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const returnedId = body.data?._id || body.data?.id;
    expect(returnedId).toBe(targetId);
  });

  test('PUT /api/v1/bills/:id - updates bill status/details', async ({ request }) => {
    expect(createdBillIds.length).toBeGreaterThan(0);
    const targetId = createdBillIds[0];

    const res = await request.put(`${API_PREFIX}/bills/${targetId}`, {
      headers: session.authHeaders,
      data: {
        status: 'PAID',
        discount: 5,
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('DELETE /api/v1/bills/:id - deletes, retrieves, toggles active-status, and erases a bill', async ({ request }) => {
    // Create a temporary bill specifically for lifecycle testing
    const createRes = await request.post(`${API_PREFIX}/bills`, {
      headers: session.authHeaders,
      data: {
        paymentMethod: 'CASH',
        items: [
          {
            type: 'InventoryProduct',
            item: inventoryProductId,
            name: 'PW Paper',
            quantity: 1,
            price: 25,
          },
        ],
      },
    });

    expect(createRes.status()).toBe(201);
    const createBody = await createRes.json();
    const tempBillId = createBody.data?._id || createBody.data?.id;
    expect(tempBillId).toBeTruthy();

    const pdfRes = await request.get(`${API_PREFIX}/bills/${tempBillId}/pdf`, {
      headers: session.authHeaders,
    });
    expect(pdfRes.status()).toBe(200);

    const docxRes = await request.get(`${API_PREFIX}/bills/${tempBillId}/docx`, {
      headers: session.authHeaders,
    });
    expect(docxRes.status()).toBe(200);

    const statusRes = await request.patch(`${API_PREFIX}/bills/${tempBillId}/active-status`, {
      headers: session.authHeaders,
      data: { active: false },
    });
    expect(statusRes.status()).toBe(200);

    const deleteRes = await request.delete(`${API_PREFIX}/bills/${tempBillId}`, {
      headers: session.authHeaders,
    });
    expect(deleteRes.status()).toBe(200);

    const retrieveRes = await request.put(`${API_PREFIX}/bills/${tempBillId}/retrieve`, {
      headers: session.authHeaders,
    });
    expect(retrieveRes.status()).toBe(200);

    const eraseRes = await request.delete(`${API_PREFIX}/bills/${tempBillId}/erase`, {
      headers: session.authHeaders,
    });
    expect(eraseRes.status()).toBe(200);
  });

  test('POST /api/v1/bills - prevents overselling when two requests claim remaining stock simultaneously', async ({ request }) => {
    // Fetch remaining stock
    const current = await prisma.inventoryProduct.findUnique({
      where: { id: inventoryProductId },
    });
    const remainingQty = current?.quantity ?? 0;
    expect(remainingQty).toBeGreaterThan(0);

    const payload = {
      paymentMethod: 'CASH',
      items: [
        {
          type: 'InventoryProduct',
          item: inventoryProductId,
          name: 'PW Paper',
          quantity: remainingQty,
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
});

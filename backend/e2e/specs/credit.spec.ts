import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { API_PREFIX, createTestAdminSession, prisma, TestAdminSession } from '../fixtures/api.fixture';

test.describe('Backend Credit Payment API E2E', () => {
  let session: TestAdminSession;
  let branchId: string;
  let deptId: string;
  let billId: string;
  let creditPaymentId: string;
  const suffix = randomUUID().slice(0, 6).toUpperCase();

  test.beforeAll(async ({ request }) => {
    session = await createTestAdminSession(request);

    const branch = await prisma.branch.create({
      data: { name: `PW Credit Branch ${suffix}`, code: `PWCB-${suffix}`, active: true },
    });
    branchId = branch.id;

    const dept = await prisma.department.create({
      data: {
        name: `PW Credit Dept ${suffix}`,
        code: `PWCD-${suffix}`,
        branch: branchId,
        outstandingCredit: 500,
        active: true,
      },
    });
    deptId = dept.id;

    const bill = await prisma.bill.create({
      data: {
        code: `PW-BILL-${suffix}`,
        paymentMethod: 'CREDIT',
        status: 'UNPAID',
        approvalStatus: 'approved',
        branch: branchId,
        department: deptId,
        createdBy: session.userId,
        subtotal: 500,
        total: 500,
        items: {
          create: [{ type: 'Service', item: 'dummy', name: 'Print', quantity: 10, price: 50, total: 500 }],
        },
      },
    });
    billId = bill.id;
  });

  test.afterAll(async () => {
    if (creditPaymentId) await prisma.creditPayment.deleteMany({ where: { id: creditPaymentId } }).catch(() => {});
    if (billId) await prisma.bill.deleteMany({ where: { id: billId } }).catch(() => {});
    if (deptId) await prisma.department.deleteMany({ where: { id: deptId } }).catch(() => {});
    if (branchId) await prisma.branch.deleteMany({ where: { id: branchId } }).catch(() => {});
    if (session) await session.cleanup();
  });

  test('POST /api/v1/credits - records a credit payment', async ({ request }) => {
    const res = await request.post(`${API_PREFIX}/credits`, {
      headers: session.authHeaders,
      data: {
        department: deptId,
        bills: [billId],
        amount: 500,
        paymentMethod: 'CASH',
        remarks: 'Playwright credit settlement',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    creditPaymentId = body.data._id || body.data.id;
  });

  test('GET /api/v1/credits - fetches credit payments', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/credits`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/v1/credits/:id - fetches credit payment by ID', async ({ request }) => {
    const res = await request.get(`${API_PREFIX}/credits/${creditPaymentId}`, {
      headers: session.authHeaders,
    });
    expect(res.status()).toBe(200);
  });

  test('PUT /api/v1/credits/:id - updates credit payment remarks', async ({ request }) => {
    const res = await request.put(`${API_PREFIX}/credits/${creditPaymentId}`, {
      headers: session.authHeaders,
      data: {
        remarks: 'Updated Playwright credit settlement',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import mongoose from 'mongoose';
import { bootstrap } from '../app.ts';
import CreditPayment from '@db/models/credit.model.ts';
import Department from '@db/models/department.model.ts';
import Branch from '@db/models/branch.model.ts';
import Bill from '@db/models/bill.model.ts';
import { tester } from '@core/constants/tester.constant.ts';

const baseRoute = '/api/v1/credits';

let token: string;
let cleanupAdmin: () => Promise<void>;
let adminUserId: string;

let testBranchId: string;
let testDepartmentId: string;
let testBillId: string;
let createdCreditPaymentId: string;

beforeAll(async () => {
  await bootstrap();
  const setup = await tester.setupAdmin();
  token = setup.token;
  cleanupAdmin = setup.cleanup;
  adminUserId = setup.user._id.toString();

  const timestamp = Date.now();

  const branch = await Branch.create({
    name: `Test Credit Branch ${timestamp}`,
    code: `TCB-${timestamp}`,
    active: true,
  });
  testBranchId = branch._id.toString();

  const department = await Department.create({
    name: `Test Credit Dept ${timestamp}`,
    code: `TCD-${timestamp}`,
    branch: branch._id as any,
    outstandingCredit: 100,
    creditBalance: 0,
    active: true,
  });
  testDepartmentId = department._id.toString();

  const bill = await Bill.create({
    code: `TCBILL-${timestamp}`,
    items: [],
    subtotal: 100,
    discount: 0,
    tax: 0,
    total: 100,
    paymentMethod: 'CREDIT',
    branch: branch._id as any,
    department: department._id as any,
    status: 'UNPAID',
    approvalStatus: 'approved',
    createdBy: adminUserId as any,
  });
  testBillId = bill._id.toString();
});

afterAll(async () => {
  if (cleanupAdmin) {
    await cleanupAdmin();
  }

  if (createdCreditPaymentId) {
    await CreditPayment.findByIdAndDelete(createdCreditPaymentId);
  }
  if (testDepartmentId) {
    await CreditPayment.deleteMany({ department: testDepartmentId });
  }
  if (testBillId) {
    await Bill.findByIdAndDelete(testBillId);
  }
  if (testDepartmentId) {
    await Department.findByIdAndDelete(testDepartmentId);
  }
  if (testBranchId) {
    await Branch.findByIdAndDelete(testBranchId);
  }
});

describe('Credit Payment API Endpoint Suite', () => {
  it('should reject requests without authorization header', async () => {
    const res = await tester.get(baseRoute);

    tester.assertUnauthorized(res, 'Unauthenticated');
  });

  it('should successfully create a credit payment', async () => {
    const res = await tester.post(
      baseRoute,
      {
        department: testDepartmentId,
        bills: [testBillId],
        amount: 100,
        paymentMethod: 'CASH',
        remarks: 'Payment for test credit bill',
      },
      token
    );

    tester.assertCreated(res, 'Credit Payment', (data) => {
      createdCreditPaymentId = data._id;
      expect(data.amount).to.equal(100);
      expect(data.paymentMethod).to.equal('CASH');
    });
  });

  it('should return validation error on credit payment creation with invalid payload', async () => {
    const res = await tester.post(
      baseRoute,
      {
        department: 'invalid-id',
        bills: [],
        amount: -10,
        paymentMethod: 'INVALID_METHOD',
      },
      token
    );

    tester.assertValidationError(res);
  });

  it('should successfully fetch all credit payments', async () => {
    const res = await tester.get(baseRoute, token);

    tester.assertFetched(res, 'credit payment');
  });

  it('should successfully fetch credit payment by ID', async () => {
    const res = await tester.get(`${baseRoute}/${createdCreditPaymentId}`, token);

    tester.assertFetched(res, 'credit payment');
  });

  it('should successfully update credit payment', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdCreditPaymentId}`,
      {
        amount: 120,
        remarks: 'Updated payment remarks',
      },
      token
    );

    tester.assertUpdated(res, 'credit payment', (data) => {
      expect(data.amount).to.equal(120);
    });
  });

  it('should return 404 when requesting a non-existent credit payment', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await tester.get(`${baseRoute}/${nonExistentId}`, token);

    tester.assertNotFound(res, 'credit payment');
  });
});

import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import mongoose from 'mongoose';
import { bootstrap } from '../app.ts';
import Department from '@db/models/department.model.ts';
import Branch from '@db/models/branch.model.ts';
import Bill from '@db/models/bill.model.ts';
import CreditPayment from '@db/models/credit.model.ts';
import { tester } from '@core/constants/tester.constant.ts';

const baseRoute = '/api/v1/departments';

let token: string;
let cleanupAdmin: () => Promise<void>;
let adminUserId: string;

let testBranchId: string;
let createdDepartmentId: string;
let creditDeptId: string;
let testCreditBillId: string;

beforeAll(async () => {
  await bootstrap();
  const setup = await tester.setupAdmin();
  token = setup.token;
  cleanupAdmin = setup.cleanup;
  adminUserId = setup.user._id.toString();

  const timestamp = Date.now();

  const branch = await Branch.create({
    name: `Test Dept Branch ${timestamp}`,
    code: `TDB-${timestamp}`,
    active: true,
  });
  testBranchId = branch._id.toString();
});

afterAll(async () => {
  if (cleanupAdmin) {
    await cleanupAdmin();
  }

  const deptIds = [createdDepartmentId, creditDeptId].filter(Boolean);

  if (deptIds.length > 0) {
    await CreditPayment.deleteMany({ department: { $in: deptIds } });
    await Bill.deleteMany({ department: { $in: deptIds } });
    await Department.deleteMany({ _id: { $in: deptIds } });
  }

  if (testBranchId) {
    await Department.deleteMany({ branch: testBranchId });
    await Branch.findByIdAndDelete(testBranchId);
  }
});

describe('Department API Endpoint Suite', () => {
  it('should reject requests without authorization header', async () => {
    const res = await tester.get(baseRoute);

    tester.assertUnauthorized(res, 'Unauthenticated');
  });

  it('should successfully create a department', async () => {
    const res = await tester.post(
      baseRoute,
      {
        name: `Test Department ${Date.now()}`,
        code: `TDEPT-${Date.now()}`,
        branch: testBranchId,
      },
      token
    );

    tester.assertCreated(res, 'Department', (data) => {
      createdDepartmentId = data._id;
      expect(data.name).to.be.a('string');
      expect(data.code).to.be.a('string');
    });
  });

  it('should return validation error on department creation with invalid fields', async () => {
    const res = await tester.post(
      baseRoute,
      {
        name: 'A', // too short name
        code: '', // required code
      },
      token
    );

    tester.assertValidationError(res);
  });

  it('should successfully fetch all departments', async () => {
    const res = await tester.get(baseRoute, token);

    tester.assertFetched(res, 'department');
  });

  it('should successfully fetch department by ID', async () => {
    const res = await tester.get(`${baseRoute}/${createdDepartmentId}`, token);

    tester.assertFetched(res, 'department');
  });

  it('should successfully update department', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdDepartmentId}`,
      {
        name: `Test Department Updated ${Date.now()}`,
      },
      token
    );

    tester.assertUpdated(res, 'department');
  });

  it('should successfully update department active status', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdDepartmentId}/active-status`,
      {
        active: false,
      },
      token
    );

    tester.assertUpdated(res, 'department');
  });

  it('should successfully soft delete department', async () => {
    const res = await tester.del(`${baseRoute}/${createdDepartmentId}`, token);

    tester.assertDeleted(res, 'department');
  });

  it('should successfully retrieve soft deleted department', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdDepartmentId}/retrieve`,
      undefined,
      token
    );

    tester.assertSuccess(res, 'Department retrieved successfully');
  });

  it('should successfully permanently erase department', async () => {
    const res = await tester.del(`${baseRoute}/${createdDepartmentId}/erase`, token);

    tester.assertDeleted(res, 'department');
  });

  it('should return 404 when requesting a non-existent department', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await tester.get(`${baseRoute}/${nonExistentId}`, token);

    tester.assertNotFound(res, 'department');
  });

  it('should successfully clear credit for a department with advance balance', async () => {
    const dept = await Department.create({
      name: `Test Credit Dept ${Date.now()}`,
      code: `TCD-${Date.now()}`,
      branch: testBranchId as any,
      outstandingCredit: 0,
      creditBalance: 0,
      active: true,
    });
    creditDeptId = dept._id.toString();

    const res = await tester.post(
      `${baseRoute}/${creditDeptId}/clear-credit`,
      {
        amount: 500,
        paymentMethod: 'CASH',
        remarks: 'Advance credit deposit',
      },
      token
    );

    tester.assertUpdated(res, 'department', (data) => {
      expect(data.creditBalance).to.equal(500);
    });
  });

  it('should successfully clear credit against specific unpaid credit bills', async () => {
    const bill = await Bill.create({
      code: `TBILL-${Date.now()}`,
      items: [],
      subtotal: 200,
      discount: 0,
      tax: 0,
      total: 200,
      paymentMethod: 'CREDIT',
      branch: testBranchId as any,
      department: creditDeptId as any,
      status: 'UNPAID',
      approvalStatus: 'approved',
      createdBy: adminUserId as any,
    });
    testCreditBillId = bill._id.toString();

    // Update department outstanding credit to reflect bill
    await Department.findByIdAndUpdate(creditDeptId, { outstandingCredit: 200 });

    const res = await tester.post(
      `${baseRoute}/${creditDeptId}/clear-credit`,
      {
        billIds: [testCreditBillId],
        amount: 200,
        paymentMethod: 'UPI',
        remarks: 'Full settlement of bill',
      },
      token
    );

    tester.assertUpdated(res, 'department');

    const updatedBill = await Bill.findById(testCreditBillId);
    expect(updatedBill?.status).to.equal('PAID');
  });
});

import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import mongoose from 'mongoose';
import { bootstrap } from '../app.ts';
import Bill from '@db/models/bill.model.ts';
import Branch from '@db/models/branch.model.ts';
import Department from '@db/models/department.model.ts';
import Inventory from '@db/models/inventory.model.ts';
import Product from '@db/models/product.model.ts';
import InventoryProduct from '@db/models/inventory-product.model.ts';
import { tester } from '@core/constants/tester.constant.ts';

const baseRoute = '/api/v1/bills';

let token: string;
let cleanupAdmin: () => Promise<void>;

let testBranchId: string;
let testDepartmentId: string;
let testInventoryId: string;
let testProductId: string;
let testInventoryProductId: string;

let createdBillId: string;
let creditBillId: string;
let rejectCreditBillId: string;

beforeAll(async () => {
  await bootstrap();
  const setup = await tester.setupAdmin();
  token = setup.token;
  cleanupAdmin = setup.cleanup;

  const timestamp = Date.now();

  const branch = await Branch.create({
    name: `Test Bill Branch ${timestamp}`,
    code: `TBB-${timestamp}`,
    active: true,
  });
  testBranchId = branch._id.toString();

  const department = await Department.create({
    name: `Test Bill Department ${timestamp}`,
    code: `TBD-${timestamp}`,
    branch: branch._id as any,
    outstandingCredit: 0,
    creditBalance: 0,
    active: true,
  });
  testDepartmentId = department._id.toString();

  const inventory = await Inventory.create({
    name: `Test Bill Inventory ${timestamp}`,
    active: true,
  });
  testInventoryId = inventory._id.toString();

  const product = new Product({
    name: `Test Bill Product ${timestamp}`,
    description: 'Test product for bill test suite',
    active: true,
  });
  await product.save();
  testProductId = product._id.toString();

  const inventoryProduct = new InventoryProduct({
    inventory: inventory._id,
    product: product._id,
    quantity: 100,
    price: 50,
    active: true,
  });
  await inventoryProduct.save();
  testInventoryProductId = inventoryProduct._id.toString();
});

afterAll(async () => {
  if (cleanupAdmin) {
    await cleanupAdmin();
  }

  await Bill.deleteMany({
    $or: [
      { branch: testBranchId },
      { department: testDepartmentId },
      { 'items.item': testInventoryProductId },
    ],
  });

  if (testInventoryProductId) {
    await InventoryProduct.findByIdAndDelete(testInventoryProductId);
  }
  if (testProductId) {
    await Product.findByIdAndDelete(testProductId);
  }
  if (testInventoryId) {
    await Inventory.findByIdAndDelete(testInventoryId);
  }
  if (testDepartmentId) {
    await Department.findByIdAndDelete(testDepartmentId);
  }
  if (testBranchId) {
    await Branch.findByIdAndDelete(testBranchId);
  }
});

describe('Bill API Endpoint Suite', () => {
  it('should reject requests without authorization header', async () => {
    const res = await tester.get(baseRoute);

    tester.assertUnauthorized(res, 'Unauthenticated');
  });

  it('should successfully create a valid CASH bill', async () => {
    const res = await tester.post(
      baseRoute,
      {
        paymentMethod: 'CASH',
        branch: testBranchId,
        department: testDepartmentId,
        items: [
          {
            type: 'InventoryProduct',
            item: testInventoryProductId,
            name: 'Test Bill Product',
            quantity: 2,
            price: 50,
          },
        ],
        discount: 10,
        tax: 5,
      },
      token
    );

    tester.assertCreated(res, 'Bill', (data) => {
      createdBillId = data._id;
      expect(data.paymentMethod).to.equal('CASH');
      expect(data.status).to.equal('PAID');
      expect(data.approvalStatus).to.equal('approved');
      expect(data.total).to.equal(95);
    });
  });

  it('should return validation error on bill creation with invalid payload', async () => {
    const res = await tester.post(
      baseRoute,
      {
        paymentMethod: 'INVALID_METHOD',
        items: [],
      },
      token
    );

    tester.assertValidationError(res);
  });

  it('should successfully fetch all bills', async () => {
    const res = await tester.get(baseRoute, token);

    tester.assertFetched(res, 'bill');
  });

  it('should successfully fetch bill by ID', async () => {
    const res = await tester.get(`${baseRoute}/${createdBillId}`, token);

    tester.assertFetched(res, 'bill');
  });

  it('should successfully fetch bills by department', async () => {
    const res = await tester.get(`${baseRoute}/department/${testDepartmentId}`, token);

    tester.assertFetched(res, 'bill');
  });

  it('should successfully update bill', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdBillId}`,
      {
        discount: 20,
      },
      token
    );

    tester.assertUpdated(res, 'bill', (data) => {
      expect(data.discount).to.equal(20);
    });
  });

  it('should successfully update bill active status', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdBillId}/active-status`,
      {
        active: false,
      },
      token
    );

    tester.assertUpdated(res, 'bill');
  });

  it('should successfully soft delete bill', async () => {
    const res = await tester.del(`${baseRoute}/${createdBillId}`, token);

    tester.assertDeleted(res, 'bill');
  });

  it('should successfully retrieve soft deleted bill', async () => {
    const res = await tester.put(`${baseRoute}/${createdBillId}/retrieve`, undefined, token);

    tester.assertSuccess(res, 'Bill retrieved successfully');
  });

  it('should successfully permanently erase bill', async () => {
    const res = await tester.del(`${baseRoute}/${createdBillId}/erase`, token);

    tester.assertDeleted(res, 'bill');
  });

  it('should return 404 when requesting a non-existent bill', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await tester.get(`${baseRoute}/${nonExistentId}`, token);

    tester.assertNotFound(res, 'bill');
  });

  it('should successfully create a direct CREDIT bill in pending approval state', async () => {
    const res = await tester.post(
      baseRoute,
      {
        paymentMethod: 'CREDIT',
        branch: testBranchId,
        department: testDepartmentId,
        items: [
          {
            type: 'InventoryProduct',
            item: testInventoryProductId,
            name: 'Test Bill Product',
            quantity: 1,
            price: 50,
          },
        ],
      },
      token
    );

    tester.assertCreated(res, 'Bill', (data) => {
      creditBillId = data._id;
      expect(data.paymentMethod).to.equal('CREDIT');
      expect(data.status).to.equal('UNPAID');
      expect(data.approvalStatus).to.equal('pending');
    });
  });

  it('should successfully approve a pending CREDIT bill', async () => {
    const res = await tester.patch(
      `${baseRoute}/${creditBillId}/approve-credit`,
      {
        remarks: 'Approved by admin',
      },
      token
    );

    tester.assertUpdated(res, 'bill', (data) => {
      expect(data.approvalStatus).to.equal('approved');
    });
  });

  it('should successfully reject a pending CREDIT bill', async () => {
    const createRes = await tester.post(
      baseRoute,
      {
        paymentMethod: 'CREDIT',
        branch: testBranchId,
        department: testDepartmentId,
        items: [
          {
            type: 'InventoryProduct',
            item: testInventoryProductId,
            name: 'Test Bill Product',
            quantity: 1,
            price: 50,
          },
        ],
      },
      token
    );

    rejectCreditBillId = createRes.body.data._id;

    const res = await tester.patch(
      `${baseRoute}/${rejectCreditBillId}/reject-credit`,
      {
        remarks: 'Rejected by admin due to budget constraints',
      },
      token
    );

    tester.assertUpdated(res, 'bill', (data) => {
      expect(data.approvalStatus).to.equal('rejected');
    });
  });
});
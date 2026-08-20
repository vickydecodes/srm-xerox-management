import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import mongoose from 'mongoose';
import { bootstrap } from '../app.ts';
import Order from '@db/models/order.model.ts';
import Branch from '@db/models/branch.model.ts';
import Department from '@db/models/department.model.ts';
import Inventory from '@db/models/inventory.model.ts';
import Product from '@db/models/product.model.ts';
import InventoryProduct from '@db/models/inventory-product.model.ts';
import User from '@db/models/user.model.ts';
import { generateToken } from '../lib/jwt.ts';
import { tester } from '@core/constants/tester.constant.ts';

const baseRoute = '/api/v1/orders';

let token: string;
let userId: string;

let testBranchId: string;
let testDepartmentId: string;
let testInventoryId: string;
let testProductId: string;
let testInventoryProductId: string;

let createdOrderId: string = '';

beforeAll(async () => {
  await bootstrap();

  const timestamp = Date.now();

  const branch = await Branch.create({
    name: `Test Order Branch ${timestamp}`,
    code: `TOB-${timestamp}`,
    active: true,
  });
  testBranchId = branch._id.toString();

  const department = await Department.create({
    name: `Test Order Dept ${timestamp}`,
    code: `TOD-${timestamp}`,
    branch: branch._id,
    active: true,
  });
  testDepartmentId = department._id.toString();

  const user = await User.create({
    name: `Test Order User ${timestamp}`,
    email: `order_user_${timestamp}@srm.edu`,
    phone: '9876543205',
    password: 'Password123',
    role: 'super_admin',
    branch: branch._id as any,
    department: department._id as any,
    active: true,
  });
  userId = user._id.toString();
  token = generateToken({
    id: user._id,
    role: 'super_admin',
    branch: testBranchId,
    department: testDepartmentId,
  });

  const inventory = await Inventory.create({
    name: `Test Order Inventory ${timestamp}`,
    active: true,
  });
  testInventoryId = inventory._id.toString();

  const product = new Product({
    name: `Test Order Product ${timestamp}`,
    description: 'Product for order test',
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
  if (createdOrderId) {
    await Order.findByIdAndDelete(createdOrderId);
  }
  if (userId) {
    await User.findByIdAndDelete(userId);
  }
  if (testInventoryProductId) {
    await InventoryProduct.findByIdAndDelete(testInventoryProductId);
  }
  if (testProductId) {
    await Product.findByIdAndDelete(testProductId);
  }
  if (testInventoryId) {
    await InventoryProduct.deleteMany({ inventory: new mongoose.Types.ObjectId(testInventoryId) });
    await Inventory.findByIdAndDelete(testInventoryId);
  }
  if (testDepartmentId) {
    await Department.findByIdAndDelete(testDepartmentId);
  }
  if (testBranchId) {
    await Branch.findByIdAndDelete(testBranchId);
  }
});

describe('Order API Endpoint Suite', () => {
  it('should reject requests without authorization header', async () => {
    const res = await tester.get(baseRoute);

    tester.assertUnauthorized(res, 'Unauthenticated');
  });

  it('should successfully create an order in draft status', async () => {
    const res = await tester.post(
      baseRoute,
      {
        purpose: 'Annual Conference Materials',
        attachmentEmail: 'conference@srmist.edu.in',
        managementAmount: 500,
        sponsors: [
          {
            name: 'Tech Sponsor',
            amount: 200,
          },
        ],
        items: [
          {
            type: 'InventoryProduct',
            item: testInventoryProductId,
            name: 'Test Order Product',
            quantity: 5,
            price: 50,
          },
        ],
      },
      token
    );

    tester.assertCreated(res, 'Order', (data) => {
      createdOrderId = data._id;
      expect(data.status).to.equal('draft');
      expect(data.managementAmount).to.equal(500);
      expect(data.items).to.have.lengthOf(1);
    });
  });

  it('should return validation error on order creation with invalid payload', async () => {
    const res = await tester.post(
      baseRoute,
      {
        attachmentEmail: 'not-an-email', // invalid email
        managementAmount: -100, // negative amount
      },
      token
    );

    tester.assertValidationError(res);
  });

  it('should successfully fetch all orders', async () => {
    const res = await tester.get(baseRoute, token);

    tester.assertFetched(res, 'order');
  });

  it('should successfully fetch order by ID', async () => {
    const res = await tester.get(`${baseRoute}/${createdOrderId}`, token);

    tester.assertFetched(res, 'order');
  });

  it('should successfully update order', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdOrderId}`,
      {
        purpose: 'Updated Conference Materials',
        managementAmount: 600,
      },
      token
    );

    tester.assertUpdated(res, 'order', (data) => {
      expect(data.managementAmount).to.equal(600);
      expect(data.purpose).to.equal('Updated Conference Materials');
    });
  });

  it('should submit draft order for approval', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/submit`,
      undefined,
      token
    );

    tester.assertUpdated(res, 'order', (data) => {
      expect(data.status).to.equal('pending');
    });
  });

  it('should branch-approve order', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/branch-approve`,
      {
        status: 'approved',
        remarks: 'Approved by Branch Admin',
      },
      token
    );

    tester.assertUpdated(res, 'order', (data) => {
      expect(data.status).to.equal('in_progress');
    });
  });

  it('should super-admin-approve order', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/super-admin-approve`,
      {
        status: 'approved',
        remarks: 'Approved by Super Admin',
      },
      token
    );

    tester.assertUpdated(res, 'order');
  });

  it('should mark order ready for pickup', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/ready-for-pickup`,
      undefined,
      token
    );

    tester.assertUpdated(res, 'order', (data) => {
      expect(data.status).to.equal('ready_for_pickup');
    });
  });

  it('should mark order delivered', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/delivered`,
      undefined,
      token
    );

    tester.assertUpdated(res, 'order', (data) => {
      expect(data.status).to.equal('delivered');
    });
  });

  it('should successfully soft delete order', async () => {
    const res = await tester.del(`${baseRoute}/${createdOrderId}`, token);

    tester.assertDeleted(res, 'order');
  });

  it('should successfully retrieve soft deleted order', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdOrderId}/retrieve`,
      undefined,
      token
    );

    tester.assertSuccess(res, 'Order retrieved successfully');
  });

  it('should successfully permanently erase order', async () => {
    const res = await tester.del(`${baseRoute}/${createdOrderId}/erase`, token);

    tester.assertDeleted(res, 'order');
  });

  it('should return 404 when requesting a non-existent order', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await tester.get(`${baseRoute}/${nonExistentId}`, token);

    tester.assertNotFound(res, 'order');
  });
});

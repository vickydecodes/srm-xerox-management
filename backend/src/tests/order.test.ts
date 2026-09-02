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
import Shop from '@db/models/shop.model.ts';

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
let testShopId: string;

let createdOrderId = '';

beforeAll(async () => {
  await bootstrap();

  const timestamp = Date.now();

  // --------------------------------------------------
  // Branch
  // --------------------------------------------------

  const branch = await Branch.create({
    name: `Test Order Branch ${timestamp}`,
    code: `TOB-${timestamp}`,
    active: true,
  });

  testBranchId = branch._id.toString();

  // --------------------------------------------------
  // Department
  // --------------------------------------------------

  const department = await Department.create({
    name: `Test Order Dept ${timestamp}`,
    code: `TOD-${timestamp}`,
    branch: branch._id,
    active: true,
  });

  testDepartmentId = department._id.toString();

  // --------------------------------------------------
  // User
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Shop
  // --------------------------------------------------

  const shop = await Shop.create({
    name: `Test Order Shop ${timestamp}`,
    phone: '9876543210',
    createdBy: user._id,
    active: true,
  });

  testShopId = shop._id.toString();

  // --------------------------------------------------
  // Authentication token
  // --------------------------------------------------

  token = generateToken({
    id: user._id,
    role: 'super_admin',
    branch: testBranchId,
    department: testDepartmentId,
  });

  // --------------------------------------------------
  // Inventory
  // --------------------------------------------------

  const inventory = await Inventory.create({
    name: `Test Order Inventory ${timestamp}`,
    active: true,
  });

  testInventoryId = inventory._id.toString();

  // --------------------------------------------------
  // Product
  // --------------------------------------------------

  const product = new Product({
    name: `Test Order Product ${timestamp}`,
    description: 'Product for order test',
    active: true,
  });

  await product.save();

  testProductId = product._id.toString();

  // --------------------------------------------------
  // Inventory Product
  // --------------------------------------------------

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
    await InventoryProduct.findByIdAndDelete(
      testInventoryProductId
    );
  }

  if (testProductId) {
    await Product.findByIdAndDelete(testProductId);
  }

  if (testInventoryId) {
    await InventoryProduct.deleteMany({
      inventory: new mongoose.Types.ObjectId(testInventoryId),
    });

    await Inventory.findByIdAndDelete(testInventoryId);
  }

  if (testDepartmentId) {
    await Department.findByIdAndDelete(testDepartmentId);
  }

  if (testBranchId) {
    await Branch.findByIdAndDelete(testBranchId);
  }

  if (testShopId) {
    await Shop.findByIdAndDelete(testShopId);
  }
});

describe('Order API Endpoint Suite', () => {
  // --------------------------------------------------
  // Authentication
  // --------------------------------------------------

  it('should reject requests without authorization header', async () => {
    const res = await tester.get(baseRoute);

    tester.assertUnauthorized(res, 'Unauthenticated');
  });

  // --------------------------------------------------
  // Create
  // --------------------------------------------------

  it('should successfully create a WORK_ORDER in draft status', async () => {
    const res = await tester.post(
      baseRoute,
      {
        orderType: 'WORK_ORDER',

        shop: testShopId,

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

      expect(data.orderType).to.equal('WORK_ORDER');
      expect(data.status).to.equal('draft');
      expect(data.managementAmount).to.equal(500);
      expect(data.items).to.have.lengthOf(1);
    });
  });

  // --------------------------------------------------
  // Validation
  // --------------------------------------------------

  it('should return validation error on order creation with invalid payload', async () => {
    const res = await tester.post(
      baseRoute,
      {
        attachmentEmail: 'not-an-email',
        managementAmount: -100,
      },
      token
    );

    tester.assertValidationError(res);
  });

  // --------------------------------------------------
  // Get all
  // --------------------------------------------------

  it('should successfully fetch all orders', async () => {
    const res = await tester.get(
      baseRoute,
      token
    );

    tester.assertFetched(res, 'order');
  });

  // --------------------------------------------------
  // Get by ID
  // --------------------------------------------------

  it('should successfully fetch order by ID', async () => {
    const res = await tester.get(
      `${baseRoute}/${createdOrderId}`,
      token
    );

    tester.assertFetched(res, 'order');
  });

  // --------------------------------------------------
  // Update
  // --------------------------------------------------

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
      expect(data.purpose).to.equal(
        'Updated Conference Materials'
      );
    });
  });

  // --------------------------------------------------
  // Submit
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Branch approval
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Super admin approval
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Ready for pickup
  // --------------------------------------------------

  it('should mark order ready for pickup', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/ready-for-pickup`,
      undefined,
      token
    );

    tester.assertUpdated(res, 'order', (data) => {
      expect(data.status).to.equal(
        'ready_for_pickup'
      );
    });
  });

  // --------------------------------------------------
  // Delivered
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Soft delete
  // --------------------------------------------------

  it('should successfully soft delete order', async () => {
    const res = await tester.del(
      `${baseRoute}/${createdOrderId}`,
      token
    );

    tester.assertDeleted(res, 'order');
  });

  // --------------------------------------------------
  // Retrieve
  // --------------------------------------------------

  it('should successfully retrieve soft deleted order', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdOrderId}/retrieve`,
      undefined,
      token
    );

    tester.assertSuccess(
      res,
      'Order retrieved successfully'
    );
  });

  // --------------------------------------------------
  // Permanent erase
  // --------------------------------------------------

  it('should successfully permanently erase order', async () => {
    const res = await tester.del(
      `${baseRoute}/${createdOrderId}/erase`,
      token
    );

    tester.assertDeleted(res, 'order');
  });

  // --------------------------------------------------
  // Not found
  // --------------------------------------------------

  it('should return 404 when requesting a non-existent order', async () => {
    const nonExistentId =
      new mongoose.Types.ObjectId().toString();

    const res = await tester.get(
      `${baseRoute}/${nonExistentId}`,
      token
    );

    tester.assertNotFound(res, 'order');
  });
});
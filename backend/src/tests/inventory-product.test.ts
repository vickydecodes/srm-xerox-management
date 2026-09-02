import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import mongoose from 'mongoose';
import { bootstrap } from '../app.ts';
import InventoryProduct from '@db/models/inventory-product.model.ts';
import Inventory from '@db/models/inventory.model.ts';
import Product from '@db/models/product.model.ts';
import { tester } from '@core/constants/tester.constant.ts';

const baseRoute = '/api/v1/inventory-products';

let token: string;
let cleanupAdmin: () => Promise<void>;

let testInventoryId: string;
let testProductId: string;

let createdInventoryProductId: string = '';

beforeAll(async () => {
  await bootstrap();
  const setup = await tester.setupAdmin();
  token = setup.token;
  cleanupAdmin = setup.cleanup;

  const timestamp = Date.now();

  const inventory = await Inventory.create({
    name: `Test IP Inventory ${timestamp}`,
    active: true,
  });
  testInventoryId = inventory._id.toString();

  const product = new Product({
    name: `Test IP Product ${timestamp}`,
    description: 'Product for inventory product test',
    attributes: { color: ['Red'] },
    variants: [{ attributes: { color: 'Red' }, active: true }],
    active: true,
  });
  await product.save();
  testProductId = product._id.toString();
});

afterAll(async () => {
  if (cleanupAdmin) {
    await cleanupAdmin();
  }

  if (createdInventoryProductId) {
    await InventoryProduct.findByIdAndDelete(createdInventoryProductId);
  }

  if (testProductId) {
    await InventoryProduct.deleteMany({ product: new mongoose.Types.ObjectId(testProductId) });
    await Product.findByIdAndDelete(testProductId);
  }
  if (testInventoryId) {
    await InventoryProduct.deleteMany({ inventory: new mongoose.Types.ObjectId(testInventoryId) });
    await Inventory.findByIdAndDelete(testInventoryId);
  }
});

describe('Inventory Product API Endpoint Suite', () => {
  it('should reject requests without authorization header', async () => {
    const res = await tester.get(baseRoute);

    tester.assertUnauthorized(res, 'Unauthenticated');
  });

  it('should successfully create a standard inventory product', async () => {
    const res = await tester.post(
      baseRoute,
      {
        inventory: testInventoryId,
        product: testProductId,
        quantity: 50,
        price: 120,
      },
      token
    );

    tester.assertCreated(res, 'Inventory Product', (data) => {
      createdInventoryProductId = data._id;
      expect(data.quantity).to.equal(50);
      expect(data.price).to.equal(120);
    });
  });

  it('should return validation error on inventory product creation with invalid payload', async () => {
    const res = await tester.post(
      baseRoute,
      {
        inventory: testInventoryId,
        product: '', // required
        quantity: -10, // negative
        price: -5, // negative
      },
      token
    );

    tester.assertValidationError(res);
  });

  it('should successfully fetch all inventory products', async () => {
    const res = await tester.get(baseRoute, token);

    tester.assertFetched(res, 'inventory product');
  });

  it('should successfully fetch inventory product by ID', async () => {
    const res = await tester.get(`${baseRoute}/${createdInventoryProductId}`, token);

    tester.assertFetched(res, 'inventory product');
  });

  it('should successfully update inventory product', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdInventoryProductId}`,
      {
        quantity: 75,
        price: 130,
      },
      token
    );

    tester.assertUpdated(res, 'inventory product', (data) => {
      expect(data.quantity).to.equal(75);
      expect(data.price).to.equal(130);
    });
  });

  it('should successfully update inventory product active status', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdInventoryProductId}/active-status`,
      {
        active: false,
      },
      token
    );

    tester.assertUpdated(res, 'inventory product');
  });

  it('should successfully soft delete inventory product', async () => {
    const res = await tester.del(`${baseRoute}/${createdInventoryProductId}`, token);

    tester.assertDeleted(res, 'inventory product');
  });

  it('should successfully retrieve soft deleted inventory product', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdInventoryProductId}/retrieve`,
      undefined,
      token
    );

    tester.assertSuccess(res, 'Inventory product retrieved successfully');
  });

  it('should successfully permanently erase inventory product', async () => {
    const res = await tester.del(`${baseRoute}/${createdInventoryProductId}/erase`, token);

    tester.assertDeleted(res, 'inventory product');
  });

  it('should return 404 when requesting a non-existent inventory product', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await tester.get(`${baseRoute}/${nonExistentId}`, token);

    tester.assertNotFound(res, 'inventory product');
  });
});

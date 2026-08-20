import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import mongoose from 'mongoose';
import { bootstrap } from '../app.ts';
import Service from '@db/models/service.model.ts';
import Inventory from '@db/models/inventory.model.ts';
import Product from '@db/models/product.model.ts';
import InventoryProduct from '@db/models/inventory-product.model.ts';
import { tester } from '@core/constants/tester.constant.ts';

const baseRoute = '/api/v1/services';

let token: string;
let cleanupAdmin: () => Promise<void>;

let testInventoryId: string;
let testProductId: string;
let testInventoryProductId: string;

let createdServiceId: string;
let materialServiceId: string;

beforeAll(async () => {
  await bootstrap();
  const setup = await tester.setupAdmin();
  token = setup.token;
  cleanupAdmin = setup.cleanup;

  const timestamp = Date.now();

  const inventory = await Inventory.create({
    name: `Test Service Inventory ${timestamp}`,
    active: true,
  });
  testInventoryId = inventory._id.toString();

  const product = new Product({
    name: `Test Service Material Product ${timestamp}`,
    description: 'Material product for service test',
    active: true,
  });
  await product.save();
  testProductId = product._id.toString();

  const inventoryProduct = new InventoryProduct({
    inventory: inventory._id,
    product: product._id,
    quantity: 100,
    price: 10,
    active: true,
  });
  await inventoryProduct.save();
  testInventoryProductId = inventoryProduct._id.toString();
});

afterAll(async () => {
  if (cleanupAdmin) {
    await cleanupAdmin();
  }

  const serviceIds = [createdServiceId, materialServiceId].filter(Boolean);
  if (serviceIds.length > 0) {
    await Service.deleteMany({ _id: { $in: serviceIds } });
  }

  if (testInventoryProductId) {
    await InventoryProduct.findByIdAndDelete(testInventoryProductId);
  }
  if (testProductId) {
    await Product.findByIdAndDelete(testProductId);
  }
  if (testInventoryId) {
    await Inventory.findByIdAndDelete(testInventoryId);
  }
});

describe('Service API Endpoint Suite', () => {
  it('should reject requests without authorization header', async () => {
    const res = await tester.get(baseRoute);

    tester.assertUnauthorized(res, 'Unauthenticated');
  });

  it('should successfully create a basic service', async () => {
    const res = await tester.post(
      baseRoute,
      {
        name: `Test Xeroxing ${Date.now()}`,
        unit: 'per page',
        price: 2,
        description: 'Black and white photocopy',
      },
      token
    );

    tester.assertCreated(res, 'Service', (data) => {
      createdServiceId = data._id;
      expect(data.name).to.be.a('string');
      expect(data.code).to.be.a('string');
      expect(data.price).to.equal(2);
    });
  });

  it('should successfully create a service with materials linked to inventory products', async () => {
    const res = await tester.post(
      baseRoute,
      {
        name: `Test Spiral Binding ${Date.now()}`,
        unit: 'per book',
        price: 35,
        description: 'Document binding with coil and sheet',
        materials: [
          {
            product: testInventoryProductId,
            quantity: 1,
          },
        ],
      },
      token
    );

    tester.assertCreated(res, 'Service', (data) => {
      materialServiceId = data._id;
      expect(data.materials).to.have.lengthOf(1);
    });
  });

  it('should return validation error on service creation with invalid payload', async () => {
    const res = await tester.post(
      baseRoute,
      {
        name: 'A', // too short name
        unit: '', // required unit
        price: -5, // negative price
      },
      token
    );

    tester.assertValidationError(res);
  });

  it('should successfully fetch all services', async () => {
    const res = await tester.get(baseRoute, token);

    tester.assertFetched(res, 'service');
  });

  it('should successfully fetch service by ID', async () => {
    const res = await tester.get(`${baseRoute}/${createdServiceId}`, token);

    tester.assertFetched(res, 'service');
  });

  it('should successfully update service', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdServiceId}`,
      {
        price: 3,
        description: 'Updated price per page',
      },
      token
    );

    tester.assertUpdated(res, 'service', (data) => {
      expect(data.price).to.equal(3);
    });
  });

  it('should successfully update service active status', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdServiceId}/active-status`,
      {
        active: false,
      },
      token
    );

    tester.assertUpdated(res, 'service');
  });

  it('should successfully soft delete service', async () => {
    const res = await tester.del(`${baseRoute}/${createdServiceId}`, token);

    tester.assertDeleted(res, 'service');
  });

  it('should successfully retrieve soft deleted service', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdServiceId}/retrieve`,
      undefined,
      token
    );

    tester.assertSuccess(res, 'Service retrieved successfully');
  });

  it('should successfully permanently erase service', async () => {
    const res = await tester.del(`${baseRoute}/${createdServiceId}/erase`, token);

    tester.assertDeleted(res, 'service');
  });

  it('should return 404 when requesting a non-existent service', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await tester.get(`${baseRoute}/${nonExistentId}`, token);

    tester.assertNotFound(res, 'service');
  });
});

import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import mongoose from 'mongoose';
import { bootstrap } from '../app.ts';
import Product from '@db/models/product.model.ts';
import { tester } from '@core/constants/tester.constant.ts';

const baseRoute = '/api/v1/products';

let token: string;
let cleanupAdmin: () => Promise<void>;

let createdProductId: string;
let variantProductId: string;

beforeAll(async () => {
  await bootstrap();
  const setup = await tester.setupAdmin();
  token = setup.token;
  cleanupAdmin = setup.cleanup;
});

afterAll(async () => {
  if (cleanupAdmin) {
    await cleanupAdmin();
  }

  const ids = [createdProductId, variantProductId].filter(Boolean);
  if (ids.length > 0) {
    await Product.deleteMany({ _id: { $in: ids } });
  }
});

describe('Product API Endpoint Suite', () => {
  it('should reject requests without authorization header', async () => {
    const res = await tester.get(baseRoute);

    tester.assertUnauthorized(res, 'Unauthenticated');
  });

  it('should successfully create a basic product', async () => {
    const res = await tester.post(
      baseRoute,
      {
        name: `Test Product ${Date.now()}`,
        description: 'A test product without variants',
      },
      token
    );

    tester.assertCreated(res, 'Product', (data) => {
      createdProductId = data._id;
      expect(data.name).to.be.a('string');
      expect(data.code).to.be.a('string');
    });
  });

  it('should successfully create a product with attributes and variants', async () => {
    const res = await tester.post(
      baseRoute,
      {
        name: `Test Variant Product ${Date.now()}`,
        description: 'A test product with variants',
        attributes: { color: ['Red', 'Blue'] },
        variants: [
          { attributes: { color: 'Red' }, active: true },
          { attributes: { color: 'Blue' }, active: true },
        ],
      },
      token
    );

    tester.assertCreated(res, 'Product', (data) => {
      variantProductId = data._id;
      expect(data.variants).to.have.lengthOf(2);
    });
  });

  it('should return validation error on product creation with invalid payload', async () => {
    const res = await tester.post(
      baseRoute,
      {
        name: 'A', // too short name (< 2 chars)
      },
      token
    );

    tester.assertValidationError(res);
  });

  it('should successfully fetch all products', async () => {
    const res = await tester.get(baseRoute, token);

    tester.assertFetched(res, 'product');
  });

  it('should successfully fetch product by ID', async () => {
    const res = await tester.get(`${baseRoute}/${createdProductId}`, token);

    tester.assertFetched(res, 'product');
  });

  it('should successfully update product', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdProductId}`,
      {
        name: `Test Product Updated ${Date.now()}`,
        description: 'Updated description',
      },
      token
    );

    tester.assertUpdated(res, 'product', (data) => {
      expect(data.description).to.equal('Updated description');
    });
  });

  it('should successfully update product active status', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdProductId}/active-status`,
      {
        active: false,
      },
      token
    );

    tester.assertUpdated(res, 'product');
  });

  it('should successfully soft delete product', async () => {
    const res = await tester.del(`${baseRoute}/${createdProductId}`, token);

    tester.assertDeleted(res, 'product');
  });

  it('should successfully retrieve soft deleted product', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdProductId}/retrieve`,
      undefined,
      token
    );

    tester.assertSuccess(res, 'Product retrieved successfully');
  });

  it('should successfully permanently erase product', async () => {
    const res = await tester.del(`${baseRoute}/${createdProductId}/erase`, token);

    tester.assertDeleted(res, 'product');
  });

  it('should return 404 when requesting a non-existent product', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await tester.get(`${baseRoute}/${nonExistentId}`, token);

    tester.assertNotFound(res, 'product');
  });
});

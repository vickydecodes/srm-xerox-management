import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import mongoose from 'mongoose';
import { bootstrap } from '../app.ts';
import Shop from '@db/models/shop.model.ts';
import { tester } from '@core/constants/tester.constant.ts';

const baseRoute = '/api/v1/shops';

let token: string;
let cleanupAdmin: () => Promise<void>;

let createdShopId: string;

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

  if (createdShopId) {
    await Shop.findByIdAndDelete(createdShopId);
  }
});

describe('Shop API Endpoint Suite', () => {
  it('should reject requests without authorization header', async () => {
    const res = await tester.get(baseRoute);

    tester.assertUnauthorized(res, 'Unauthenticated');
  });

  it('should successfully create a shop', async () => {
    const timestamp = Date.now();
    const res = await tester.post(
      baseRoute,
      {
        name: `Test Campus Shop ${timestamp}`,
        phone: '9876543210',
        email: `shop_${timestamp}@srmist.edu.in`,
      },
      token
    );

    tester.assertCreated(res, 'Shop', (data) => {
      createdShopId = data._id;
      expect(data.name).to.be.a('string');
      expect(data.code).to.be.a('string');
      expect(data.phone).to.equal('9876543210');
    });
  });

  it('should return validation error on shop creation with invalid payload', async () => {
    const res = await tester.post(
      baseRoute,
      {
        name: 'A', // too short (< 2)
        phone: '', // required
      },
      token
    );

    tester.assertValidationError(res);
  });

  it('should successfully fetch all shops', async () => {
    const res = await tester.get(baseRoute, token);

    tester.assertFetched(res, 'shop');
  });

  it('should successfully fetch shop by ID', async () => {
    const res = await tester.get(`${baseRoute}/${createdShopId}`, token);

    tester.assertFetched(res, 'shop');
  });

  it('should successfully update shop', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdShopId}`,
      {
        name: `Updated Test Shop ${Date.now()}`,
        phone: '9123456789',
      },
      token
    );

    tester.assertUpdated(res, 'shop', (data) => {
      expect(data.phone).to.equal('9123456789');
    });
  });

  it('should successfully update shop active status', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdShopId}/active-status`,
      {
        active: false,
      },
      token
    );

    tester.assertUpdated(res, 'shop');
  });

  it('should successfully soft delete shop', async () => {
    const res = await tester.del(`${baseRoute}/${createdShopId}`, token);

    tester.assertDeleted(res, 'shop');
  });

  it('should successfully retrieve soft deleted shop', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdShopId}/retrieve`,
      undefined,
      token
    );

    tester.assertSuccess(res, 'Shop retrieved successfully');
  });

  it('should successfully permanently erase shop', async () => {
    const res = await tester.del(`${baseRoute}/${createdShopId}/erase`, token);

    tester.assertDeleted(res, 'shop');
  });

  it('should return 404 when requesting a non-existent shop', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await tester.get(`${baseRoute}/${nonExistentId}`, token);

    tester.assertNotFound(res, 'shop');
  });
});

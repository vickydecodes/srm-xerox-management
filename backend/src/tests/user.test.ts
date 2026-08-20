import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import mongoose from 'mongoose';
import { bootstrap } from '../app.ts';
import User from '@db/models/user.model.ts';
import Branch from '@db/models/branch.model.ts';
import Shop from '@db/models/shop.model.ts';
import { tester } from '@core/constants/tester.constant.ts';

const baseRoute = '/api/v1/users';

let token: string;
let cleanupAdmin: () => Promise<void>;

let testBranchId: string;
let testShopId: string;

let createdUserId: string = '';
let shopAdminUserId: string = '';

beforeAll(async () => {
  await bootstrap();
  const setup = await tester.setupAdmin();
  token = setup.token;
  cleanupAdmin = setup.cleanup;

  const timestamp = Date.now();

  const branch = await Branch.create({
    name: `Test User Branch ${timestamp}`,
    code: `TUB-${timestamp}`,
    active: true,
  });
  testBranchId = branch._id.toString();

  const shop = await Shop.create({
    name: `Test User Shop ${timestamp}`,
    phone: '9876543210',
    createdBy: setup.user._id,
    active: true,
  });
  testShopId = shop._id.toString();
});

afterAll(async () => {
  if (cleanupAdmin) {
    await cleanupAdmin();
  }

  if (createdUserId) {
    await User.findByIdAndDelete(createdUserId);
  }
  if (shopAdminUserId) {
    await User.findByIdAndDelete(shopAdminUserId);
  }

  if (testShopId) {
    await Shop.findByIdAndDelete(testShopId);
  }
  if (testBranchId) {
    await Branch.findByIdAndDelete(testBranchId);
  }
});

describe('User API Endpoint Suite', () => {
  it('should reject requests without authorization header', async () => {
    const res = await tester.get(baseRoute);

    tester.assertUnauthorized(res, 'Unauthenticated');
  });

  it('should successfully create a standard staff user', async () => {
    const timestamp = Date.now();
    const res = await tester.post(
      baseRoute,
      {
        name: `Test Staff ${timestamp}`,
        email: `staff_${timestamp}@srmist.edu.in`,
        phone: '9876543210',
        password: 'Password123',
        role: 'staff',
        branch: testBranchId,
      },
      token
    );

    tester.assertCreated(res, 'User', (data) => {
      createdUserId = data._id;
      expect(data.name).to.be.a('string');
      expect(data.login_id).to.be.a('string');
      expect(data.role).to.equal('staff');
    });
  });

  it('should successfully create a shop_admin user with shop association', async () => {
    const timestamp = Date.now();
    const res = await tester.post(
      baseRoute,
      {
        name: `Test Shop Admin ${timestamp}`,
        email: `shopadmin_${timestamp}@srmist.edu.in`,
        phone: '9876543211',
        password: 'Password123',
        role: 'shop_admin',
        shop: testShopId,
      },
      token
    );

    tester.assertCreated(res, 'User', (data) => {
      shopAdminUserId = data._id;
      expect(data.role).to.equal('shop_admin');
    });
  });

  it('should return validation error on user creation with invalid payload', async () => {
    const res = await tester.post(
      baseRoute,
      {
        name: 'A', // too short (< 2)
        email: 'invalid-email',
        phone: '123', // too short (< 10)
        password: '123', // too short (< 6)
        role: 'invalid_role',
      },
      token
    );

    tester.assertValidationError(res);
  });

  it('should return validation error when creating shop_admin without shop', async () => {
    const timestamp = Date.now();
    const res = await tester.post(
      baseRoute,
      {
        name: `Test Shop Admin No Shop ${timestamp}`,
        email: `shopadmin_noshop_${timestamp}@srmist.edu.in`,
        phone: '9876543212',
        password: 'Password123',
        role: 'shop_admin',
      },
      token
    );

    tester.assertValidationError(res);
  });

  it('should successfully fetch all users', async () => {
    const res = await tester.get(baseRoute, token);

    tester.assertFetched(res, 'user');
  });

  it('should successfully fetch user by ID', async () => {
    const res = await tester.get(`${baseRoute}/${createdUserId}`, token);

    tester.assertFetched(res, 'user');
  });

  it('should successfully update user', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdUserId}`,
      {
        name: `Updated Test Staff ${Date.now()}`,
        phone: '9123456789',
      },
      token
    );

    tester.assertUpdated(res, 'user', (data) => {
      expect(data.phone).to.equal('9123456789');
    });
  });

  it('should successfully update user active status', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdUserId}/active-status`,
      {
        active: false,
      },
      token
    );

    tester.assertUpdated(res, 'user');
  });

  it('should successfully soft delete user', async () => {
    const res = await tester.del(`${baseRoute}/${createdUserId}`, token);

    tester.assertDeleted(res, 'user');
  });

  it('should successfully retrieve soft deleted user', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdUserId}/retrieve`,
      undefined,
      token
    );

    tester.assertSuccess(res, 'User retrieved successfully');
  });

  it('should successfully permanently erase user', async () => {
    const res = await tester.del(`${baseRoute}/${createdUserId}/erase`, token);

    tester.assertDeleted(res, 'user');
  });

  it('should return 404 when requesting a non-existent user', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await tester.get(`${baseRoute}/${nonExistentId}`, token);

    tester.assertNotFound(res, 'user');
  });
});

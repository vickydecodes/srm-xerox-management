import { describe, it, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { bootstrap } from '../app.ts';
import Branch from '@db/models/branch.model.ts';
import { tester } from '@core/constants/tester.constant.ts';
import { baseRoute } from '../modules/branch/branch.route.ts';

let token: string;
let cleanupAdmin: () => Promise<void>;
let createdBranchId: string;

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
  await Branch.deleteMany({ code: { $in: ['TBR', 'TBR-UPD'] } });
});

describe('Branch API Endpoint Suite', () => {
  it('should reject requests without authorization header', async () => {
    const res = await tester.get(baseRoute);

    tester.assertUnauthorized(res, 'Unauthenticated');
  });

  it('should successfully create a branch', async () => {
    const res = await tester.post(baseRoute, {
      name: 'Test Branch',
      code: 'TBR',
    }, token);

    tester.assertCreated(res, 'Branch', (data) => {
      createdBranchId = data._id;
    });
  });

  it('should return validation error on branch creation with invalid fields', async () => {
    const res = await tester.post(baseRoute, {
      name: 'A', // too short name
      code: '', // required code
    }, token);

    tester.assertValidationError(res);
  });

  it('should successfully fetch all branches', async () => {
    const res = await tester.get(baseRoute, token);

    tester.assertFetched(res, 'branch');
  });

  it('should successfully fetch branch by ID', async () => {
    const res = await tester.get(`${baseRoute}/${createdBranchId}`, token);

    tester.assertFetched(res, 'branch');
  });

  it('should successfully update branch', async () => {
    const res = await tester.put(`${baseRoute}/${createdBranchId}`, {
      name: 'Test Branch Updated',
      code: 'TBR-UPD',
    }, token);

    tester.assertUpdated(res, 'branch', (data) => {
      createdBranchId = data._id;
    });
  });

  it('should successfully update branch active status', async () => {
    const res = await tester.patch(`${baseRoute}/${createdBranchId}/active-status`, {
      active: false,
    }, token);

    tester.assertUpdated(res, 'branch');
  });

  it('should successfully soft delete branch', async () => {
    const res = await tester.del(`${baseRoute}/${createdBranchId}`, token);

    tester.assertDeleted(res, 'branch');
  });

  it('should successfully retrieve soft deleted branch', async () => {
    const res = await tester.put(`${baseRoute}/${createdBranchId}/retrieve`, undefined, token);

    tester.assertSuccess(res, 'Branch retrieved successfully');
  });

  it('should successfully permanently erase branch', async () => {
    const res = await tester.del(`${baseRoute}/${createdBranchId}/erase`, token);

    tester.assertDeleted(res, 'branch');
  });

  it('should return 404 when requesting a non-existent branch', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await tester.get(`${baseRoute}/${nonExistentId}`, token);

    tester.assertNotFound(res, 'branch');
  });
});

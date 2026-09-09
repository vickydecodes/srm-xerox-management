import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { bootstrap } from '../app.ts';
import User from '@db/models/user.model.ts';
import Branch from '@db/models/branch.model.ts';
import Department from '@db/models/department.model.ts';
import Shop from '@db/models/shop.model.ts';
import { generateToken } from '../lib/jwt.ts';
import { tester } from '@core/constants/tester.constant.ts';

const baseRoute = '/api/v1/dashboards';

let superAdminToken: string;
let cleanupAdmin: () => Promise<void>;
let superAdminId: string;

let testBranchId: string;

let branchAdminToken: string;
let branchAdminUserId: string;

let deptAdminToken: string;
let deptAdminUserId: string;

let shopAdminToken: string;
let shopAdminUserId: string;

let staffToken: string;
let staffUserId: string;

beforeAll(async () => {
  await bootstrap();
  const setup = await tester.setupAdmin();
  superAdminToken = setup.token;
  cleanupAdmin = setup.cleanup;

  const timestamp = Date.now();

  const branch = await Branch.create({
    name: `Test Dashboard Branch ${timestamp}`,
    code: `TDB-${timestamp}`,
    active: true,
  });
  testBranchId = branch._id.toString();

  const branchAdmin = await User.create({
    name: `Test Branch Admin ${timestamp}`,
    email: `branch_admin_${timestamp}@srm.edu`,
    phone: '9876543201',
    password: 'Password123',
    role: 'branch_admin',
    branch: branch._id as any,
    active: true,
  });
  branchAdminUserId = branchAdmin._id.toString();
  branchAdminToken = generateToken({
    id: branchAdmin._id,
    role: 'branch_admin',
    branch: testBranchId,
  });

  const department: any = await Department.create({
    name: `Test Department ${timestamp}`,
    code: `TDEPT-${timestamp}`,
    branch: branch._id,
    createdBy: branchAdmin._id,
    active: true,
  } as any);

  const shop: any = await Shop.create({
    name: `Test Shop ${timestamp}`,
    phone: '9876543209',
    branch: branch._id,
    createdBy: branchAdmin._id,
    active: true,
  } as any);

  const deptAdmin = await User.create({
    name: `Test Dept Admin ${timestamp}`,
    email: `dept_admin_${timestamp}@srm.edu`,
    phone: '9876543202',
    password: 'Password123',
    role: 'department_admin',
    branch: branch._id as any,
    department: department._id as any,
    active: true,
  });
  deptAdminUserId = deptAdmin._id.toString();
  deptAdminToken = generateToken({
    id: deptAdmin._id,
    role: 'department_admin',
    branch: testBranchId,
    department: department._id.toString(),
  });

  const shopAdmin = await User.create({
    name: `Test Shop Admin ${timestamp}`,
    email: `shop_admin_${timestamp}@srm.edu`,
    phone: '9876543203',
    password: 'Password123',
    role: 'shop_admin',
    branch: branch._id as any,
    shop: shop._id as any,
    active: true,
  });
  shopAdminUserId = shopAdmin._id.toString();
  shopAdminToken = generateToken({
    id: shopAdmin._id,
    role: 'shop_admin',
    branch: testBranchId,
    shop: shop._id.toString(),
  });

  const staff = await User.create({
    name: `Test Staff ${timestamp}`,
    email: `staff_${timestamp}@srm.edu`,
    phone: '9876543204',
    password: 'Password123',
    role: 'staff',
    active: true,
  });
  staffUserId = staff._id.toString();
  staffToken = generateToken({
    id: staff._id,
    role: 'staff',
  });
});

afterAll(async () => {
  if (cleanupAdmin) {
    await cleanupAdmin();
  }

  const userIds = [branchAdminUserId, deptAdminUserId, shopAdminUserId, staffUserId].filter(Boolean);
  if (userIds.length > 0) {
    await User.deleteMany({ _id: { $in: userIds } });
  }

  if (testBranchId) {
    await Branch.findByIdAndDelete(testBranchId);
  }
});

describe('Dashboard API Endpoint Suite', () => {
  it('should reject requests without authorization header', async () => {
    const res = await tester.get(`${baseRoute}/super-admin`);

    tester.assertUnauthorized(res, 'Unauthenticated');
  });

  it('should allow super_admin to access super-admin dashboard', async () => {
    const res = await tester.get(`${baseRoute}/super-admin`, superAdminToken);

    tester.assertSuccess(res, 'Super Admin Dashboard metrics fetched successfully', (data) => {
      expect(data).to.have.property('stats');
    });
  });

  it('should deny non-super_admin access to super-admin dashboard', async () => {
    const res = await tester.get(`${baseRoute}/super-admin`, staffToken);

    tester.assertForbidden(res, 'Access denied: Insufficient permissions for this dashboard');
  });

  it('should allow branch_admin to access branch-admin dashboard', async () => {
    const res = await tester.get(`${baseRoute}/branch-admin`, branchAdminToken);

    tester.assertSuccess(res, 'Branch Admin Dashboard metrics fetched successfully', (data) => {
      expect(data).to.have.property('stats');
    });
  });

  it('should deny staff access to branch-admin dashboard', async () => {
    const res = await tester.get(`${baseRoute}/branch-admin`, staffToken);

    tester.assertForbidden(res, 'Access denied: Insufficient permissions for this dashboard');
  });

  it('should allow department_admin to access department-admin dashboard', async () => {
    const res = await tester.get(`${baseRoute}/department-admin`, deptAdminToken);

    tester.assertSuccess(res, 'Department Admin Dashboard metrics fetched successfully', (data) => {
      expect(data).to.have.property('stats');
    });
  });

  it('should allow shop_admin to access shop-admin dashboard', async () => {
    const res = await tester.get(`${baseRoute}/shop-admin`, shopAdminToken);

    tester.assertSuccess(res, 'Shop Admin Dashboard metrics fetched successfully', (data) => {
      expect(data).to.have.property('stats');
    });
  });

  it('should allow staff to access staff dashboard', async () => {
    const res = await tester.get(`${baseRoute}/staff`, staffToken);

    tester.assertSuccess(res, 'Staff Dashboard metrics fetched successfully', (data) => {
      expect(data).to.have.property('stats');
    });
  });

  it('should deny super_admin access to staff dashboard', async () => {
    const res = await tester.get(`${baseRoute}/staff`, superAdminToken);

    tester.assertForbidden(res, 'Access denied: Insufficient permissions for this dashboard');
  });
});

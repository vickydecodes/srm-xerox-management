import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { bootstrap } from '../app.ts';
import app from '../app.ts';
import request from 'supertest';

import XeroxOrder from '@db/models/xerox-order.model.ts';
import Branch from '@db/models/branch.model.ts';
import Department from '@db/models/department.model.ts';
import Service from '@db/models/service.model.ts';
import User from '@db/models/user.model.ts';
import Shop from '@db/models/shop.model.ts';

import { generateToken } from '../lib/jwt.ts';
import { tester } from '@core/constants/tester.constant.ts';

const baseRoute = '/api/v1/xerox-orders';

let token: string;
let userId: string;

let testBranchId: string;
let testDepartmentId: string;
let testServiceId: string;
let testShopId: string;

let createdOrderId = '';

beforeAll(async () => {
  await bootstrap();

  const timestamp = Date.now();

  const branch = await Branch.create({
    name: `Test XeroxOrder Branch ${timestamp}`,
    code: `TXOB-${timestamp}`,
    active: true,
  });
  testBranchId = branch._id.toString();

  const department = await Department.create({
    name: `Test XeroxOrder Dept ${timestamp}`,
    code: `TXOD-${timestamp}`,
    branch: branch._id,
    active: true,
  });
  testDepartmentId = department._id.toString();

  const user = await User.create({
    name: `Test XeroxOrder User ${timestamp}`,
    email: `xerox_order_${timestamp}@srm.edu`,
    phone: '9876543207',
    password: 'Password123',
    role: 'super_admin',
    branch: branch._id as any,
    department: department._id as any,
    active: true,
  });
  userId = user._id.toString();

  const shop = await Shop.create({
    name: `Test XeroxOrder Shop ${timestamp}`,
    code: `TXOS-${timestamp}`,
    phone: '9876543212',
    createdBy: user._id,
    active: true,
  });
  testShopId = shop._id.toString();

  token = generateToken({
    id: user._id,
    role: user.role,
    branch: user.branch,
    department: user.department,
  });

  const service = await Service.create({
    code: `S-XER-${timestamp}`,
    name: 'Xerox A4 Front & Back',
    description: 'A4 Double sided photocopying',
    unit: 'per page',
    price: 2,
    active: true,
  });
  testServiceId = service._id.toString();
});

afterAll(async () => {
  if (createdOrderId) {
    await XeroxOrder.findByIdAndDelete(createdOrderId);
  }
  if (userId) {
    await User.findByIdAndDelete(userId);
  }
  if (testServiceId) {
    await Service.findByIdAndDelete(testServiceId);
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

describe('XeroxOrder API Endpoint Suite', () => {
  it('should reject requests without authorization header', async () => {
    const res = await tester.get(baseRoute);
    tester.assertUnauthorized(res, 'Unauthenticated');
  });

  it('should successfully create a XeroxOrder with xerox printing specs, management funding, and self-support', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4\nfake-syllabus-document-content');

    const res = await request(app)
      .post(baseRoute)
      .set('Authorization', `Bearer ${token}`)
      .field('shop', testShopId)
      .field('purpose', 'Mid-Term Lab Manuals & Syllabus')
      .field('attachmentEmail', 'cse_manuals@srmist.edu.in')
      .field('managementAmount', '300')
      .field(
        'self_supports',
        JSON.stringify([
          {
            name: 'Department Lab Fund',
            amount: 200,
          },
        ])
      )
      .field(
        'items',
        JSON.stringify([
          {
            type: 'Service',
            item: testServiceId,
            name: 'Xerox A4 Front & Back',
            quantity: 50,
            price: 2,
            pages: 25,
            copies: 50,
            paperSize: 'A4',
            colorMode: 'BW',
            printSide: 'Double Sided',
            binding: 'Spiral',
          },
        ])
      )
      .attach('proofs', pdfBuffer, {
        filename: 'syllabus_document.pdf',
        contentType: 'application/pdf',
      });

    tester.assertCreated(res, 'XeroxOrder', (data) => {
      createdOrderId = data._id;

      expect(data.status).to.equal('draft');
      expect(data.purpose).to.equal('Mid-Term Lab Manuals & Syllabus');
      expect(data.managementAmount).to.equal(300);
      expect(data.self_supports).to.have.lengthOf(1);
      expect(data.items).to.have.lengthOf(1);
      expect(data.items[0].paperSize).to.equal('A4');
      expect(data.items[0].binding).to.equal('Spiral');
      expect(data.items[0].printSide).to.equal('Double Sided');
    });
  });

  it('should retrieve all xerox orders with pagination', async () => {
    const res = await tester.get(baseRoute, token);

    tester.assertSuccess(res, 'XeroxOrders fetched successfully', (data) => {
      expect(data).to.be.an('array');
      expect(data.length).to.be.greaterThan(0);
    });
  });

  it('should retrieve a single xerox order by ID', async () => {
    const res = await tester.get(`${baseRoute}/${createdOrderId}`, token);

    tester.assertSuccess(res, 'XeroxOrder retrieved successfully', (data) => {
      expect(data._id).to.equal(createdOrderId);
      expect(data.purpose).to.equal('Mid-Term Lab Manuals & Syllabus');
    });
  });

  it('should successfully update xerox order', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdOrderId}`,
      {
        purpose: 'Updated Lab Manuals Purpose',
      },
      token
    );

    tester.assertUpdated(res, 'XeroxOrder', (data) => {
      expect(data.purpose).to.equal('Updated Lab Manuals Purpose');
    });
  });

  it('should submit draft xerox order and generate code without requiring 72-hour delay', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/submit`,
      undefined,
      token
    );

    tester.assertUpdated(res, 'XeroxOrder', (data) => {
      expect(data.status).to.equal('pending');
      expect(data.code).to.match(/^XO-\d{4}$/);
    });
  });

  it('should branch-approve xerox order', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/branch-approve`,
      {
        status: 'approved',
        remarks: 'Branch approved xerox request',
      },
      token
    );

    tester.assertUpdated(res, 'XeroxOrder', (data) => {
      expect(data.branchAdminApproval.status).to.equal('approved');
    });
  });

  it('should mark xerox order in progress', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/in-progress`,
      undefined,
      token
    );

    tester.assertUpdated(res, 'XeroxOrder', (data) => {
      expect(data.status).to.equal('in_progress');
    });
  });

  it('should mark xerox order ready for pickup', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/ready-for-pickup`,
      undefined,
      token
    );

    tester.assertUpdated(res, 'XeroxOrder', (data) => {
      expect(data.status).to.equal('ready_for_pickup');
    });
  });

  it('should mark xerox order delivered', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/delivered`,
      undefined,
      token
    );

    tester.assertUpdated(res, 'XeroxOrder', (data) => {
      expect(data.status).to.equal('delivered');
    });
  });

  it('should successfully soft delete xerox order', async () => {
    const res = await tester.del(
      `${baseRoute}/${createdOrderId}`,
      token
    );

    tester.assertDeleted(res, 'XeroxOrder');
  });

  it('should successfully retrieve soft deleted xerox order', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdOrderId}/retrieve`,
      undefined,
      token
    );

    tester.assertSuccess(res, 'XeroxOrder retrieved successfully');
  });

  it('should successfully permanently erase xerox order', async () => {
    const res = await tester.del(
      `${baseRoute}/${createdOrderId}/erase`,
      token
    );

    tester.assertDeleted(res, 'XeroxOrder');
    createdOrderId = '';
  });

  it('should return 404 when requesting a non-existent xerox order', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const res = await tester.get(`${baseRoute}/${nonExistentId}`, token);
    tester.assertNotFound(res, 'XeroxOrder');
  });
});

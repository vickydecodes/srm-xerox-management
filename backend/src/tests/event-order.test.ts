import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { bootstrap } from '../app.ts';
import app from '../app.ts';
import request from 'supertest';

import EventOrder from '@db/models/event-order.model.ts';
import Branch from '@db/models/branch.model.ts';
import Department from '@db/models/department.model.ts';
import Inventory from '@db/models/inventory.model.ts';
import Product from '@db/models/product.model.ts';
import InventoryProduct from '@db/models/inventory-product.model.ts';
import User from '@db/models/user.model.ts';
import Shop from '@db/models/shop.model.ts';

import { generateToken } from '../lib/jwt.ts';
import { tester } from '@core/constants/tester.constant.ts';

const baseRoute = '/api/v1/event-orders';

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

  const branch = await Branch.create({
    name: `Test EventOrder Branch ${timestamp}`,
    code: `TEOB-${timestamp}`,
    active: true,
  });
  testBranchId = branch._id.toString();

  const department = await Department.create({
    name: `Test EventOrder Dept ${timestamp}`,
    code: `TEOD-${timestamp}`,
    branch: branch._id,
    active: true,
  });
  testDepartmentId = department._id.toString();

  const user = await User.create({
    name: `Test EventOrder User ${timestamp}`,
    email: `event_order_${timestamp}@srm.edu`,
    phone: '9876543206',
    password: 'Password123',
    role: 'super_admin',
    branch: branch._id as any,
    department: department._id as any,
    active: true,
  });
  userId = user._id.toString();

  const shop = await Shop.create({
    name: `Test EventOrder Shop ${timestamp}`,
    code: `TEOS-${timestamp}`,
    phone: '9876543211',
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

  const inventory = new Inventory({
    name: `Test EventOrder Inventory ${timestamp}`,
    active: true,
  });
  await inventory.save();
  testInventoryId = inventory._id.toString();

  const product = new Product({
    name: `Test EventOrder Product ${timestamp}`,
    code: `TEOP-${timestamp}`,
    active: true,
  });
  await product.save();
  testProductId = product._id.toString();

  const inventoryProduct = new InventoryProduct({
    inventory: testInventoryId,
    product: testProductId,
    price: 50,
    quantity: 100,
    active: true,
  });
  await inventoryProduct.save();
  testInventoryProductId = inventoryProduct._id.toString();
});

afterAll(async () => {
  if (createdOrderId) {
    await EventOrder.findByIdAndDelete(createdOrderId);
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
    await InventoryProduct.deleteMany({ inventory: testInventoryId });
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

describe('EventOrder API Endpoint Suite', () => {
  it('should reject requests without authorization header', async () => {
    const res = await tester.get(baseRoute);
    tester.assertUnauthorized(res, 'Unauthenticated');
  });

  it('should successfully create an EventOrder in draft status with proofs and items', async () => {
    const pngBuffer = Buffer.from('fake-signature-png-binary-data');
    const pdfBuffer = Buffer.from('%PDF-1.4\nfake-pdf-document-binary-data');

    // Event date 10 days in the future
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const res = await request(app)
      .post(baseRoute)
      .set('Authorization', `Bearer ${token}`)
      .field('shop', testShopId)
      .field('purpose', 'National Symposium Printing')
      .field('eventName', 'SRM Tech Fest 2026')
      .field('eventDate', futureDate)
      .field('approvedReferralNumber', 'SRM/DEAN/2026/045')
      .field('approvedDate', '2026-10-15')
      .field('attachmentEmail', 'symposium@srmist.edu.in')
      .field('managementAmount', '1000')
      .field(
        'self_supports',
        JSON.stringify([
          {
            name: 'Gold Sponsor',
            amount: 500,
          },
        ])
      )
      .field(
        'items',
        JSON.stringify([
          {
            type: 'InventoryProduct',
            item: testInventoryProductId,
            name: 'Test Event Product',
            quantity: 5,
            price: 50,
          },
        ])
      )
      .attach('proofs', pngBuffer, {
        filename: 'dean_signature_proof.png',
        contentType: 'image/png',
      })
      .attach('proofs', pdfBuffer, {
        filename: 'approval_sanction_proof.pdf',
        contentType: 'application/pdf',
      });

    tester.assertCreated(res, 'EventOrder', (data) => {
      createdOrderId = data._id;

      expect(data.status).to.equal('draft');
      expect(data.managementAmount).to.equal(1000);
      expect(data.eventName).to.equal('SRM Tech Fest 2026');
      expect(data.approvedReferralNumber).to.equal('SRM/DEAN/2026/045');
      expect(data.items).to.have.lengthOf(1);
      expect(data.proofs).to.have.lengthOf(2);
    });
  });

  it('should reject EventOrder creation when event date is less than 72 hours in advance', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const res = await tester.post(
      baseRoute,
      {
        eventName: 'Late Event',
        eventDate: yesterday,
        approvedReferralNumber: 'REF-001',
        approvedDate: '2026-10-10',
        attachmentEmail: 'late@srmist.edu.in',
      },
      token
    );

    tester.assertValidationError(res);
  });

  it('should reject proof upload with invalid file types', async () => {
    const res = await request(app)
      .post(baseRoute)
      .set('Authorization', `Bearer ${token}`)
      .field('eventName', 'Invalid File Event')
      .field('eventDate', new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
      .field('approvedReferralNumber', 'REF-002')
      .field('approvedDate', '2026-10-10')
      .field('attachmentEmail', 'invalid_file@srm.edu')
      .attach('proofs', Buffer.from('unsupported text content'), {
        filename: 'unsupported_document.txt',
        contentType: 'text/plain',
      });

    expect(res.status).to.equal(400);
    expect(res.body.success).to.be.false;
  });

  it('should successfully upload additional proof documents via POST /:id/proofs', async () => {
    const additionalProofBuffer = Buffer.from('fake-webp-image-data');

    const res = await request(app)
      .post(`${baseRoute}/${createdOrderId}/proofs`)
      .set('Authorization', `Bearer ${token}`)
      .attach('proofs', additionalProofBuffer, {
        filename: 'additional_dean_stamp.webp',
        contentType: 'image/webp',
      });

    tester.assertUpdated(res, 'EventOrder', (data) => {
      expect(data.proofs).to.have.lengthOf(3);
    });
  });

  it('should successfully verify a specific proof document via PATCH /:id/proofs/verify', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/proofs/verify`,
      {
        proofIndex: 0,
        verified: true,
      },
      token
    );

    tester.assertUpdated(res, 'EventOrder', (data) => {
      expect(data.proofs[0].verified).to.be.true;
    });
  });

  it('should retrieve all event orders with pagination and filtering', async () => {
    const res = await tester.get(baseRoute, token);

    tester.assertSuccess(res, 'EventOrders fetched successfully', (data) => {
      expect(data).to.be.an('array');
      expect(data.length).to.be.greaterThan(0);
    });
  });

  it('should retrieve a single event order by ID', async () => {
    const res = await tester.get(`${baseRoute}/${createdOrderId}`, token);

    tester.assertSuccess(res, 'EventOrder retrieved successfully', (data) => {
      expect(data._id).to.equal(createdOrderId);
      expect(data.eventName).to.equal('SRM Tech Fest 2026');
    });
  });

  it('should successfully update event order', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdOrderId}`,
      {
        purpose: 'Updated Symposium Purpose',
      },
      token
    );

    tester.assertUpdated(res, 'EventOrder', (data) => {
      expect(data.purpose).to.equal('Updated Symposium Purpose');
    });
  });

  it('should submit draft event order for approval and generate order code', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/submit`,
      undefined,
      token
    );

    tester.assertUpdated(res, 'EventOrder', (data) => {
      expect(data.status).to.equal('pending');
      expect(data.code).to.match(/^EVO-\d{4}$/);
    });
  });

  it('should branch-approve event order', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/branch-approve`,
      {
        status: 'approved',
        remarks: 'Branch approved for funding allocation',
        verifyProofs: true,
      },
      token
    );

    tester.assertUpdated(res, 'EventOrder', (data) => {
      expect(data.branchAdminApproval.status).to.equal('approved');
    });
  });

  it('should super-admin-approve event order', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/super-admin-approve`,
      {
        status: 'approved',
        remarks: 'Super admin sanction granted',
      },
      token
    );

    tester.assertUpdated(res, 'EventOrder', (data) => {
      expect(data.superAdminApproval.status).to.equal('approved');
    });
  });

  it('should mark event order in progress', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/in-progress`,
      undefined,
      token
    );

    tester.assertUpdated(res, 'EventOrder', (data) => {
      expect(data.status).to.equal('in_progress');
    });
  });

  it('should mark event order ready for pickup', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/ready-for-pickup`,
      undefined,
      token
    );

    tester.assertUpdated(res, 'EventOrder', (data) => {
      expect(data.status).to.equal('ready_for_pickup');
    });
  });

  it('should mark event order delivered', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/delivered`,
      undefined,
      token
    );

    tester.assertUpdated(res, 'EventOrder', (data) => {
      expect(data.status).to.equal('delivered');
    });
  });

  it('should successfully soft delete event order', async () => {
    const res = await tester.del(
      `${baseRoute}/${createdOrderId}`,
      token
    );

    tester.assertDeleted(res, 'EventOrder');
  });

  it('should successfully retrieve soft deleted event order', async () => {
    const res = await tester.put(
      `${baseRoute}/${createdOrderId}/retrieve`,
      undefined,
      token
    );

    tester.assertSuccess(res, 'EventOrder retrieved successfully');
  });

  it('should successfully permanently erase event order', async () => {
    const res = await tester.del(
      `${baseRoute}/${createdOrderId}/erase`,
      token
    );

    tester.assertDeleted(res, 'EventOrder');
    createdOrderId = '';
  });

  it('should return 404 when requesting a non-existent event order', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const res = await tester.get(`${baseRoute}/${nonExistentId}`, token);
    tester.assertNotFound(res, 'EventOrder');
  });
});

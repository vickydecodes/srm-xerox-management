import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import mongoose from 'mongoose';

import { bootstrap } from '../app.ts';
import app from '../app.ts';
import request from 'supertest';

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
    code: `TOS-${timestamp}`,
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
      inventory: testInventoryId,
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

  it('should successfully create a WORK_ORDER in draft status with image and PDF proof documents', async () => {
    const pngBuffer = Buffer.from('fake-signature-png-binary-data');
    const pdfBuffer = Buffer.from('%PDF-1.4\nfake-pdf-document-binary-data');

    const res = await request(app)
      .post(baseRoute)
      .set('Authorization', `Bearer ${token}`)
      .field('orderType', 'WORK_ORDER')
      .field('shop', testShopId)
      .field('purpose', 'Annual Conference Materials')
      .field('attachmentEmail', 'conference@srmist.edu.in')
      .field('managementAmount', '500')
      .field(
        'sponsors',
        JSON.stringify([
          {
            name: 'Tech Sponsor',
            amount: 200,
          },
        ])
      )
      .field(
        'items',
        JSON.stringify([
          {
            type: 'InventoryProduct',
            item: testInventoryProductId,
            name: 'Test Order Product',
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
        filename: 'approval_workorder_proof.pdf',
        contentType: 'application/pdf',
      });

    tester.assertCreated(res, 'Order', (data) => {
      createdOrderId = data._id;

      expect(data.orderType).to.equal('WORK_ORDER');
      expect(data.status).to.equal('draft');
      expect(data.managementAmount).to.equal(500);
      expect(data.items).to.have.lengthOf(1);
      expect(data.proofs).to.have.lengthOf(2);

      // Verify image proof
      expect(data.proofs[0].filename).to.equal('dean_signature_proof.png');
      expect(data.proofs[0].mimetype).to.equal('image/png');
      expect(data.proofs[0].proof).to.include('data:image/png;base64,');
      expect(data.proofs[0].verified).to.be.false;

      // Verify PDF proof
      expect(data.proofs[1].filename).to.equal('approval_workorder_proof.pdf');
      expect(data.proofs[1].mimetype).to.equal('application/pdf');
      expect(data.proofs[1].proof).to.include('data:application/pdf;base64,');
      expect(data.proofs[1].verified).to.be.false;
    });
  });

  // --------------------------------------------------
  // Validation & File Type Filtering
  // --------------------------------------------------

  it('should reject proof upload with invalid file types (e.g. text/plain)', async () => {
    const res = await request(app)
      .post(baseRoute)
      .set('Authorization', `Bearer ${token}`)
      .field('orderType', 'WORK_ORDER')
      .field('shop', testShopId)
      .field('attachmentEmail', 'invalid_file@srm.edu')
      .attach('proofs', Buffer.from('unsupported text content'), {
        filename: 'unsupported_document.txt',
        contentType: 'text/plain',
      });

    expect(res.status).to.equal(400);
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.include('Invalid file type');
  });

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
  // Proof Upload & Verification Endpoints
  // --------------------------------------------------

  it('should successfully upload additional proof documents via POST /:id/proofs', async () => {
    const additionalProofBuffer = Buffer.from('fake-webp-image-data');

    const res = await request(app)
      .post(`${baseRoute}/${createdOrderId}/proofs`)
      .set('Authorization', `Bearer ${token}`)
      .attach('proofs', additionalProofBuffer, {
        filename: 'additional_hod_signature.webp',
        contentType: 'image/webp',
      });

    tester.assertUpdated(res, 'order', (data) => {
      expect(data.proofs).to.have.lengthOf(3);
      expect(data.proofs[2].filename).to.equal('additional_hod_signature.webp');
      expect(data.proofs[2].mimetype).to.equal('image/webp');
      expect(data.proofs[2].verified).to.be.false;
    });
  });

  it('should reject proof upload when no files are provided via POST /:id/proofs', async () => {
    const res = await tester.post(
      `${baseRoute}/${createdOrderId}/proofs`,
      undefined,
      token
    );

    expect(res.status).to.equal(400);
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.include('No proof documents uploaded');
  });

  it('should reject proof upload from unauthorized roles (e.g. shop_admin)', async () => {
    const shopAdminToken = generateToken({
      id: userId,
      role: 'shop_admin',
      shop: testShopId,
    });

    const res = await request(app)
      .post(`${baseRoute}/${createdOrderId}/proofs`)
      .set('Authorization', `Bearer ${shopAdminToken}`)
      .attach('proofs', Buffer.from('fake-data'), {
        filename: 'unauthorized.png',
        contentType: 'image/png',
      });

    expect(res.status).to.equal(403);
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.include(
      'Only department admin can upload proof documents'
    );
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

    tester.assertUpdated(res, 'order', (data) => {
      expect(data.proofs[0].verified).to.be.true;
      expect(data.proofs[1].verified).to.be.false;
    });
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

  it('should reject submitting a draft order without proof documents', async () => {
    const draftRes = await tester.post(
      baseRoute,
      {
        orderType: 'WORK_ORDER',
        shop: testShopId,
        purpose: 'Draft without proofs',
        attachmentEmail: 'draft@srmist.edu.in',
        managementAmount: 100,
        items: [
          {
            type: 'InventoryProduct',
            item: testInventoryProductId,
            name: 'Test Order Product',
            quantity: 1,
            price: 50,
          },
        ],
      },
      token
    );
    const draftId = draftRes.body.data._id;

    const submitRes = await tester.patch(
      `${baseRoute}/${draftId}/submit`,
      undefined,
      token
    );

    expect(submitRes.status).to.equal(400);
    expect(submitRes.body.success).to.be.false;
    expect(submitRes.body.message).to.include(
      'Order cannot be submitted without at least one proof document'
    );

    await Order.findByIdAndDelete(draftId);
  });

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

  it('should branch-approve order and verify all attached proof documents', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/branch-approve`,
      {
        status: 'approved',
        remarks: 'Approved by Branch Admin with signatures verified',
        verifyProofs: true,
      },
      token
    );

    tester.assertUpdated(res, 'order', (data) => {
      expect(data.status).to.equal('in_progress');
      expect(data.proofs.every((p: any) => p.verified)).to.be.true;
    });
  });

  // --------------------------------------------------
  // Super admin approval
  // --------------------------------------------------

  it('should super-admin-approve order and retain verified proofs', async () => {
    const res = await tester.patch(
      `${baseRoute}/${createdOrderId}/super-admin-approve`,
      {
        status: 'approved',
        remarks: 'Approved by Super Admin',
        verifyProofs: true,
      },
      token
    );

    tester.assertUpdated(res, 'order', (data) => {
      expect(data.superAdminApproval.status).to.equal('approved');
      expect(data.proofs.every((p: any) => p.verified)).to.be.true;
    });
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
      '00000000-0000-0000-0000-000000000000';

    const res = await tester.get(
      `${baseRoute}/${nonExistentId}`,
      token
    );

    tester.assertNotFound(res, 'order');
  });
});
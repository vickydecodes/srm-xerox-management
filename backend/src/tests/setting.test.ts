import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { bootstrap } from '../app.ts';
import Setting from '@db/models/setting.model.ts';
import User from '@db/models/user.model.ts';
import { generateToken } from '../lib/jwt.ts';
import { tester } from '@core/constants/tester.constant.ts';

const baseRoute = '/api/v1/settings';

let token: string;
let cleanupAdmin: () => Promise<void>;

let staffToken: string;
let staffUserId: string;

beforeAll(async () => {
  await bootstrap();
  const setup = await tester.setupAdmin();
  token = setup.token;
  cleanupAdmin = setup.cleanup;

  // Create a staff user to test role-based restriction (403 Forbidden)
  const staffUser = await User.create({
    name: 'Test Staff Settings User',
    email: `staff_settings_${Date.now()}@srm.edu`,
    phone: '9999999998',
    password: 'Password123',
    role: 'staff',
    active: true,
  });
  staffUserId = staffUser._id.toString();
  staffToken = generateToken({ id: staffUser._id, role: 'staff' });
});

afterAll(async () => {
  if (cleanupAdmin) {
    await cleanupAdmin();
  }

  if (staffUserId) {
    await User.findByIdAndDelete(staffUserId);
  }

  // Restore default settings
  await Setting.findOneAndUpdate({}, { srmCollegeEmail: 'srmxerox@srmist.edu.in' });
});

describe('Setting API Endpoint Suite', () => {
  it('should reject requests without authorization header', async () => {
    const res = await tester.get(baseRoute);

    tester.assertUnauthorized(res, 'Unauthenticated');
  });

  it('should successfully fetch settings', async () => {
    const res = await tester.get(baseRoute, token);

    tester.assertFetched(res, 'setting');
    expect(res.body.data.srmCollegeEmail).to.be.a('string');
  });

  it('should return validation error on update with invalid email', async () => {
    const res = await tester.put(
      baseRoute,
      {
        srmCollegeEmail: 'not-a-valid-email',
      },
      token
    );

    tester.assertValidationError(res);
  });

  it('should return forbidden (403) when non-super_admin tries to update settings', async () => {
    const res = await tester.put(
      baseRoute,
      {
        srmCollegeEmail: 'newemail@srmist.edu.in',
      },
      staffToken
    );

    tester.assertForbidden(res, 'Only super admins can update settings');
  });

  it('should successfully update settings as super_admin', async () => {
    const newEmail = `updated_${Date.now()}@srmist.edu.in`;
    const res = await tester.put(
      baseRoute,
      {
        srmCollegeEmail: newEmail,
      },
      token
    );

    tester.assertUpdated(res, 'setting', (data) => {
      expect(data.srmCollegeEmail).to.equal(newEmail);
    });
  });

  it('should support 80mm, 110mm, A4, A5, and custom paper sizes', async () => {
    // 1. 80mm
    let res = await tester.put(
      baseRoute,
      {
        pdfPaperSize: '80mm',
        pdfMargin: 10,
        pdfLogoSize: 32,
      },
      token
    );
    tester.assertUpdated(res, 'setting', (data) => {
      expect(data.pdfPaperSize).to.equal('80mm');
      expect(data.pdfMargin).to.equal(10);
    });

    // 2. 110mm
    res = await tester.put(
      baseRoute,
      {
        pdfPaperSize: '110mm',
        pdfMargin: 14,
      },
      token
    );
    tester.assertUpdated(res, 'setting', (data) => {
      expect(data.pdfPaperSize).to.equal('110mm');
    });

    // 3. Custom with custom dimensions
    res = await tester.put(
      baseRoute,
      {
        pdfPaperSize: 'Custom',
        pdfCustomWidth: 105,
        pdfCustomHeight: 148,
        pdfMargin: 15,
      },
      token
    );
    tester.assertUpdated(res, 'setting', (data) => {
      expect(data.pdfPaperSize).to.equal('Custom');
      expect(data.pdfCustomWidth).to.equal(105);
      expect(data.pdfCustomHeight).to.equal(148);
    });
  });

  it('should adapt settings per shop ID (settings.shop = id)', async () => {
    const Shop = (await import('@db/models/shop.model.ts')).default;
    const testShop = await Shop.create({
      code: `SHOP_TEST_${Date.now()}`,
      name: 'Counter 80mm Test Shop',
      phone: '9876543210',
      createdBy: staffUserId,
    });
    const testShopId = testShop._id.toString();

    try {
      // Configure shop-specific setting with 80mm thermal receipt
      const res = await tester.put(
        baseRoute,
        {
          shop: testShopId,
          pdfTitle: 'Counter 80mm Express',
          pdfPaperSize: '80mm',
          pdfMargin: 8,
          pdfLogoSize: 30,
        },
        token
      );

      tester.assertUpdated(res, 'setting', (data) => {
        expect(data.shop).to.equal(testShopId);
        expect(data.pdfTitle).to.equal('Counter 80mm Express');
        expect(data.pdfPaperSize).to.equal('80mm');
      });

      // Fetch settings with query ?shop=testShopId
      const fetchShopRes = await tester.get(`${baseRoute}?shop=${testShopId}`, token);
      tester.assertFetched(fetchShopRes, 'setting');
      expect(fetchShopRes.body.data.shop).to.equal(testShopId);
      expect(fetchShopRes.body.data.pdfPaperSize).to.equal('80mm');

      // Fetch global settings without shop param
      const fetchGlobalRes = await tester.get(baseRoute, token);
      tester.assertFetched(fetchGlobalRes, 'setting');
      expect(fetchGlobalRes.body.data.shop).to.not.equal(testShopId);
    } finally {
      await Setting.deleteMany({ shop: testShopId });
      await Shop.findByIdAndDelete(testShopId);
    }
  });

  it('should successfully generate preview PDF for 80mm thermal format', async () => {
    const res = await tester.post(
      `${baseRoute}/preview-pdf`,
      {
        pdfTitle: 'PREVIEW THERMAL 80MM',
        pdfPaperSize: '80mm',
        pdfMargin: 10,
        pdfLogoSize: 30,
      },
      token
    );

    expect(res.status).to.equal(200);
    expect(res.headers['content-type']).to.include('application/pdf');
    expect(res.body).to.exist;
  });

  it('should successfully generate preview DOCX for 80mm thermal format', async () => {
    const res = await tester.post(
      `${baseRoute}/preview-docx`,
      {
        pdfTitle: 'PREVIEW THERMAL 80MM DOCX',
        pdfPaperSize: '80mm',
        pdfMargin: 8,
        pdfLogoSize: 28,
      },
      token
    );

    expect(res.status).to.equal(200);
    expect(res.headers['content-type']).to.include('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(res.body).to.exist;
  });

  it('should successfully generate preview DOCX for A5 Landscape format', async () => {
    const res = await tester.post(
      `${baseRoute}/preview-docx`,
      {
        pdfTitle: 'PREVIEW A5 DOCX',
        pdfPaperSize: 'A5 Landscape',
        pdfMargin: 25,
        pdfLogoSize: 45,
      },
      token
    );

    expect(res.status).to.equal(200);
    expect(res.headers['content-type']).to.include('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(res.body).to.exist;
  });
});

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
});

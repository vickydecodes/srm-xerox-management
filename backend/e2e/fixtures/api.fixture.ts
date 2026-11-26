import { APIRequestContext } from '@playwright/test';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import prisma from '../../src/config/prisma.config.js';

export const API_PREFIX = '/api/v1';

export interface TestAdminSession {
  userId: string;
  loginId: string;
  password: string;
  token: string;
  authHeaders: { Authorization: string };
  cleanup: () => Promise<void>;
}

/**
 * Creates a temporary super_admin user in PostgreSQL, logs in via the real
 * /api/v1/auths/login endpoint to obtain a JWT token, and returns a cleanup helper.
 */
export async function createTestAdminSession(
  request: APIRequestContext
): Promise<TestAdminSession> {
  const suffix = randomUUID().slice(0, 8);
  const loginId = `pw_admin_${suffix}`;
  const password = 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: `Playwright Admin ${suffix}`,
      login_id: loginId,
      email: `pw_admin_${suffix}@srm.edu`,
      phone: '9999999999',
      password: hashedPassword,
      role: 'super_admin',
      active: true,
      deleted: false,
    },
  });

  const loginRes = await request.post(`${API_PREFIX}/auths/login`, {
    data: {
      login_id: loginId,
      password,
    },
  });

  if (!loginRes.ok()) {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    throw new Error(`Failed to login test admin: ${loginRes.status()} ${await loginRes.text()}`);
  }

  const body = await loginRes.json();
  const token: string = body.data.token;

  return {
    userId: user.id,
    loginId,
    password,
    token,
    authHeaders: {
      Authorization: `Bearer ${token}`,
    },
    cleanup: async () => {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    },
  };
}

export { prisma };

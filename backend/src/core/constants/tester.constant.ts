import { expect } from 'vitest';
import request from 'supertest';
import app from '../../app.ts';
import User from '../../database/models/user.model.js';
import { generateToken } from '../../lib/jwt.ts';

const makeRequest = (method: string, url: string, body?: any, token?: string) => {
  let req = (request(app) as any)[method](url);
  if (token) {
    req = req.set('Authorization', `Bearer ${token}`);
  }
  if (body !== undefined) {
    req = req.send(body);
  }
  return req;
};

export const tester = {
  // Request wrappers
  get: (url: string, token?: string) => makeRequest('get', url, undefined, token),
  post: (url: string, body?: any, token?: string) => makeRequest('post', url, body, token),
  put: (url: string, body?: any, token?: string) => makeRequest('put', url, body, token),
  patch: (url: string, body?: any, token?: string) => makeRequest('patch', url, body, token),
  del: (url: string, token?: string) => makeRequest('delete', url, undefined, token),

  // Auth/Setup helper
  setupAdmin: async () => {
    const mockUser = await User.create({
      name: 'Test Super Admin',
      email: `testadmin_${Date.now()}@srm.edu`,
      phone: '9999999999',
      password: 'Password123',
      role: 'super_admin',
      active: true,
    });
    const token = generateToken({ id: mockUser._id, role: 'super_admin' });
    const cleanup = async () => {
      await User.findByIdAndDelete(mockUser._id);
    };
    return { token, user: mockUser, cleanup };
  },

  // Chai assertions
  assertSuccess: (res: any, message: string, dataMatcher?: (data: any) => void) => {
    expect(res.status).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.message).to.equal(message);
    expect(res.body.timestamp).to.exist;
    if (dataMatcher) dataMatcher(res.body.data);
  },

  assertCreated: (res: any, model: string, dataMatcher?: (data: any) => void) => {
    expect(res.status).to.equal(201);
    expect(res.body.success).to.be.true;
    expect(res.body.message).to.equal(`${model.charAt(0).toUpperCase() + model.slice(1)} created successfully`);
    expect(res.body.timestamp).to.exist;
    if (dataMatcher) dataMatcher(res.body.data);
  },

  assertUpdated: (res: any, model: string, dataMatcher?: (data: any) => void) => {
    expect(res.status).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.message).to.equal(`${model.charAt(0).toUpperCase() + model.slice(1)} updated successfully`);
    expect(res.body.timestamp).to.exist;
    if (dataMatcher) dataMatcher(res.body.data);
  },

  assertFetched: (res: any, model: string, expectedCount?: number) => {
    expect(res.status).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.message).to.contain('fetched successfully');
    expect(res.body.timestamp).to.exist;
    expect(res.body.data).to.exist;
    if (expectedCount !== undefined) {
      expect(res.body.count).to.equal(expectedCount);
      expect(res.body.data.length).to.equal(expectedCount);
    }
  },

  assertNotFound: (res: any, model: string) => {
    expect(res.status).to.equal(404);
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.equal(`${model.charAt(0).toUpperCase() + model.slice(1)} not found`);
    expect(res.body.timestamp).to.exist;
  },

  assertDeleted: (res: any, model: string) => {
    expect(res.status).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.message).to.equal(`${model.charAt(0).toUpperCase() + model.slice(1)} deleted successfully`);
    expect(res.body.timestamp).to.exist;
  },

  assertValidationError: (res: any, message?: string) => {
    expect(res.status).to.equal(400);
    expect(res.body.success).to.be.false;
    if (message) {
      expect(res.body.message).to.equal(message);
    }
    expect(res.body.timestamp).to.exist;
  },

  assertUnauthorized: (res: any, message: string = 'Unauthorized') => {
    expect(res.status).to.equal(401);
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.equal(message);
    expect(res.body.timestamp).to.exist;
  },

  assertForbidden: (res: any, message: string = 'Forbidden') => {
    expect(res.status).to.equal(403);
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.equal(message);
    expect(res.body.timestamp).to.exist;
  },
};

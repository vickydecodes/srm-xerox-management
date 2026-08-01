import { Types } from 'mongoose';
import { Role } from '@typings/auth.types.js';

const extractBranch = (queries: Record<string, unknown>) => {
  const branch = (queries as Record<string, any>).branch;
  if (branch) delete (queries as Record<string, any>).branch;
  return branch as string | undefined;
};

const ROLE = { SUPER_ADMIN: 'super_admin' } as const;

const UPDATE_OPTIONS = {
  new: true,
  runValidators: true,
  context: 'query',
} as const;

const SOFT_DELETE = {
  active: false,
  deleted: true,
  deletedAt: new Date(),
};

const RETRIEVE = {
  active: true,
  deleted: false,
  deletedAt: null,
};

const toObjectId = (value?: string | Types.ObjectId | null) => {
  if (!value) return null;
  if (value instanceof Types.ObjectId) return value;
  if (Types.ObjectId.isValid(value)) return new Types.ObjectId(value);
  return null;
};

const getVisibility = (role?: Role) =>
  role === ROLE.SUPER_ADMIN ? 'all' : 'active-only';

export {
  extractBranch,
  UPDATE_OPTIONS,
  SOFT_DELETE,
  RETRIEVE,
  toObjectId,
  getVisibility,
};
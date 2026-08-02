import { Role } from '@typings/auth.types.js';

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

const getVisibility = (role?: Role) =>
  role === ROLE.SUPER_ADMIN ? 'all' : 'active-only';

export {
  UPDATE_OPTIONS,
  SOFT_DELETE,
  RETRIEVE,
  getVisibility,
};
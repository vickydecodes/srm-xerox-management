import { Types } from 'mongoose';
import { Role } from '@typings/auth.types.js';

const ROLE = { SUPER_ADMIN: 'super_admin' } as const;

const toObjectId = (value?: any) => { return value ? value.toString() : null; };

const getVisibility = (role?: Role) => (role === ROLE.SUPER_ADMIN ? 'all' : 'active-only');

export { toObjectId, getVisibility };

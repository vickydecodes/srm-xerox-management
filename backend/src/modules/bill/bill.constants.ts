// modules/bill/bill.constants.ts
import mongoose from 'mongoose';
import { Role } from '@typings/auth.types.js';


const ROLE = { SUPER_ADMIN: 'super_admin' } as const;

export const UPDATE_OPTIONS = { new: true, runValidators: true };

export const SOFT_DELETE = { deleted: true, deletedAt: new Date(), active: false };

export const RETRIEVE = { deleted: false, deletedAt: null };

export const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

export const getVisibility = (role?: Role) => (role === ROLE.SUPER_ADMIN ? 'all' : 'active-only');

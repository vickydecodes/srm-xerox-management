import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';

import User from '@db/models/user.model.js';

import { generateToken, verifyToken } from '@lib/jwt.ts';
import { ApiError } from '@core/errors/api.error.ts';

import { ROLE, ERROR, SUCCESS } from './auth.constants.js';
import { buildPayload, ensureFields } from './auth.utils.js';

type Role = (typeof ROLE)[keyof typeof ROLE];

interface DecodedToken {
  id: string;
  loginId?: string;
  role: Role;
  iat?: number;
  exp?: number;
}

interface ReturnedUser {
  _id: Types.ObjectId;
  role: Role;
  [key: string]: any;
}

const validatePassword = async (raw: string, hashed: string) => {
  const match = await bcrypt.compare(raw, hashed);
  if (!match) throw new ApiError(401, ERROR.INVALID_PASSWORD);
};

export const login = async (loginId: string, password?: string) => {
  ensureFields({ loginId, password });

  const user: any = await User.findOne({ login_id: loginId }).select('+password');
  if (!user) throw new ApiError(404, ERROR.USER_NOT_FOUND);

  const role: Role = user.role;

  if (!user.active) throw new ApiError(403, ERROR.USER_INACTIVE);

  await validatePassword(password!, user.password);

  const payload = buildPayload(user, role, loginId);

  return {
    user: {
      ...user.toObject(),
      role,
      branch: user.branch || null,
    },
    token: generateToken(payload),
  };
};

export const adminResetPassword = async (data: {
  adminId: string;
  adminRole: string;
  targetId: string;
  newPassword: string;
}) => {
  ensureFields(data);

  const user = await User.findById(data.targetId);
  if (!user) throw new ApiError(404, ERROR.TARGET_NOT_FOUND);

  (user as any).password = data.newPassword;
  await (user as any).save();

  return { message: SUCCESS.PASSWORD_RESET };
};

export const changePassword = async (data: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) => {
  ensureFields(data);

  const user = await User.findById(data.userId).select('+password');
  if (!user) throw new ApiError(404, ERROR.USER_NOT_FOUND);

  const valid = await bcrypt.compare(data.currentPassword, (user as any).password);
  if (!valid) throw new ApiError(401, ERROR.CURRENT_PASSWORD_INVALID);

  (user as any).password = data.newPassword;
  await (user as any).save();

  return { message: SUCCESS.PASSWORD_CHANGED };
};

export const getCurrentUser = async (token: string): Promise<ReturnedUser> => {
  if (!token) throw new ApiError(401, ERROR.TOKEN_MISSING);

  let decoded: DecodedToken;
  try {
    decoded = verifyToken(token) as DecodedToken;
  } catch {
    throw new ApiError(401, ERROR.TOKEN_INVALID);
  }

  const { id, role } = decoded;

  const user = await User.findById(id)
    .select('-password')
    .populate({ path: 'branch', select: '_id name' })
    .lean();

  if (!user) throw new ApiError(404, ERROR.USER_NOT_FOUND);

  return {
    ...(user as any),
    _id: (user as any)._id as Types.ObjectId,
    role: (user as any).role || role,
  };
};

export const logout = async () => {
  return { message: SUCCESS.LOGOUT };
};

export const verifyPassword = async (data: {
  userId: string;
  password: string;
}): Promise<{ verified: boolean; message: string }> => {
  const user = await User.findById(data.userId).select('+password');
  if (!user) throw new ApiError(404, ERROR.USER_NOT_FOUND);

  const match = await bcrypt.compare(data.password, (user as any).password);

  return match
    ? { verified: true, message: SUCCESS.VERIFICATION_SUCCESS }
    : { verified: false, message: ERROR.VERIFICATION_FAILED };
};
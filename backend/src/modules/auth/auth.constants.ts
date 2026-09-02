export const ROLE = {
  SUPER_ADMIN: 'super_admin',
  BRANCH_ADMIN: 'branch_admin',
  DEPARTMENT_ADMIN: 'department_admin',
  SHOP_ADMIN: 'shop_admin',
  STAFF: 'staff',
} as const;

export const COOKIE = {
  NAME: 'access_token',
  MAX_AGE: 7 * 24 * 60 * 60 * 1000,
  OPTIONS: {
    httpOnly: true,
    path: '/',
  },
} as const;

export const ERROR = {
  USER_NOT_FOUND: 'User not found',
  PASSWORD_REQUIRED: 'Password required',
  INVALID_PASSWORD: 'Invalid password',
  TOKEN_MISSING: 'Token missing',
  TOKEN_INVALID: 'Invalid or expired token',
  CURRENT_PASSWORD_INVALID: 'Current password incorrect',
  TARGET_NOT_FOUND: 'Target user not found',
  REQUIRED_FIELDS: 'All fields are required',
  UNAUTHENTICATED: 'Unauthenticated',
  INVALID_TOKEN: 'Invalid token',
  VERIFICATION_FAILED: 'Password verification failed',
  USER_INACTIVE: 'Your account has been deactivated. Please contact admin.',
} as const;

export const SUCCESS = {
  PASSWORD_RESET: 'Password reset successfully',
  PASSWORD_CHANGED: 'Password updated successfully',
  LOGOUT: 'Logged out successfully',
  VERIFICATION_SUCCESS: 'Password verified successfully',
} as const;

export const SHORT_AGE = 24 * 60 * 60 * 1000; // 1 day
export const LONG_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

export const LOG = {
  LOGIN: {
    SUCCESS: 'Login successful',
    FAILED: 'Login attempt failed',
  },
  CURRENT_USER: {
    NO_TOKEN: 'Unauthenticated request — no token provided',
    INVALID_TOKEN: 'Invalid or expired token',
    SUCCESS: 'Current user fetched successfully',
  },
  CHANGE_PASSWORD: {
    REQUEST: 'Password change requested',
  },
  ADMIN_RESET: {
    INITIATED: 'Admin password reset initiated',
    SUCCESS: 'Admin password reset successful',
  },
  LOGOUT: {
    REQUEST: 'Logout requested',
    SUCCESS: 'Logout successful',
  },
} as const;

export const ENTITY = { USER: 'user' } as const;
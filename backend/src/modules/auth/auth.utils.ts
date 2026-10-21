export const buildPayload = (user: any, role: string, loginId: string) => ({
  id: user._id || user.id,
  loginId,
  role,
  branch: (typeof user.branch === 'object' && user.branch !== null) ? (user.branch._id || user.branch.id || '') : (user.branch || ''),
  department: (typeof user.department === 'object' && user.department !== null) ? (user.department._id || user.department.id || '') : (user.department || ''),
  shop: (typeof user.shop === 'object' && user.shop !== null) ? (user.shop._id || user.shop.id || '') : (user.shop || ''),
});

export const ensureFields = (fields: Record<string, any>) => {
  const invalid = Object.values(fields).some((v) => !v);
  if (invalid) throw new Error('All fields are required');
};

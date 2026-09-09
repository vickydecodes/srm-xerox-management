export const buildPayload = (user: any, role: string, loginId: string) => ({
  id: user._id,
  loginId,
  role,
  branch: user.branch || '',
  department: user.department || '',
  shop: user.shop || '',
});

export const ensureFields = (fields: Record<string, any>) => {
  const invalid = Object.values(fields).some((v) => !v);
  if (invalid) throw new Error('All fields are required');
};
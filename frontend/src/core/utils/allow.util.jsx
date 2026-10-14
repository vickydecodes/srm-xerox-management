export const ALL_ROLES = [
  'super_admin',
  'branch_admin',
  'manager',
  'department_admin',
  'shop_admin',
  'staff',
];

export const allow = (roles = ALL_ROLES, userRole) => {
  if (!userRole) return false;
  if (!Array.isArray(roles) || roles.length === 0) return false;
  return roles.includes(userRole);
};

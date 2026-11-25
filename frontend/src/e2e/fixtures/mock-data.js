/**
 * Shared mock users, domain payloads, and API response builders for Playwright E2E tests.
 */

export const mockUsers = {
  super_admin: {
    _id: 'super-admin-1',
    id: 'super-admin-1',
    role: 'super_admin',
    name: 'Super Admin',
    login_id: 'super_admin',
    token: 'mock-jwt-super-admin',
  },
  shop_admin: {
    _id: 'shop-admin-1',
    id: 'shop-admin-1',
    role: 'shop_admin',
    name: 'Shop Admin',
    login_id: 'shop_admin',
    token: 'mock-jwt-shop-admin',
  },
  department_admin: {
    _id: 'dept-admin-1',
    id: 'dept-admin-1',
    role: 'department_admin',
    name: 'CSE Department Admin',
    login_id: 'cse_dept',
    department: { _id: 'dept-1', name: 'Computer Science', code: 'CSE' },
    branch: { _id: 'branch-1', name: 'Main Campus' },
    token: 'mock-jwt-dept-admin',
  },
  staff: {
    _id: 'staff-1',
    id: 'staff-1',
    role: 'staff',
    name: 'Print Staff',
    login_id: 'staff_user',
    token: 'mock-jwt-staff',
  },
  branch_admin: {
    _id: 'branch-admin-1',
    id: 'branch-admin-1',
    role: 'branch_admin',
    name: 'Branch Admin',
    login_id: 'branch_admin',
    token: 'mock-jwt-branch-admin',
  },
  manager: {
    _id: 'manager-1',
    id: 'manager-1',
    role: 'manager',
    name: 'Operations Manager',
    login_id: 'manager_user',
    token: 'mock-jwt-manager',
  },
};

export const mockBills = [
  {
    _id: 'bill-101',
    id: 'bill-101',
    code: 'BILL-00101',
    items: [{ name: 'A4 B/W Print', quantity: 10, price: 2, type: 'inventory' }],
    total: 20,
    paymentMethod: 'CASH',
    status: 'PAID',
    createdAt: '2026-11-25T10:00:00.000Z',
  },
  {
    _id: 'bill-102',
    id: 'bill-102',
    code: 'BILL-00102',
    items: [{ name: 'Spiral Binding', quantity: 1, price: 50, type: 'service' }],
    total: 50,
    paymentMethod: 'CREDIT',
    status: 'UNPAID',
    createdAt: '2026-11-25T11:00:00.000Z',
  },
];

export const mockProducts = [
  { _id: 'prod-1', id: 'prod-1', name: 'A4 Copier Paper (75 GSM)', variants: [] },
  { _id: 'prod-2', id: 'prod-2', name: 'Glossy Photo Sheet (A4)', variants: [] },
];

export const mockInventoryItems = [
  {
    _id: 'inv-item-1',
    id: 'inv-item-1',
    product: { _id: 'prod-1', name: 'A4 Copier Paper (75 GSM)' },
    quantity: 120,
    price: 2.5,
    active: true,
  },
  {
    _id: 'inv-item-2',
    id: 'inv-item-2',
    product: { _id: 'prod-2', name: 'Glossy Photo Sheet (A4)' },
    quantity: 15,
    price: 15.0,
    active: true,
  },
  {
    _id: 'inv-item-3',
    id: 'inv-item-3',
    product: { _id: 'prod-3', name: 'Spiral Ring 12mm' },
    quantity: 0,
    price: 5.0,
    active: false,
  },
];

export const mockServices = [
  { _id: 'serv-1', id: 'serv-1', name: 'Color Xerox', rate: 10 },
];

export const mockEventOrders = [
  {
    _id: 'evt-101',
    id: 'evt-101',
    code: 'EVT-2026-001',
    eventName: 'Annual Tech Symposium',
    status: 'pending',
    createdAt: '2026-11-25T09:00:00.000Z',
  },
  {
    _id: 'evt-102',
    id: 'evt-102',
    code: 'EVT-2026-002',
    eventName: 'Convocation Brochures',
    status: 'delivered',
    createdAt: '2026-11-25T09:30:00.000Z',
  },
];

export const mockXeroxOrders = [
  {
    _id: 'xrx-201',
    id: 'xrx-201',
    code: 'XRX-2026-001',
    purpose: 'Semester Question Papers',
    status: 'in_progress',
    createdAt: '2026-11-25T08:00:00.000Z',
  },
  {
    _id: 'xrx-202',
    id: 'xrx-202',
    code: 'XRX-2026-002',
    purpose: 'Lab Manual Prints',
    status: 'ready_for_pickup',
    createdAt: '2026-11-25T08:30:00.000Z',
  },
];

export const successResponse = (data) => ({
  success: true,
  data,
});

export const paginatedResponse = (items = [], page = 1, limit = 10) => ({
  success: true,
  data: items,
  count: items.length,
  pagination: {
    page,
    limit,
    total: items.length,
    pages: Math.max(1, Math.ceil(items.length / limit)),
  },
});

export const errorResponse = (message = 'Request failed') => ({
  success: false,
  message,
});

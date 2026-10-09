import { beforeEach, describe, expect, it, vi } from 'vitest';

const models = vi.hoisted(() => ({
  user: { countDocuments: vi.fn(), find: vi.fn() },
  branch: { countDocuments: vi.fn(), find: vi.fn() },
  department: { countDocuments: vi.fn(), find: vi.fn(), findById: vi.fn() },
  product: { countDocuments: vi.fn() },
  service: { countDocuments: vi.fn() },
  bill: { find: vi.fn(), countDocuments: vi.fn() },
  inventoryProduct: { countDocuments: vi.fn() },
  order: { countDocuments: vi.fn(), find: vi.fn() },
}));

vi.mock('@db/models/user.model.ts', () => ({ default: models.user }));
vi.mock('@db/models/branch.model.ts', () => ({ default: models.branch }));
vi.mock('@db/models/department.model.ts', () => ({ default: models.department }));
vi.mock('@db/models/product.model.ts', () => ({ default: models.product }));
vi.mock('@db/models/service.model.ts', () => ({ default: models.service }));
vi.mock('@db/models/bill.model.ts', () => ({ default: models.bill }));
vi.mock('@db/models/inventory-product.model.ts', () => ({ default: models.inventoryProduct }));
vi.mock('@db/models/order.model.ts', () => ({ default: models.order }));

import {
  getBranchAdminDashboard,
  getDepartmentAdminDashboard,
  getShopAdminDashboard,
  getStaffDashboard,
  getSuperAdminDashboard,
} from '@modules/dashboard/dashboard.services.ts';

const bill = (overrides = {}) => ({
  _id: 'bill-1',
  total: 100,
  paymentMethod: 'CASH',
  status: 'PAID',
  branch: { _id: 'branch-1', name: 'Main' },
  department: { _id: 'department-1', name: 'Engineering' },
  createdAt: new Date('2025-01-15T12:00:00.000Z'),
  items: [{ name: 'A4 Paper', quantity: 2, price: 50, total: 100 }],
  ...overrides,
});

describe('Dashboard services', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    for (const model of [models.user, models.branch, models.department, models.product, models.service, models.inventoryProduct]) {
      if ('countDocuments' in model) model.countDocuments.mockResolvedValue(1);
    }
    models.user.find.mockResolvedValue([]);
    models.department.find.mockResolvedValue([]);
    models.department.findById.mockResolvedValue(null);
    models.branch.find.mockResolvedValue([{ _id: 'branch-1', name: 'Main' }]);
    models.bill.find.mockResolvedValue([]);
    models.bill.countDocuments.mockResolvedValue(0);
    models.order.find.mockResolvedValue([]);
    models.order.countDocuments.mockResolvedValue(0);
  });

  it('builds real super-admin totals and breakdowns from dated invoices', async () => {
    models.order.countDocuments.mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    models.bill.find.mockResolvedValue([
      bill(),
      bill({
        _id: 'bill-2',
        total: 25,
        paymentMethod: 'UPI',
        status: 'UNPAID',
        createdAt: new Date('2025-01-10T12:00:00.000Z'),
      }),
      bill({
        _id: 'bill-3',
        total: 30,
        paymentMethod: 'UPI',
        createdAt: new Date('2025-02-01T12:00:00.000Z'),
        items: [{ name: 'A4 Paper', quantity: 1, price: 30, total: 30 }],
      }),
    ]);

    const result = await getSuperAdminDashboard(
      '2025-02-28T23:59:59.999Z',
      '2025-01-01T00:00:00.000Z',
    );

    expect(models.bill.find).toHaveBeenCalledWith({
      deleted: false,
      createdAt: {
        lte: new Date('2025-02-28T23:59:59.999Z'),
        gte: new Date('2025-01-01T00:00:00.000Z'),
      },
    });
    expect(result.stats.totalBills).toBe(3);
    expect(result.stats.totalRevenue).toBe(130);
    expect(result.stats.pendingApprovals).toBe(2);
    expect(result.stats.unbilledRequisitions).toBe(1);
    expect(result.monthlyRevenue).toEqual([
      { year: 2025, month: 1, revenue: 100, count: 1 },
      { year: 2025, month: 2, revenue: 30, count: 1 },
    ]);
    expect(result.paymentMethods).toEqual([
      { method: 'CASH', count: 1, amount: 100 },
      { method: 'UPI', count: 1, amount: 30 },
    ]);
    expect(result.branchRevenue).toEqual([
      { _id: 'branch-1', total: 130, count: 2, name: 'Main' },
    ]);
    expect(result.topItems).toEqual([
      { _id: 'A4 Paper', count: 3, revenue: 130 },
    ]);
    expect(result.billsByStatus).toEqual([
      { _id: 'PAID', count: 2, amount: 130 },
      { _id: 'UNPAID', count: 1, amount: 25 },
    ]);
    expect(result.recentBills.map((item) => item._id)).toEqual(['bill-3', 'bill-1', 'bill-2']);
  });

  it('counts only active staff while including shop invoices in dashboard totals', async () => {
    models.user.find.mockResolvedValue([
      { _id: 'staff-1', role: 'staff', active: true },
      { _id: 'staff-2', role: 'staff', active: false },
      { _id: 'shop-admin-1', role: 'shop_admin', active: true },
    ]);
    models.bill.find.mockResolvedValue([
      bill({ createdBy: 'staff-1' }),
      bill({ _id: 'bill-2', status: 'UNPAID', createdBy: 'staff-2' }),
    ]);

    const result = await getShopAdminDashboard('shop-1');

    expect(result.stats).toEqual({
      staff: 1,
      totalBills: 2,
      totalRevenue: 100,
      pendingOrders: 0,
    });
    expect(models.bill.find).toHaveBeenCalledWith({
      createdBy: { in: ['staff-1', 'staff-2', 'shop-admin-1'] },
      deleted: false,
    });
  });

  it('returns branch-scoped invoice and department revenue summaries', async () => {
    models.department.countDocuments.mockResolvedValue(2);
    models.user.countDocuments.mockResolvedValue(4);
    models.inventoryProduct.countDocuments.mockResolvedValue(5);
    models.bill.find.mockResolvedValue([bill()]);
    models.department.find.mockResolvedValue([{ _id: 'department-1', name: 'Engineering' }]);
    models.order.countDocuments.mockResolvedValue(3);

    const result = await getBranchAdminDashboard('branch-1');

    expect(models.bill.find).toHaveBeenCalledWith({ branch: 'branch-1', deleted: false });
    expect(result.stats).toEqual({
      departments: 2,
      users: 4,
      totalBills: 1,
      inventoryProducts: 5,
      totalRevenue: 100,
    });
    expect(result.departmentRevenue).toEqual([
      { _id: 'department-1', total: 100, count: 1, name: 'Engineering' },
    ]);
    expect(result.pendingOrders).toBe(3);
  });

  it('reports department spending, credit balances, and its recent requisitions', async () => {
    models.department.findById.mockResolvedValue({ outstandingCredit: 75, creditBalance: 300 });
    models.user.countDocuments.mockResolvedValue(6);
    models.bill.find.mockResolvedValue([bill(), bill({ _id: 'bill-2', status: 'UNPAID' })]);
    models.bill.countDocuments.mockResolvedValue(2);
    models.order.find.mockResolvedValue([
      { _id: 'older-order', createdAt: new Date('2025-01-10T12:00:00.000Z') },
      { _id: 'newer-order', createdAt: new Date('2025-01-20T12:00:00.000Z') },
    ]);
    models.order.countDocuments.mockResolvedValue(4);

    const result = await getDepartmentAdminDashboard('department-1');

    expect(result.stats).toEqual({
      users: 6,
      totalBills: 2,
      totalSpend: 100,
      outstandingCredit: 75,
      creditBalance: 300,
      pendingOrders: 4,
    });
    expect(result.recentOrders.map((item) => item._id)).toEqual(['newer-order', 'older-order']);
    expect(result.recentBills.map((item) => item._id)).toEqual(['bill-1', 'bill-2']);
  });

  it('limits staff revenue and payment breakdowns to that staff member’s paid invoices', async () => {
    models.bill.find.mockResolvedValue([
      bill({ createdBy: 'staff-1' }),
      bill({
        _id: 'bill-2',
        total: 80,
        paymentMethod: 'UPI',
        createdBy: 'staff-1',
      }),
      bill({
        _id: 'bill-3',
        total: 20,
        status: 'UNPAID',
        createdBy: 'staff-1',
      }),
    ]);

    const result = await getStaffDashboard('staff-1');

    expect(models.bill.find).toHaveBeenCalledWith({
      createdBy: 'staff-1',
      deleted: false,
    });
    expect(result.stats).toEqual({
      totalBills: 3,
      totalPaidBills: 2,
      totalRevenue: 180,
    });
    expect(result.topItems).toEqual([
      { _id: 'A4 Paper', count: 4, revenue: 200 },
    ]);
    expect(result.paymentMethods).toEqual([
      { method: 'CASH', count: 1, amount: 100 },
      { method: 'UPI', count: 1, amount: 80 },
    ]);
  });
});

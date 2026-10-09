import User from '@db/models/user.model.ts';
import Branch from '@db/models/branch.model.ts';
import Department from '@db/models/department.model.ts';
import Product from '@db/models/product.model.ts';
import Service from '@db/models/service.model.ts';
import Bill from '@db/models/bill.model.ts';
import InventoryProduct from '@db/models/inventory-product.model.ts';
import Order from '@db/models/order.model.ts';

type DashboardBill = {
  _id: string;
  total: number;
  paymentMethod: string;
  status: string;
  branch?: string | { _id?: string; id?: string; name?: string } | null;
  department?: string | { _id?: string; id?: string; name?: string } | null;
  createdAt: Date;
  items: Array<{ name: string; quantity: number; price: number; total?: number }>;
};

const buildDateFilter = (lt?: string, gt?: string) => {
  const createdAt: { lte?: Date; gte?: Date } = {};
  if (lt) createdAt.lte = new Date(lt);
  if (gt) createdAt.gte = new Date(gt);
  return Object.keys(createdAt).length ? { createdAt } : {};
};

const sortNewestFirst = <T extends { createdAt?: Date }>(records: T[]) =>
  records.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));

const relatedId = (value: DashboardBill['branch'] | DashboardBill['department']) => {
  if (!value) return undefined;
  return typeof value === 'string' ? value : value._id || value.id;
};

const summarizeRevenue = (bills: DashboardBill[]) => {
  const monthly = new Map<string, { year: number; month: number; revenue: number; count: number }>();

  for (const bill of bills) {
    const createdAt = new Date(bill.createdAt);
    const year = createdAt.getUTCFullYear();
    const month = createdAt.getUTCMonth() + 1;
    const key = `${year}-${month}`;
    const record = monthly.get(key) || { year, month, revenue: 0, count: 0 };
    record.revenue += bill.total || 0;
    record.count += 1;
    monthly.set(key, record);
  }

  return {
    total: bills.reduce((sum, bill) => sum + (bill.total || 0), 0),
    monthly: [...monthly.values()]
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .slice(-6),
  };
};

const summarizePaymentMethods = (bills: DashboardBill[]) => {
  const methods = new Map<string, { method: string; count: number; amount: number }>();
  for (const bill of bills) {
    const method = bill.paymentMethod || 'UNKNOWN';
    const record = methods.get(method) || { method, count: 0, amount: 0 };
    record.count += 1;
    record.amount += bill.total || 0;
    methods.set(method, record);
  }
  return [...methods.values()];
};

const summarizeTopItems = (bills: DashboardBill[]) => {
  const items = new Map<string, { _id: string; count: number; revenue: number }>();
  for (const bill of bills) {
    for (const item of bill.items || []) {
      const name = item.name || 'Unknown item';
      const record = items.get(name) || { _id: name, count: 0, revenue: 0 };
      record.count += item.quantity || 0;
      record.revenue += item.total ?? (item.quantity || 0) * (item.price || 0);
      items.set(name, record);
    }
  }
  return [...items.values()].sort((a, b) => b.count - a.count).slice(0, 10);
};

const summarizeBillsByStatus = (bills: DashboardBill[]) => {
  const statuses = new Map<string, { _id: string; count: number; amount: number }>();
  for (const bill of bills) {
    const status = bill.status || 'UNKNOWN';
    const record = statuses.get(status) || { _id: status, count: 0, amount: 0 };
    record.count += 1;
    record.amount += bill.total || 0;
    statuses.set(status, record);
  }
  return [...statuses.values()];
};

const summarizeDepartmentRevenue = async (bills: DashboardBill[]) => {
  const groups = new Map<string, { _id: string; total: number; count: number }>();
  for (const bill of bills) {
    const departmentId = relatedId(bill.department);
    if (!departmentId) continue;
    const record = groups.get(departmentId) || { _id: departmentId, total: 0, count: 0 };
    record.total += bill.total || 0;
    record.count += 1;
    groups.set(departmentId, record);
  }
  const departments = groups.size
    ? await Department.find({ id: { in: [...groups.keys()] } })
    : [];
  const names = new Map(departments.map((department) => [department._id, department.name]));
  return [...groups.values()]
    .map((group) => ({ ...group, name: names.get(group._id) || 'Unknown Department' }))
    .sort((a, b) => b.total - a.total);
};

const summarizeBranchRevenue = async (bills: DashboardBill[]) => {
  const groups = new Map<string, { _id: string; total: number; count: number }>();
  for (const bill of bills) {
    const branchId = relatedId(bill.branch);
    if (!branchId) continue;
    const record = groups.get(branchId) || { _id: branchId, total: 0, count: 0 };
    record.total += bill.total || 0;
    record.count += 1;
    groups.set(branchId, record);
  }
  const branches = groups.size ? await Branch.find({ id: { in: [...groups.keys()] } }) : [];
  const names = new Map(branches.map((branch) => [branch._id, branch.name]));
  return [...groups.values()]
    .map((group) => ({ ...group, name: names.get(group._id) || 'Unknown Branch' }))
    .sort((a, b) => b.total - a.total);
};

export const getSuperAdminDashboard = async (lt?: string, gt?: string) => {
  const dateFilter = buildDateFilter(lt, gt);
  const [
    branchCount,
    departmentCount,
    userCount,
    productCount,
    serviceCount,
    bills,
    pendingApprovals,
    unbilledRequisitions,
  ] = await Promise.all([
    Branch.countDocuments({ active: true, deleted: false }),
    Department.countDocuments({ active: true, deleted: false }),
    User.countDocuments({ active: true, deleted: false }),
    Product.countDocuments({ active: true, deleted: false }),
    Service.countDocuments({ active: true, deleted: false }),
    Bill.find({ deleted: false, ...dateFilter }),
    Order.countDocuments({ status: 'pending', deleted: false }),
    Order.countDocuments({ status: 'in_progress', deleted: false }),
  ]);

  const scopedBills = bills as DashboardBill[];
  const paidBills = scopedBills.filter((bill) => bill.status === 'PAID');
  const revenue = summarizeRevenue(paidBills);

  return {
    stats: {
      branches: branchCount,
      departments: departmentCount,
      users: userCount,
      products: productCount,
      services: serviceCount,
      totalBills: scopedBills.length,
      totalRevenue: revenue.total,
      pendingApprovals,
      unbilledRequisitions,
    },
    monthlyRevenue: revenue.monthly,
    paymentMethods: summarizePaymentMethods(paidBills),
    branchRevenue: await summarizeBranchRevenue(paidBills),
    recentBills: sortNewestFirst(scopedBills),
    topItems: summarizeTopItems(paidBills),
    billsByStatus: summarizeBillsByStatus(scopedBills),
  };
};

export const getBranchAdminDashboard = async (branchId: string, lt?: string, gt?: string) => {
  const branchObjectId = branchId || null;
  const dateFilter = buildDateFilter(lt, gt);
  const billFilter = { branch: branchObjectId, deleted: false, ...dateFilter };
  const [
    departmentCount,
    userCount,
    inventoryProductCount,
    bills,
    pendingOrders,
  ] = await Promise.all([
    Department.countDocuments({ branch: branchObjectId, active: true, deleted: false }),
    User.countDocuments({ branch: branchObjectId, active: true, deleted: false }),
    InventoryProduct.countDocuments({ active: true, deleted: false }),
    Bill.find(billFilter),
    Order.countDocuments({
      branch: branchObjectId,
      branchAdminApproval: { path: ['status'], equals: 'pending' },
      deleted: false,
    }),
  ]);

  const scopedBills = bills as DashboardBill[];
  const paidBills = scopedBills.filter((bill) => bill.status === 'PAID');
  const revenue = summarizeRevenue(paidBills);

  return {
    stats: {
      departments: departmentCount,
      users: userCount,
      totalBills: scopedBills.length,
      inventoryProducts: inventoryProductCount,
      totalRevenue: revenue.total,
    },
    monthlyRevenue: revenue.monthly,
    paymentMethods: summarizePaymentMethods(paidBills),
    departmentRevenue: await summarizeDepartmentRevenue(paidBills),
    recentBills: sortNewestFirst(scopedBills),
    pendingOrders,
    topItems: summarizeTopItems(paidBills),
    billsByStatus: summarizeBillsByStatus(scopedBills),
  };
};

export const getDepartmentAdminDashboard = async (departmentId: string, lt?: string, gt?: string) => {
  const dateFilter = buildDateFilter(lt, gt);
  const [
    department,
    usersCount,
    bills,
    recentOrders,
    unpaidCreditBills,
    unbilledRequisitions,
  ] = await Promise.all([
    Department.findById(departmentId),
    User.countDocuments({ department: departmentId, active: true, deleted: false }),
    Bill.find({ department: departmentId, deleted: false, ...dateFilter }),
    Order.find({ department: departmentId, deleted: false, ...dateFilter }),
    Bill.find({
      department: departmentId,
      status: 'UNPAID',
      paymentMethod: 'CREDIT',
      deleted: false,
    }),
    Order.countDocuments({ department: departmentId, status: 'in_progress', deleted: false }),
  ]);

  const scopedBills = bills as DashboardBill[];
  const paidBills = scopedBills.filter((bill) => bill.status === 'PAID');
  const revenue = summarizeRevenue(paidBills);

  return {
    stats: {
      users: usersCount,
      totalBills: scopedBills.length,
      totalSpend: revenue.total,
      outstandingCredit: department?.outstandingCredit
        ?? unpaidCreditBills.reduce((total, bill) => total + (bill.total || 0), 0),
      creditBalance: department?.creditBalance ?? 0,
      pendingOrders: unbilledRequisitions,
    },
    recentOrders: sortNewestFirst(recentOrders),
    recentBills: sortNewestFirst(scopedBills),
  };
};

export const getShopAdminDashboard = async (shopId: string, lt?: string, gt?: string) => {
  const shopObjectId = shopId || null;
  const dateFilter = buildDateFilter(lt, gt);
  const shopUsers = await User.find({ shop: shopObjectId, deleted: false });
  const shopUserIds = shopUsers.map((user) => user._id);
  const staffCount = shopUsers.filter((user) => user.active && user.role === 'staff').length;
  const billFilter = { createdBy: { in: shopUserIds }, deleted: false, ...dateFilter };

  const [bills, pendingOrders] = await Promise.all([
    Bill.find(billFilter),
    Order.countDocuments({ shop: shopObjectId, status: 'in_progress', deleted: false }),
  ]);

  const scopedBills = bills as DashboardBill[];
  const paidBills = scopedBills.filter((bill) => bill.status === 'PAID');
  const revenue = summarizeRevenue(paidBills);

  return {
    stats: {
      staff: staffCount,
      totalBills: scopedBills.length,
      totalRevenue: revenue.total,
      pendingOrders,
    },
    recentBills: sortNewestFirst(scopedBills),
    topItems: summarizeTopItems(paidBills),
    monthlyRevenue: revenue.monthly,
  };
};

export const getStaffDashboard = async (userId: string, lt?: string, gt?: string) => {
  const userObjectId = userId || null;
  const dateFilter = buildDateFilter(lt, gt);
  const billFilter = { createdBy: userObjectId, deleted: false, ...dateFilter };
  const bills = await Bill.find(billFilter);

  const scopedBills = bills as DashboardBill[];
  const paidBills = scopedBills.filter((bill) => bill.status === 'PAID');
  const revenue = summarizeRevenue(paidBills);

  return {
    stats: {
      totalBills: scopedBills.length,
      totalPaidBills: paidBills.length,
      totalRevenue: revenue.total,
    },
    recentBills: sortNewestFirst(scopedBills),
    paymentMethods: summarizePaymentMethods(paidBills),
    monthlyRevenue: revenue.monthly,
    topItems: summarizeTopItems(paidBills),
  };
};

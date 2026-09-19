import mongoose from 'mongoose';
import User from '@db/models/user.model.ts';
import Branch from '@db/models/branch.model.ts';
import Department from '@db/models/department.model.ts';
import Product from '@db/models/product.model.ts';
import Service from '@db/models/service.model.ts';
import Bill from '@db/models/bill.model.ts';
import InventoryProduct from '@db/models/inventory-product.model.ts';
import Order from '@db/models/order.model.ts';

const buildDateFilter = (lt?: string, gt?: string) => {
  const filter: any = {};
  if (lt || gt) {
    filter.createdAt = {};
    if (lt) filter.createdAt.$lte = new Date(lt);
    if (gt) filter.createdAt.$gte = new Date(gt);
  }
  return filter;
};

export const getSuperAdminDashboard = async (lt?: string, gt?: string) => {
  const dateFilter = buildDateFilter(lt, gt);

  const [
    branchCount,
    departmentCount,
    userCount,
    productCount,
    serviceCount,
    billsCount,
    totalRevenueResult,
    monthlyRevenue,
    paymentMethods,
    branchRevenue,
    recentBills,
    pendingCreditBills,
    unbilledRequisitions,
    topItems,
    billsByStatus,
  ] = await Promise.all([
    Branch.countDocuments({ active: true, deleted: false, ...dateFilter }),
    Department.countDocuments({ active: true, deleted: false, ...dateFilter }),
    User.countDocuments({ active: true, deleted: false, ...dateFilter }),
    Product.countDocuments({ active: true, deleted: false, ...dateFilter }),
    Service.countDocuments({ active: true, deleted: false, ...dateFilter }),
    Bill.countDocuments({ deleted: false, ...dateFilter }),

    // Total revenue from paid bills
    Bill.aggregate([
      { $match: { status: 'PAID', deleted: false, ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),

    // Monthly revenue trend (last 6 months)
    Bill.aggregate([
      { $match: { status: 'PAID', deleted: false, ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 },
    ]),

    // Payment methods breakdown
    Bill.aggregate([
      { $match: { status: 'PAID', deleted: false, ...dateFilter } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$total' },
        },
      },
    ]),

    // Branch-wise revenue breakdown
    Bill.aggregate([
      { $match: { status: 'PAID', deleted: false, branch: { $ne: null }, ...dateFilter } },
      {
        $group: {
          _id: '$branch',
          total: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branchDetails',
        },
      },
      { $unwind: { path: '$branchDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ['$branchDetails.name', 'Unknown Branch'] },
          total: 1,
          count: 1,
        },
      },
      { $sort: { total: -1 } },
    ]),

    // Recent bills
    Bill.find({ deleted: false, ...dateFilter })
      
      ,

    // Orders waiting for approvals
    Order.countDocuments({ status: 'pending', deleted: false }),

    // Unbilled approved requisitions
    Order.countDocuments({ status: 'in_progress', deleted: false }),

    // Top selling items
    Bill.aggregate([
      { $match: { status: 'PAID', deleted: false, ...dateFilter } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          count: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),

    // Bills by status
    Bill.aggregate([
      { $match: { deleted: false, ...dateFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$total' },
        },
      },
    ]),
  ]);



  return {
    stats: {
      branches: branchCount,
      departments: departmentCount,
      users: userCount,
      products: productCount,
      services: serviceCount,
      totalBills: billsCount,
      totalRevenue: totalRevenueResult[0]?.total ?? 0,
      pendingCreditBills,
      unbilledRequisitions,
    },
    monthlyRevenue: monthlyRevenue.map((item) => ({
      year: item._id.year,
      month: item._id.month,
      revenue: item.revenue,
      count: item.count,
    })),
    paymentMethods: paymentMethods.map((item) => ({
      method: item._id || 'UNKNOWN',
      count: item.count,
      amount: item.amount,
    })),
    branchRevenue,
    recentBills,
    topItems,
    billsByStatus,
  };
};

export const getBranchAdminDashboard = async (branchId: string, lt?: string, gt?: string) => {
  const branchObjectId = branchId || null;
  const dateFilter = buildDateFilter(lt, gt);

  const [
    departmentCount,
    userCount,
    billsCount,
    inventoryProductCount,
    totalRevenueResult,
    monthlyRevenue,
    paymentMethods,
    departmentRevenue,
    recentBills,
    pendingOrders,
    topItems,
    billsByStatus
  ] = await Promise.all([
    Department.countDocuments({ branch: branchObjectId, active: true, deleted: false }),
    User.countDocuments({ branch: branchObjectId, active: true, deleted: false }),
    Bill.countDocuments({ branch: branchObjectId, deleted: false, ...dateFilter }),
    // Count distinct inventory products in this branch
    InventoryProduct.countDocuments({ active: true }),

    // Total branch revenue from paid bills
    Bill.aggregate([
      { $match: { branch: branchObjectId, status: 'PAID', deleted: false, ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),

    // Monthly branch revenue trend (last 6 months)
    Bill.aggregate([
      { $match: { branch: branchObjectId, status: 'PAID', deleted: false, ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 },
    ]),

    // Payment methods breakdown for this branch
    Bill.aggregate([
      { $match: { branch: branchObjectId, status: 'PAID', deleted: false, ...dateFilter } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$total' },
        },
      },
    ]),

    // Department-wise revenue breakdown in this branch
    Bill.aggregate([
      {
        $match: {
          branch: branchObjectId,
          status: 'PAID',
          deleted: false,
          department: { $ne: null },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: '$department',
          total: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'departmentDetails',
        },
      },
      { $unwind: { path: '$departmentDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ['$departmentDetails.name', 'Unknown Department'] },
          total: 1,
          count: 1,
        },
      },
      { $sort: { total: -1 } },
    ]),

    // Recent branch bills
    Bill.find({ branch: branchObjectId, deleted: false, ...dateFilter })
      
      ,
      
    // Branch Orders waiting for approval
    Order.countDocuments({ branch: branchObjectId, branchAdminApproval: { path: ["status"], equals: "pending" }, deleted: false }),
    
    // Top selling items in branch
    Bill.aggregate([
      { $match: { branch: branchObjectId, status: 'PAID', deleted: false, ...dateFilter } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          count: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    
    // Branch bills by status
    Bill.aggregate([
      { $match: { branch: branchObjectId, deleted: false, ...dateFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$total' },
        },
      },
    ]),
  ]);

  return {
    stats: {
      departments: departmentCount,
      users: userCount,
      totalBills: billsCount,
      inventoryProducts: inventoryProductCount,
      totalRevenue: totalRevenueResult[0]?.total ?? 0,
    },
    monthlyRevenue: monthlyRevenue.map((item) => ({
      year: item._id.year,
      month: item._id.month,
      revenue: item.revenue,
      count: item.count,
    })),
    paymentMethods: paymentMethods.map((item) => ({
      method: item._id || 'UNKNOWN',
      count: item.count,
      amount: item.amount,
    })),
    departmentRevenue,
    recentBills,
    pendingOrders,
    topItems,
    billsByStatus,
  };
};

export const getDepartmentAdminDashboard = async (departmentId: string, lt?: string, gt?: string) => {
  const dateFilter = buildDateFilter(lt, gt);

  const department = await Department.findById(departmentId);

  const [
    usersCount,
    billsCount,
    totalRevenueResult,
    recentOrders,
    recentBills,
    pendingCreditBills,
    unbilledRequisitions
  ] = await Promise.all([
    User.countDocuments({ department: departmentId, active: true, deleted: false }),
    Bill.countDocuments({ department: departmentId, deleted: false, ...dateFilter }),
    Bill.aggregate([
      { $match: { department: departmentId, status: 'PAID', deleted: false, ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.find({ department: departmentId, deleted: false, ...dateFilter })
      
      ,
    Bill.find({ department: departmentId, deleted: false, ...dateFilter })
      
      ,
    Bill.countDocuments({ department: departmentId, status: 'UNPAID', paymentMethod: 'CREDIT', deleted: false }),
    Order.countDocuments({ department: departmentId, status: 'in_progress', deleted: false }),
  ]);

  return {
    stats: {
      users: usersCount,
      totalBills: billsCount,
      totalSpend: totalRevenueResult[0]?.total ?? 0,
      outstandingCredit: department?.outstandingCredit ?? pendingCreditBills,
      creditBalance: department?.creditBalance ?? 0,
      pendingOrders: unbilledRequisitions,
    },
    recentOrders,
    recentBills,
  };
};

export const getShopAdminDashboard = async (shopId: string, lt?: string, gt?: string) => {
  const shopObjectId = shopId || null;
  const dateFilter = buildDateFilter(lt, gt);
  
  const shopStaff = await User.find({ shop: shopObjectId, deleted: false });
  const staffIds = shopStaff.map(u => u._id);

  const [
    billsCount,
    totalRevenueResult,
    pendingOrders,
    recentBills,
    topItems,
    monthlyRevenue
  ] = await Promise.all([
    Bill.countDocuments({ createdBy: { in: staffIds }, deleted: false, ...dateFilter }),
    Bill.aggregate([
      { $match: { createdBy: { in: staffIds }, status: 'PAID', deleted: false, ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments({ shop: shopObjectId, status: 'in_progress', deleted: false }),
    Bill.find({ createdBy: { in: staffIds }, deleted: false, ...dateFilter })
      
      
      
      ,
    Bill.aggregate([
      { $match: { createdBy: { in: staffIds }, status: 'PAID', deleted: false, ...dateFilter } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          count: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Bill.aggregate([
      { $match: { createdBy: { in: staffIds }, status: 'PAID', deleted: false, ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 },
    ]),
  ]);

  return {
    stats: {
      staff: staffIds.length,
      totalBills: billsCount,
      totalRevenue: totalRevenueResult[0]?.total ?? 0,
      pendingOrders: pendingOrders,
    },
    recentBills,
    topItems,
    monthlyRevenue: monthlyRevenue.map((item) => ({
      year: item._id.year,
      month: item._id.month,
      revenue: item.revenue,
      count: item.count,
    })),
  };
};

export const getStaffDashboard = async (userId: string, lt?: string, gt?: string) => {
  const userObjectId = userId || null;
  const dateFilter = buildDateFilter(lt, gt);

  const [
    totalBills,
    totalPaidBills,
    totalRevenueResult,
    recentBills,
    paymentMethods,
    monthlyRevenue,
  ] = await Promise.all([
    Bill.countDocuments({ createdBy: userObjectId, deleted: false, ...dateFilter }),
    Bill.countDocuments({ createdBy: userObjectId, status: 'PAID', deleted: false, ...dateFilter }),

    // Total staff revenue generated
    Bill.aggregate([
      { $match: { createdBy: userObjectId, status: 'PAID', deleted: false, ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),

    // Recent staff bills
    Bill.find({ createdBy: userObjectId, deleted: false, ...dateFilter })
      
      
      
      
      ,

    // Payment methods breakdown for this staff member
    Bill.aggregate([
      { $match: { createdBy: userObjectId, status: 'PAID', deleted: false, ...dateFilter } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$total' },
        },
      },
    ]),

    // Monthly staff revenue trend (last 6 months)
    Bill.aggregate([
      { $match: { createdBy: userObjectId, status: 'PAID', deleted: false, ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 },
    ]),
  ]);

  return {
    stats: {
      totalBills,
      totalPaidBills,
      totalRevenue: totalRevenueResult[0]?.total ?? 0,
    },
    recentBills,
    paymentMethods: paymentMethods.map((item) => ({
      method: item._id || 'UNKNOWN',
      count: item.count,
      amount: item.amount,
    })),
    monthlyRevenue: monthlyRevenue.map((item) => ({
      year: item._id.year,
      month: item._id.month,
      revenue: item.revenue,
      count: item.count,
    })),
  };
};

import mongoose from 'mongoose';
import User from '@db/models/user.model.ts';
import Branch from '@db/models/branch.model.ts';
import Department from '@db/models/department.model.ts';
import Product from '@db/models/product.model.ts';
import Service from '@db/models/service.model.ts';
import Bill from '@db/models/bill.model.ts';
import InventoryProduct from '@db/models/inventory-product.model.ts';
import Order from '@db/models/order.model.ts';

export const getSuperAdminDashboard = async () => {
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
  ] = await Promise.all([
    Branch.countDocuments({ active: true, deleted: false }),
    Department.countDocuments({ active: true, deleted: false }),
    User.countDocuments({ active: true, deleted: false }),
    Product.countDocuments({ active: true, deleted: false }),
    Service.countDocuments({ active: true, deleted: false }),
    Bill.countDocuments({ active: true, deleted: false }),

    // Total revenue from paid bills
    Bill.aggregate([
      { $match: { status: 'PAID', active: true, deleted: false } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),

    // Monthly revenue trend (last 6 months)
    Bill.aggregate([
      { $match: { status: 'PAID', active: true, deleted: false } },
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
      { $match: { status: 'PAID', active: true, deleted: false } },
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
      { $match: { status: 'PAID', active: true, deleted: false, branch: { $ne: null } } },
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
    Bill.find({ active: true, deleted: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('branch', 'name')
      .populate('department', 'name')
      .populate('createdBy', 'name')
      .lean(),

    // Pending credit bills needing Super Admin approval
    Bill.countDocuments({ paymentMethod: 'CREDIT', approvalStatus: 'pending', active: true, deleted: false }),

    // Unbilled approved requisitions
    Order.countDocuments({ status: 'in_progress', deleted: false }),
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
  };
};

export const getBranchAdminDashboard = async (branchId: string) => {
  const branchObjectId = new mongoose.Types.ObjectId(branchId);

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
  ] = await Promise.all([
    Department.countDocuments({ branch: branchObjectId, active: true, deleted: false }),
    User.countDocuments({ branch: branchObjectId, active: true, deleted: false }),
    Bill.countDocuments({ branch: branchObjectId, active: true, deleted: false }),
    // Count distinct inventory products in this branch
    InventoryProduct.countDocuments({ active: true }),

    // Total branch revenue from paid bills
    Bill.aggregate([
      { $match: { branch: branchObjectId, status: 'PAID', active: true, deleted: false } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),

    // Monthly branch revenue trend (last 6 months)
    Bill.aggregate([
      { $match: { branch: branchObjectId, status: 'PAID', active: true, deleted: false } },
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
      { $match: { branch: branchObjectId, status: 'PAID', active: true, deleted: false } },
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
          active: true,
          deleted: false,
          department: { $ne: null },
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
    Bill.find({ branch: branchObjectId, active: true, deleted: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('department', 'name')
      .populate('createdBy', 'name')
      .lean(),
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
  };
};

export const getStaffDashboard = async (userId: string) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [
    totalBills,
    totalPaidBills,
    totalRevenueResult,
    recentBills,
    paymentMethods,
    monthlyRevenue,
  ] = await Promise.all([
    Bill.countDocuments({ createdBy: userObjectId, active: true, deleted: false }),
    Bill.countDocuments({ createdBy: userObjectId, status: 'PAID', active: true, deleted: false }),

    // Total staff revenue generated
    Bill.aggregate([
      { $match: { createdBy: userObjectId, status: 'PAID', active: true, deleted: false } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),

    // Recent staff bills
    Bill.find({ createdBy: userObjectId, active: true, deleted: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('branch', 'name')
      .populate('department', 'name')
      .lean(),

    // Payment methods breakdown for this staff member
    Bill.aggregate([
      { $match: { createdBy: userObjectId, status: 'PAID', active: true, deleted: false } },
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
      { $match: { createdBy: userObjectId, status: 'PAID', active: true, deleted: false } },
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

import Bill, { IBillItem } from '@db/models/bill.model.ts';
import InventoryProduct from '@db/models/inventory-product.model.ts';
import Service from '@db/models/service.model.ts';
import Department from '@db/models/department.model.ts';
import Order from '@db/models/order.model.ts';
import User from '@db/models/user.model.ts';
import mongoose from 'mongoose';
import { dynamicFilter } from '@core/constants/dynamicfilter.constant.ts';
import { CreateBillPayload, UpdateBillPayload } from '@typings/bill.types.ts';
import { Role } from '@typings/auth.types.js';
import { UPDATE_OPTIONS, SOFT_DELETE, RETRIEVE, getVisibility } from './bill.constants.ts';
import { enhanceBill } from './bill.util.ts';
import { billFilterConfig } from './bill.filterconfig.ts';
import { applyCreditBalance } from '@modules/department/department.services.ts';

export const adjustStockForBill = async (
  oldItems: IBillItem[],
  newItems: IBillItem[]
) => {
  const serviceIds = new Set<string>();
  for (const item of [...oldItems, ...newItems]) {
    if (item.type === 'Service' && item.item) {
      serviceIds.add(item.item.toString());
    }
  }

  const serviceMap = new Map<string, any>();
  if (serviceIds.size > 0) {
    const services = await Service.find({ _id: { $in: Array.from(serviceIds) } });
    for (const s of services) {
      serviceMap.set(s._id.toString(), s);
    }
  }

  const oldMap = new Map<string, number>();
  for (const item of oldItems) {
    if (item.type === 'InventoryProduct') {
      const idStr = item.item.toString();
      oldMap.set(idStr, (oldMap.get(idStr) || 0) + item.quantity);
    } else if (item.type === 'Service') {
      const idStr = item.item.toString();
      const svc = serviceMap.get(idStr);
      if (svc && svc.materials) {
        for (const m of svc.materials) {
          const mIdStr = m.product.toString();
          const totalQty = item.quantity * m.quantity;
          oldMap.set(mIdStr, (oldMap.get(mIdStr) || 0) + totalQty);
        }
      }
    }
  }

  const newMap = new Map<string, number>();
  for (const item of newItems) {
    if (item.type === 'InventoryProduct') {
      const idStr = item.item.toString();
      newMap.set(idStr, (newMap.get(idStr) || 0) + item.quantity);
    } else if (item.type === 'Service') {
      const idStr = item.item.toString();
      const svc = serviceMap.get(idStr);
      if (svc && svc.materials) {
        for (const m of svc.materials) {
          const mIdStr = m.product.toString();
          const totalQty = item.quantity * m.quantity;
          newMap.set(mIdStr, (newMap.get(mIdStr) || 0) + totalQty);
        }
      }
    }
  }

  const allItemIds = new Set([...oldMap.keys(), ...newMap.keys()]);

  for (const itemId of allItemIds) {
    const oldQty = oldMap.get(itemId) || 0;
    const newQty = newMap.get(itemId) || 0;
    const diff = newQty - oldQty;

    if (diff !== 0) {
      await InventoryProduct.findByIdAndUpdate(
        itemId,
        { $inc: { quantity: -diff } }
      );
    }
  }
};

export const createBill = async (data: CreateBillPayload, createdBy: string) => {
  // If this is for an order, make sure it exists and isn't already billed
  if (data.order) {
    const order = await Order.findById(data.order);
    if (!order) throw new Error('Order not found');
    if (order.bill) throw new Error('Order is already billed');
  }

  await adjustStockForBill([], data.items as any);

  // Determine initial status and approvalStatus
  let status = 'UNPAID';
  let approvalStatus: 'pending' | 'approved' | 'rejected' = 'approved';

  if (data.paymentMethod === 'CREDIT') {
    status = 'UNPAID';
    if (data.order) {
      // Linked to order
      approvalStatus = 'approved';
    } else {
      // Direct CREDIT bill
      approvalStatus = 'pending';
    }
  } else {
    // CASH or UPI bills are immediately paid and approved
    status = 'PAID';
    approvalStatus = 'approved';
  }

  const bill = new Bill({
    ...data,
    status,
    approvalStatus,
    createdBy,
  });

  // Run totals pre-save trigger beforehand to know the bill total for credit validation
  bill.items = bill.items.map((item) => ({
    ...item,
    total: item.quantity * item.price,
  }));
  bill.subtotal = bill.items.reduce((sum, item) => sum + item.total, 0);
  bill.total = bill.subtotal - (bill.discount || 0) + (bill.tax || 0);

  await bill.save();

  // If this is a direct CREDIT bill, apply the credit now.
  // Otherwise (linked to order), apply it when the order is marked delivered.
  if (data.paymentMethod === 'CREDIT' && data.department && !data.order) {
    const dept = await Department.findById(data.department);
    if (!dept) throw new Error('Department not found');

    if (approvalStatus === 'approved') {
      dept.outstandingCredit += bill.total;
      await applyCreditBalance(dept);
      await dept.save();
    }
  }

  if (data.order) {
    const order = await Order.findById(data.order);
    if (order) {
      const creatorUser = await User.findById(createdBy);
      if (creatorUser && creatorUser.role !== 'super_admin') {
        if (order.shop && creatorUser.shop && order.shop.toString() !== creatorUser.shop.toString()) {
          throw new Error('This order belongs to another shop');
        }
      }
      order.bill = bill._id as any;
      order.status = 'ready_for_pickup';
      await order.save();
    }
  }

  const updatedBill = await Bill.findById(bill._id);
  return enhanceBill(updatedBill!);
};

export const approveCreditBill = async (id: string, userId: string, remarks?: string) => {
  const bill = await Bill.findById(id);
  if (!bill) return null;
  if (bill.paymentMethod !== 'CREDIT' || bill.approvalStatus !== 'pending') {
    throw new Error('Bill is not a pending CREDIT bill');
  }

  bill.approvalStatus = 'approved';
  bill.approvedBy = new mongoose.Types.ObjectId(userId);
  bill.approvedAt = new Date();
  if (remarks) bill.remarks = remarks;

  await bill.save();

  // Only apply credit on approval if this is a direct bill (not linked to an order)
  if (bill.department && !bill.order) {
    const dept = await Department.findById(bill.department);
    if (!dept) throw new Error('Department not found');

    dept.outstandingCredit += bill.total;
    await applyCreditBalance(dept);
    await dept.save();
  }

  const updatedBill = await Bill.findById(id);
  return enhanceBill(updatedBill!);
};

export const rejectCreditBill = async (id: string, userId: string, remarks?: string) => {
  const bill = await Bill.findById(id);
  if (!bill) return null;
  if (bill.paymentMethod !== 'CREDIT' || bill.approvalStatus !== 'pending') {
    throw new Error('Bill is not a pending CREDIT bill');
  }

  bill.approvalStatus = 'rejected';
  bill.approvedBy = new mongoose.Types.ObjectId(userId);
  bill.approvedAt = new Date();
  if (remarks) bill.remarks = remarks;

  await bill.save();
  return enhanceBill(bill);
};

export const getAllBills = async (
  queries: Record<string, unknown>,
  role?: Role,
  options?: { createdBy?: string }
) => {
  const rawQuery = options?.createdBy ? { createdBy: options.createdBy } : undefined;

  return dynamicFilter(Bill, billFilterConfig, queries, {
    visibility: getVisibility(role),
    rawQuery,
  });
};

export const getBillById = async (id: string) => {
  const bill = await Bill.findById(id);
  if (!bill) return null;
  return enhanceBill(bill);
};


export const getBillsByDepartment = async (
  departmentId: string,
  queries: Record<string, unknown>,
  role?: Role
) => {
  return dynamicFilter(Bill, billFilterConfig, {...queries, full: true, status: 'UNPAID'}, {
    visibility: getVisibility(role),
    rawQuery: { department: departmentId },
  });
};

export const updateBill = async (id: string, data: UpdateBillPayload) => {
  const oldBill = await Bill.findById(id);
  if (!oldBill) return null;

  if (data.items) {
    await adjustStockForBill(oldBill.items, data.items as any);
  }

  const updated = await Bill.findByIdAndUpdate(id, data, UPDATE_OPTIONS);
  if (!updated) return null;
  return enhanceBill(updated);
};

export const removeBill = async (id: string) => {
  const bill = await Bill.findById(id);
  if (!bill) return null;

  if (!bill.deleted) {
    await adjustStockForBill(bill.items, []);
  }

  const removed = await Bill.findByIdAndUpdate(id, SOFT_DELETE, { new: true });
  if (!removed) return null;
  return enhanceBill(removed);
};

export const retrieveBill = async (id: string) => {
  const bill = await Bill.findById(id);
  if (!bill) return null;

  if (bill.deleted) {
    await adjustStockForBill([], bill.items);
  }

  const retrieved = await Bill.findByIdAndUpdate(id, RETRIEVE, { new: true });
  if (!retrieved) return null;
  return enhanceBill(retrieved);
};

export const eraseBill = async (id: string) => {
  const bill = await Bill.findById(id);
  if (!bill) return null;

  if (!bill.deleted) {
    await adjustStockForBill(bill.items, []);
  }

  const erased = await Bill.findByIdAndDelete(id);
  if (!erased) return null;
  return enhanceBill(erased);
};

export const setBillActiveStatus = async (id: string, active: boolean) => {
  return Bill.findByIdAndUpdate(
    id,
    { active, ...(active ? { deleted: false, deletedAt: null } : {}) },
    { new: true }
  );
};

import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';
import path from 'path';
import fs from 'fs';

export const generateBillPdf = async (id: string): Promise<Buffer> => {
  const bill = await Bill.findById(id)
    .populate('branch')
    .populate('department')
    .populate({
      path: 'createdBy',
      populate: { path: 'shop' }
    });

  if (!bill) {
    throw new Error('Bill not found');
  }

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Uint8Array[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Color definitions from index.css (SRM Royal Blue + Gold)
    const primaryColor = '#1e40af'; // Royal Blue (oklch(0.42 0.16 258))
    const secondaryColor = '#eab308'; // Gold (oklch(0.78 0.14 85))
    const darkTextColor = '#1e293b'; // Slate-800
    const lightTextColor = '#64748b'; // Slate-500
    const borderColor = '#cbd5e1'; // Slate-300
    const gridBorderColor = '#e2e8f0'; // Slate-200
    const rowAltColor = '#f8fafc'; // Slate-50
    const headerBgColor = '#1e40af'; // White text on Royal Blue

    // 1. Logo and Header
    const logoPath = path.join(process.cwd(), '../frontend/public/logo.png');
    let hasLogo = false;
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 50, 40, { width: 55, height: 55 });
        hasLogo = true;
      } catch (err) {
        console.warn('Failed to embed SRM logo:', err);
      }
    }

    const textStartX = hasLogo ? 115 : 50;

    // College Title
    doc
      .fillColor(primaryColor)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('SRM UNIVERSITY XEROX CENTER', textStartX, 43);

    doc
      .fillColor(lightTextColor)
      .fontSize(9)
      .font('Helvetica')
      .text('Kattankulathur Campus, Chennai, Tamil Nadu - 603203', textStartX, 63)
      .text('Official Xerox & Print Services Management System', textStartX, 75);

    // Invoice Title on far right
    doc
      .fillColor(primaryColor)
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('INVOICE', 400, 43, { align: 'right' });

    doc
      .fillColor(darkTextColor)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(`Invoice No: ${bill.code}`, 400, 66, { align: 'right' });

    doc
      .fillColor(lightTextColor)
      .font('Helvetica')
      .text(`Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })}`, 400, 78, { align: 'right' });

    // Gold separator line (SRM Accent)
    doc.rect(50, 105, 495, 3).fill(secondaryColor);

    // 2. Billing Info & attending Shop info
    let infoY = 125;

    // Billed To Column
    doc
      .fillColor(lightTextColor)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('BILLED TO', 50, infoY);

    const deptName = (bill.department as any)?.name || 'Direct Walk-in';
    const branchName = (bill.branch as any)?.name || 'Main Campus';
    doc
      .fillColor(darkTextColor)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(deptName, 50, infoY + 15)
      .fillColor(lightTextColor)
      .fontSize(9)
      .font('Helvetica')
      .text(`Branch: ${branchName}`, 50, infoY + 30);

    // Attending Shop Column
    doc
      .fillColor(lightTextColor)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('ATTENDING SHOP', 320, infoY);

    const shopName = (bill.createdBy as any)?.shop?.name || 'Central Xerox Store';
    const operatorEmail = (bill.createdBy as any)?.email || 'operator@srmist.edu.in';
    doc
      .fillColor(darkTextColor)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(shopName, 320, infoY + 15)
      .fillColor(lightTextColor)
      .fontSize(9)
      .font('Helvetica')
      .text(`Operator: ${operatorEmail}`, 320, infoY + 30);

    // Separator before table
    doc.moveTo(50, 175).lineTo(545, 175).strokeColor(gridBorderColor).lineWidth(1).stroke();

    // 3. Items Table Header
    let tableY = 195;
    doc
      .rect(50, tableY, 495, 24)
      .fill(headerBgColor);

    doc
      .fillColor('#ffffff')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Item Description', 60, tableY + 8)
      .text('Type', 260, tableY + 8)
      .text('Price', 340, tableY + 8, { width: 50, align: 'right' })
      .text('Qty', 410, tableY + 8, { width: 40, align: 'right' })
      .text('Total', 470, tableY + 8, { width: 70, align: 'right' });

    tableY += 24;

    // 4. Table Items (with alternating backgrounds & borders)
    doc.font('Helvetica').fontSize(9);

    let rowIdx = 0;
    for (const item of bill.items) {
      const itemType = item.type === 'InventoryProduct' ? 'Product' : 'Service';
      
      // Draw alternating row background
      if (rowIdx % 2 === 1) {
        doc.rect(50, tableY, 495, 22).fill(rowAltColor);
      }

      doc
        .fillColor(darkTextColor)
        .text(item.name, 60, tableY + 6, { width: 190, lineBreak: false })
        .text(itemType, 260, tableY + 6)
        .text(`Rs. ${item.price.toFixed(2)}`, 340, tableY + 6, { width: 50, align: 'right' })
        .text(String(item.quantity), 410, tableY + 6, { width: 40, align: 'right' })
        .text(`Rs. ${item.total.toFixed(2)}`, 470, tableY + 6, { width: 70, align: 'right' });

      tableY += 22;

      // Draw bottom row grid border
      doc.moveTo(50, tableY).lineTo(545, tableY).strokeColor(gridBorderColor).lineWidth(0.5).stroke();
      rowIdx++;
    }

    tableY += 15;

    // 5. Summary / Totals block inside a beautiful clean container on the right
    const summaryX = 330;
    const summaryW = 215;
    
    // Draw outer boundary for summary box
    doc
      .rect(summaryX, tableY, summaryW, 78)
      .strokeColor(gridBorderColor)
      .lineWidth(1)
      .stroke();

    let sumY = tableY + 10;
    doc
      .fontSize(9.5)
      .fillColor(lightTextColor)
      .text('Subtotal:', summaryX + 15, sumY)
      .fillColor(darkTextColor)
      .text(`Rs. ${bill.subtotal.toFixed(2)}`, summaryX + 110, sumY, { width: 90, align: 'right' });

    sumY += 16;

    if (bill.discount > 0) {
      doc
        .fillColor(lightTextColor)
        .text('Discount:', summaryX + 15, sumY)
        .fillColor('#dc2626') // Red color for discounts
        .text(`- Rs. ${bill.discount.toFixed(2)}`, summaryX + 110, sumY, { width: 90, align: 'right' });
      sumY += 16;
    }

    if (bill.tax > 0) {
      doc
        .fillColor(lightTextColor)
        .text('Tax:', summaryX + 15, sumY)
        .fillColor(darkTextColor)
        .text(`+ Rs. ${bill.tax.toFixed(2)}`, summaryX + 110, sumY, { width: 90, align: 'right' });
      sumY += 16;
    }

    // Divider line inside summary
    doc.moveTo(summaryX + 10, sumY + 2).lineTo(summaryX + summaryW - 10, sumY + 2).strokeColor(gridBorderColor).lineWidth(0.5).stroke();
    sumY += 8;

    // Grand Total
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(primaryColor)
      .text('Grand Total:', summaryX + 15, sumY)
      .text(`Rs. ${bill.total.toFixed(2)}`, summaryX + 110, sumY, { width: 90, align: 'right' });

    tableY = Math.max(tableY + 95, 450);

    // 6. Payment info & badges
    doc
      .fontSize(9.5)
      .fillColor(lightTextColor)
      .font('Helvetica-Bold')
      .text('Payment Method: ', 50, tableY)
      .font('Helvetica')
      .fillColor(darkTextColor)
      .text(bill.paymentMethod, 140, tableY);

    const isPaid = bill.status === 'PAID';
    doc
      .fillColor(lightTextColor)
      .font('Helvetica-Bold')
      .text('Payment Status: ', 50, tableY + 16)
      .font('Helvetica-Bold')
      .fillColor(isPaid ? '#16a34a' : '#d97706') // Green for PAID, Orange for UNPAID
      .text(bill.status, 140, tableY + 16);

    // Footer section (Centered at page bottom)
    const footerY = 515;
    
    // Draw gold top accent for footer
    doc.rect(50, footerY - 10, 495, 1).fill(secondaryColor);

    doc
      .fontSize(8.5)
      .fillColor(lightTextColor)
      .font('Helvetica')
      .text('Thank you for choosing SRM University Xerox Center.', 50, footerY, { align: 'center' })
      .text('This is a computer-generated official invoice and does not require a physical signature.', 50, footerY + 13, { align: 'center' });

    doc.end();
  });
};
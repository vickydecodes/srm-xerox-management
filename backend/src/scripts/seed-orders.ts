import prisma from '../config/prisma.config.js';
import Order, { OrderType, OrderItemType } from '../database/models/order.model.js';
import User from '../database/models/user.model.js';
import Department from '../database/models/department.model.js';
import Branch from '../database/models/branch.model.js';
import Shop from '../database/models/shop.model.js';
import Service from '../database/models/service.model.js';

async function seedOrders() {
  await prisma.$connect();
  console.log('📦 Seeding sample print & Xerox orders...');

  try {
    const user = await prisma.user.findFirst({ where: { role: 'shop_admin' } }) 
      || await prisma.user.findFirst({}) 
      || { id: 'admin123' };

    const branch = await prisma.branch.findFirst({});
    const department = await prisma.department.findFirst({});
    const shop = await prisma.shop.findFirst({});
    const service = await prisma.service.findFirst({});

    const branchId = branch?.id || 'branch-1';
    const deptId = department?.id || 'dept-1';
    const shopId = shop?.id;
    const userId = user.id;

    const sampleOrders = [
      {
        orderType: OrderType.XEROX_ORDER,
        purpose: 'Semester Exam Question Papers (100 copies A4 B/W Duplex)',
        attachmentEmail: 'exam.cell@srmist.edu.in',
        managementAmount: 1000,
        status: 'pending',
        branch: branchId,
        department: deptId,
        shop: shopId,
        createdBy: userId,
        sponsors: [],
        items: [
          {
            type: OrderItemType.SERVICE,
            item: service?.id || 'service-1',
            name: 'A4 B/W Exam Question Paper Print',
            quantity: 100,
            price: 2.0,
            total: 200.0,
          },
          {
            type: OrderItemType.SERVICE,
            item: service?.id || 'service-2',
            name: 'Soft Binding with Lamination Cover',
            quantity: 5,
            price: 40.0,
            total: 200.0,
          },
        ],
      },
      {
        orderType: OrderType.WORK_ORDER,
        purpose: 'Lab Manuals & Practical Records Printing (50 sets A4 Color)',
        attachmentEmail: 'cse.lab@srmist.edu.in',
        managementAmount: 2500,
        status: 'in_progress',
        branch: branchId,
        department: deptId,
        shop: shopId,
        createdBy: userId,
        sponsors: [{ name: 'SRM Tech Fest Sponsor', amount: 500 }],
        items: [
          {
            type: OrderItemType.SERVICE,
            item: service?.id || 'service-3',
            name: 'A4 Colour Lab Manual Print',
            quantity: 50,
            price: 10.0,
            total: 500.0,
          },
          {
            type: OrderItemType.SERVICE,
            item: service?.id || 'service-4',
            name: 'Spiral Binding (200 pages)',
            quantity: 50,
            price: 30.0,
            total: 1500.0,
          },
        ],
      },
      {
        orderType: OrderType.XEROX_ORDER,
        purpose: 'Final Year Thesis & Project Report Binding (Gold Emboss)',
        attachmentEmail: 'arun.kumar@srmist.edu.in',
        managementAmount: 800,
        status: 'ready_for_pickup',
        branch: branchId,
        department: deptId,
        shop: shopId,
        createdBy: userId,
        sponsors: [],
        items: [
          {
            type: OrderItemType.SERVICE,
            item: service?.id || 'service-5',
            name: 'Thesis Hard Binding + Gold Emboss',
            quantity: 2,
            price: 350.0,
            total: 700.0,
          },
        ],
      },
      {
        orderType: OrderType.WORK_ORDER,
        purpose: 'National Conference Poster & Banner Printing (A2 Glossy)',
        attachmentEmail: 'conference.ece@srmist.edu.in',
        managementAmount: 1500,
        status: 'delivered',
        branch: branchId,
        department: deptId,
        shop: shopId,
        createdBy: userId,
        sponsors: [{ name: 'IEEE SRM Chapter', amount: 1000 }],
        items: [
          {
            type: OrderItemType.SERVICE,
            item: service?.id || 'service-6',
            name: 'Poster Printing (A2 Glossy)',
            quantity: 10,
            price: 80.0,
            total: 800.0,
          },
          {
            type: OrderItemType.SERVICE,
            item: service?.id || 'service-7',
            name: 'Vinyl Banner Printing (6x3 ft)',
            quantity: 2,
            price: 300.0,
            total: 600.0,
          },
        ],
      },
    ];

    for (const orderData of sampleOrders) {
      const order = new Order(orderData);
      await order.save();
      console.log(`✅ Created Order: ${order.code || order._id} (${order.status})`);
    }

    console.log('🎉 Sample orders seeded successfully!');
  } catch (err) {
    console.error('❌ Error seeding orders:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedOrders();

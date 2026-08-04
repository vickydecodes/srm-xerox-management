/**
 * seed.ts
 *
 * Seeds the database with a minimal, internally-consistent dataset:
 * Branch -> Department -> User -> Product -> Inventory -> InventoryProduct -> Service -> Bill
 *
 * Notes on why things are created the way they are:
 * - Branch, Department, Inventory have no pre-save hooks that generate derived
 *   fields, so they're safe to bulk `insertMany`.
 * - User, Product, Service, Bill all rely on `pre('save')` hooks (login_id / code
 *   auto-generation, password hashing, bill totals). `insertMany` skips document
 *   middleware, so these are created one-by-one via `Model.create(...)` / `new Model().save()`
 *   to make sure those hooks actually run.
 * - Counter is reset first so the generated codes (P-001, S-001, B-001, SRM25001...)
 *   come out predictable on a fresh seed run.
 *
 * Usage:
 *   MONGODB_URI="mongodb://localhost:27017/sap_crm" npx ts-node seed.ts
 */

import mongoose from 'mongoose';

import { Branch } from '@db/models/branch.model.ts';
import User from '@db/models/user.model.ts'; // adjust to `import { User } ...` if it's a named export in your repo
import Product from '@db/models/product.model.ts';
import Inventory from '@db/models/inventory.model.ts';
import InventoryProduct from '@db/models/inventory-product.model.ts';
import Service from '@db/models/service.model.ts';
import Bill, { BillItemType } from '@db/models/bill.model.ts';
import { Counter } from '@db/models/counter.model.ts';
import Department from '@db/models/department.model.ts';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/srm_xerox_db';

async function clearCollections() {
  await Promise.all([
    Branch.deleteMany({}),
    Department.deleteMany({}),
    User.deleteMany({}),
    Product.deleteMany({}),
    Inventory.deleteMany({}),
    InventoryProduct.deleteMany({}),
    Service.deleteMany({}),
    Bill.deleteMany({}),
    Counter.deleteMany({}),
  ]);
  console.log('Cleared existing collections');
}

async function seedBranchesAndDepartments() {
  const branches = await Branch.insertMany([
    { name: 'Chennai Central', code: 1, active: true },
    { name: 'Coimbatore', code: 2, active: true },
  ]);

  const departments = await Department.insertMany([
    { name: 'Physics', code: 1, active: true },
    { name: 'Chemistry', code: 2, active: true },
  ]);

  console.log(`Seeded ${branches.length} branches, ${departments.length} departments`);
  return { branches, departments };
}

async function seedUsers(branches: any[]) {
  const usersData = [
    {
      name: 'Super Admin',
      email: 'superadmin@sapacademy.in',
      phone: '9000000001',
      password: 'Password@123',
      role: 'super_admin' as const,
    },
    {
      name: 'Branch Admin - Chennai',
      email: 'branchadmin.chennai@sapacademy.in',
      phone: '9000000002',
      password: 'Password@123',
      role: 'branch_admin' as const,
      branch: branches[0]._id,
    },
    {
      name: 'Department Admin - Physics',
      email: 'deptadmin.physics@sapacademy.in',
      phone: '9000000003',
      password: 'Password@123',
      role: 'department_admin' as const,
      branch: branches[0]._id,
    },
    {
      name: 'Shop Admin - Chennai',
      email: 'shopadmin.chennai@sapacademy.in',
      phone: '9000000004',
      password: 'Password@123',
      role: 'shop_admin' as const,
      branch: branches[0]._id,
    },
    {
      name: 'Staff - Chennai',
      email: 'staff.chennai@sapacademy.in',
      phone: '9000000005',
      password: 'Password@123',
      role: 'staff' as const,
      branch: branches[0]._id,
    },
  ];

  // Created one-by-one via .save() so the pre('validate') password hash and
  // pre('save') login_id generation hooks actually fire.
  const users = [];
  for (const data of usersData) {
    const user = new User(data);
    await user.save();
    users.push(user);
  }

  console.log(`Seeded ${users.length} users:`, users.map((u: any) => u.login_id).join(', '));
  return users;
}

async function seedProducts() {
  const productsData = [
    {
      name: 'A4 Notebook',
      description: '200-page ruled notebook',
      variants: new Map([['color', ['Blue', 'Red', 'Green']]]),
    },
    {
      name: 'Lab Apron',
      description: 'Cotton lab apron',
      variants: new Map([['size', ['S', 'M', 'L', 'XL']]]),
    },
    {
      name: 'Scientific Calculator',
      description: 'Casio FX-991ES Plus',
      variants: new Map(),
    },
  ];

  const products = [];
  for (const data of productsData) {
    const product = new Product(data);
    await product.save();
    products.push(product);
  }

  console.log(`Seeded ${products.length} products:`, products.map((p: any) => p.code).join(', '));
  return products;
}

async function seedInventoryAndStock(products: any[]) {
  const inventories = await Inventory.insertMany([
    { name: 'Chennai Central Store', active: true },
  ]);
  const inventory = inventories[0];

  const stockEntries = [
    { inventory: inventory._id, product: products[0]._id, variant: new Map([['color', 'Blue']]), quantity: 100 },
    { inventory: inventory._id, product: products[0]._id, variant: new Map([['color', 'Red']]), quantity: 80 },
    { inventory: inventory._id, product: products[1]._id, variant: new Map([['size', 'M']]), quantity: 40 },
    { inventory: inventory._id, product: products[2]._id, variant: new Map(), quantity: 25 },
  ];

  const inventoryProducts = await InventoryProduct.insertMany(stockEntries);

  console.log(`Seeded ${inventories.length} inventory location(s), ${inventoryProducts.length} stock entries`);
  return { inventory, inventoryProducts };
}

async function seedServices(inventoryProducts: any[]) {
  const servicesData = [
    {
      name: 'Notebook Binding',
      description: 'Custom spiral binding service',
      unit: 'per unit',
      price: 20,
      materials: [{ product: inventoryProducts[0]._id, quantity: 1 }],
    },
    {
      name: 'Lab Kit Assembly',
      description: 'Assemble apron + calculator kit',
      unit: 'per kit',
      price: 150,
      materials: [
        { product: inventoryProducts[2]._id, quantity: 1 },
        { product: inventoryProducts[3]._id, quantity: 1 },
      ],
    },
  ];

  const services = [];
  for (const data of servicesData) {
    const service = new Service(data);
    await service.save();
    services.push(service);
  }

  console.log(`Seeded ${services.length} services:`, services.map((s: any) => s.code).join(', '));
  return services;
}

async function seedBills(products: any[], services: any[], createdBy: any) {
  const billsData = [
    {
      items: [
        {
          type: BillItemType.PRODUCT,
          item: products[0]._id,
          name: products[0].name,
          quantity: 3,
          price: 40,
        },
        {
          type: BillItemType.SERVICE,
          item: services[0]._id,
          name: services[0].name,
          quantity: 1,
          price: services[0].price,
        },
      ],
      discount: 10,
      tax: 5,
      createdBy: createdBy._id,
      status: 'PAID' as const,
    },
    {
      items: [
        {
          type: BillItemType.PRODUCT,
          item: products[2]._id,
          name: products[2].name,
          quantity: 1,
          price: 900,
        },
      ],
      discount: 0,
      tax: 45,
      createdBy: createdBy._id,
      status: 'UNPAID' as const,
    },
  ];

  const bills = [];
  for (const data of billsData) {
    const bill = new Bill(data);
    await bill.save();
    bills.push(bill);
  }

  console.log(`Seeded ${bills.length} bills:`, bills.map((b: any) => `${b.code} (total: ${b.total})`).join(', '));
  return bills;
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to ${MONGODB_URI}`);

  try {
    await clearCollections();

    const { branches } = await seedBranchesAndDepartments();
    const users = await seedUsers(branches);
    const products = await seedProducts();
    const { inventoryProducts } = await seedInventoryAndStock(products);
    const services = await seedServices(inventoryProducts);
    await seedBills(products, services, users[0]);

    console.log('\nSeed complete ✅');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
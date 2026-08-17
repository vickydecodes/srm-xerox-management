/**
 * seed.ts
 *
 * Production-quality seed for SRM Campus Store / Xerox Management System.
 *
 * Aligned with actual models:
 * - Branch.code / Department.code are strings
 * - Department.name is unique → campus suffix added
 * - InventoryProduct.price is required; insertMany skips pre-save so we set name/price/variant explicitly
 * - BillItemType.PRODUCT = 'InventoryProduct', SERVICE = 'Service'
 * - Bill status: UNPAID | PAID | CANCELLED (no PARTIAL)
 * - Bill has paymentMethod: CASH | UPI | CREDIT
 * - Service.materials.product refs InventoryProduct
 *
 * Seed order:
 * 1. Clear (incl. Counter)
 * 2. Branch
 * 3. Department
 * 4. User          → .save() for login_id + password hash
 * 5. Product       → .save() for P-xxx code
 * 6. Inventory     → single "Main Store"
 * 7. InventoryProduct
 * 8. Service       → .save() for S-xxx code
 * 9. Bill          → .save() for B-xxx code + totals
 *
 * Usage:
 *   MONGODB_URI="mongodb://localhost:27017/srm_xerox_db" npx ts-node seed.ts
 */

import mongoose from 'mongoose';

import { Branch } from '@db/models/branch.model.ts';
import Department from '@db/models/department.model.ts';
import User from '@db/models/user.model.ts';
import Product from '@db/models/product.model.ts';
import Inventory from '@db/models/inventory.model.ts';
import InventoryProduct from '@db/models/inventory-product.model.ts';
import Service from '@db/models/service.model.ts';
import Bill, { BillItemType } from '@db/models/bill.model.ts';
import { Counter } from '@db/models/counter.model.ts';
import CreditPayment from '@db/models/credit.model.ts';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/srm_xerox_db';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const FIRST_NAMES = [
  'Arun', 'Priya', 'Karthik', 'Divya', 'Vignesh', 'Ananya', 'Suresh', 'Meera',
  'Rajesh', 'Lakshmi', 'Harish', 'Nithya', 'Senthil', 'Deepa', 'Gokul', 'Shalini',
  'Prakash', 'Kavitha', 'Manoj', 'Swetha', 'Balaji', 'Aishwarya', 'Vimal', 'Padma',
  'Ramesh', 'Geetha', 'Sathish', 'Janani', 'Vivek', 'Sandhya', 'Ajith', 'Keerthana',
  'Dinesh', 'Pooja', 'Naveen', 'Revathi', 'Sanjay', 'Bhavani', 'Yogesh', 'Ishwarya',
  'Aditya', 'Sneha', 'Rohit', 'Varsha', 'Kiran', 'Nandini', 'Arjun', 'Sowmya',
];

const LAST_NAMES = [
  'Kumar', 'Rajan', 'Subramanian', 'Nair', 'Iyer', 'Reddy', 'Pillai', 'Menon',
  'Sharma', 'Patel', 'Gupta', 'Singh', 'Das', 'Banerjee', 'Chatterjee', 'Mukherjee',
  'Krishnan', 'Venkatesh', 'Narayanan', 'Sundaram', 'Ganesan', 'Murugan', 'Selvam',
  'Palanisamy', 'Chandran', 'Ravi', 'Babu', 'Prasad', 'Mohan', 'Anand',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomName(): string {
  return `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`;
}

function randomPhone(): string {
  const prefix = randomItem(['9', '8', '7', '6']);
  return prefix + Array.from({ length: 9 }, () => randomInt(0, 9)).join('');
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function randomEmail(name: string, role: string, campusHint?: string): string {
  const base = slugify(name);
  const domain = 'srmist.edu.in';
  if (campusHint) {
    return `${base}.${slugify(role)}.${slugify(campusHint)}@${domain}`;
  }
  return `${base}.${slugify(role)}@${domain}`;
}

function randomDateInLastMonths(months = 6): Date {
  const now = Date.now();
  const past = now - months * 30 * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

function randomBillStatus(): 'UNPAID' | 'PAID' | 'CANCELLED' {
  const r = Math.random();
  if (r < 0.55) return 'PAID';
  if (r < 0.90) return 'UNPAID';
  return 'CANCELLED';
}

function randomPaymentMethod(): 'CASH' | 'UPI' | 'CREDIT' {
  return randomItem(['CASH', 'UPI', 'CREDIT'] as const);
}

/** Sort variant Map keys alphabetically (mirrors InventoryProduct pre-save). */
function sortedVariant(entries: [string, string][]): Map<string, string> {
  return new Map(entries.sort(([a], [b]) => a.localeCompare(b)));
}

/* ------------------------------------------------------------------ */
/*  Clear                                                              */
/* ------------------------------------------------------------------ */

async function clearCollections() {
  console.log('Clearing existing collections...');
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
    CreditPayment.deleteMany({}),
  ]);
  console.log('Collections cleared (counters reset).');
}

/* ------------------------------------------------------------------ */
/*  Branches                                                           */
/* ------------------------------------------------------------------ */

async function seedBranches() {
  console.log('Seeding Branches...');

  const branchesData = [
    { name: 'SRM Institute of Science and Technology - Kattankulathur', code: '1', active: true },
    { name: 'SRM Easwari Engineering College', code: '2', active: true },
    { name: 'SRM Arts and Science College', code: '3', active: true },
    { name: 'SRM Faculty of Science and Humanities', code: '4', active: true },
  ];

  const branches = await Branch.insertMany(branchesData);
  console.log(`  → ${branches.length} branches created.`);
  return branches;
}

/* ------------------------------------------------------------------ */
/*  Departments (unique names via campus suffix)                       */
/* ------------------------------------------------------------------ */

async function seedDepartments(branches: any[]) {
  console.log('Seeding Departments...');

  // Department.name has a unique index → suffix campus code to keep names unique.

  const engineeringDepts = [
    'Computer Science and Engineering',
    'Information Technology',
    'Artificial Intelligence and Data Science',
    'Artificial Intelligence and Machine Learning',
    'Cyber Security',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Biomedical Engineering',
    'Robotics',
    'Automobile Engineering',
  ];

  const artsScienceDepts = [
    'BCA',
    'MCA',
    'B.Sc Computer Science',
    'B.Sc Mathematics',
    'B.Sc Physics',
    'B.Sc Chemistry',
    'B.Com',
    'BBA',
    'English',
    'Visual Communication',
  ];

  const fshDepts = ['Mathematics', 'Physics', 'Chemistry', 'English'];

  const deptData: any[] = [];
  let code = 1;

  // Kattankulathur
  for (const name of engineeringDepts) {
    deptData.push({
      name: `${name} (KTR)`,
      code: String(code++),
      active: true,
      branch: branches[0]._id,
    });
  }

  // Easwari
  const easwariSubset = [
    'Computer Science and Engineering',
    'Information Technology',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
  ];
  for (const name of easwariSubset) {
    deptData.push({
      name: `${name} (Easwari)`,
      code: String(code++),
      active: true,
      branch: branches[1]._id,
    });
  }

  // Arts & Science
  for (const name of artsScienceDepts) {
    deptData.push({
      name: `${name} (ASC)`,
      code: String(code++),
      active: true,
      branch: branches[2]._id,
    });
  }

  // Faculty of Science and Humanities
  for (const name of fshDepts) {
    deptData.push({
      name: `${name} (FSH)`,
      code: String(code++),
      active: true,
      branch: branches[3]._id,
    });
  }

  const departments = await Department.insertMany(deptData);
  console.log(`  → ${departments.length} departments created.`);
  return departments;
}

/* ------------------------------------------------------------------ */
/*  Users                                                              */
/* ------------------------------------------------------------------ */

async function seedUsers(branches: any[], departments: any[]) {
  console.log('Seeding Users...');

  const users: any[] = [];
  const defaultPassword = 'Password@123';

  // Ensure unique names within each branch to prevent compound unique index violations (branch_1_name_1)
  const branchNamesUsed = new Set<string>();
  const getUniqueNameForBranch = (branchId: any) => {
    const branchIdStr = String(branchId || 'global');
    while (true) {
      const name = randomName();
      const key = `${branchIdStr}:${name}`;
      if (!branchNamesUsed.has(key)) {
        branchNamesUsed.add(key);
        return name;
      }
    }
  };

  // Super Admin (no branch)
  {
    const user = new User({
      name: 'Super Admin',
      email: 'superadmin@srmist.edu.in',
      phone: '9000000001',
      password: defaultPassword,
      role: 'super_admin',
    });
    await user.save();
    users.push(user);
  }

  // Branch Admin + Shop Admin + 5 Staff per campus
  for (const branch of branches) {
    const campusHint = branch.name.includes('Kattankulathur')
      ? 'ktr'
      : branch.name.includes('Easwari')
        ? 'easwari'
        : branch.name.includes('Arts')
          ? 'asc'
          : 'fsh';

    // Branch Admin
    {
      const name = getUniqueNameForBranch(branch._id);
      const user = new User({
        name,
        email: randomEmail(name, 'branchadmin', campusHint),
        phone: randomPhone(),
        password: defaultPassword,
        role: 'branch_admin',
        branch: branch._id,
      });
      await user.save();
      users.push(user);
    }

    // Shop Admin
    {
      const name = getUniqueNameForBranch(branch._id);
      const user = new User({
        name,
        email: randomEmail(name, 'shopadmin', campusHint),
        phone: randomPhone(),
        password: defaultPassword,
        role: 'shop_admin',
      });
      await user.save();
      users.push(user);
    }

    // Five Staff
    for (let i = 0; i < 5; i++) {
      const name = getUniqueNameForBranch(branch._id);
      const user = new User({
        name,
        email: randomEmail(name, `staff${i + 1}`, campusHint),
        phone: randomPhone(),
        password: defaultPassword,
        role: 'staff',
      });
      await user.save();
      users.push(user);
    }
  }

  // One Department Admin per department
  for (const dept of departments) {
    const branch = branches.find((b: any) => b._id.equals(dept.branch));
    const campusHint = branch
      ? branch.name.includes('Kattankulathur')
        ? 'ktr'
        : branch.name.includes('Easwari')
          ? 'easwari'
          : branch.name.includes('Arts')
            ? 'asc'
            : 'fsh'
      : 'srm';

    const name = getUniqueNameForBranch(dept.branch);
    const user = new User({
      name,
      email: randomEmail(name, 'deptadmin', campusHint),
      phone: randomPhone(),
      password: defaultPassword,
      role: 'department_admin',
      branch: dept.branch,
      department: dept._id,
    });
    await user.save();
    users.push(user);
  }

  console.log(`  → ${users.length} users created.`);
  console.log('    Sample login_ids:', users.slice(0, 5).map((u: any) => u.login_id).join(', '), '...');
  return users;
}

/* ------------------------------------------------------------------ */
/*  Products (≥ 100)                                                   */
/* ------------------------------------------------------------------ */

async function seedProducts() {
  console.log('Seeding Products...');

  type VariantDef = Record<string, string[]>;

  interface ProductDef {
    name: string;
    description: string;
    variants?: VariantDef;
  }

  const productDefs: ProductDef[] = [
    // Stationery
    { name: 'A4 Ruled Notebook', description: '200-page A4 ruled notebook for class notes', variants: { pages: ['100', '200', '300'], color: ['Blue', 'Green', 'Red', 'Black'] } },
    { name: 'A4 Unruled Notebook', description: 'Plain A4 notebook for sketches and notes', variants: { pages: ['100', '200'], color: ['Blue', 'White'] } },
    { name: 'Observation Notebook', description: 'Standard observation notebook for lab experiments', variants: { pages: ['100', '150'] } },
    { name: 'Record Notebook', description: 'Hard-bound record notebook for practicals', variants: { pages: ['100', '150', '200'] } },
    { name: 'Graph Book', description: 'A4 graph paper book for engineering drawings', variants: { pages: ['50', '100'] } },
    { name: 'Drawing Book', description: 'A3 drawing book for engineering graphics', variants: { pages: ['40', '60'] } },
    { name: 'Engineering Record', description: 'Official engineering practical record book', variants: { pages: ['100', '150'] } },
    { name: 'Practical Record', description: 'Science practical record notebook', variants: { pages: ['100', '150'] } },
    { name: 'Lab Manual Notebook', description: 'Lined notebook for lab manual writing', variants: { pages: ['80', '100'] } },
    { name: 'Spiral Notebook A5', description: 'Compact A5 spiral notebook', variants: { color: ['Blue', 'Pink', 'Black'] } },
    { name: 'Index Notebook', description: 'Notebook with index pages for quick reference', variants: { pages: ['100', '200'] } },
    { name: 'Project Report Folder', description: 'Hard-cover folder for project reports', variants: { color: ['Black', 'Blue', 'Maroon'] } },

    // Lab
    { name: 'Lab Apron', description: 'Cotton lab apron for chemistry/biology labs', variants: { size: ['S', 'M', 'L', 'XL', 'XXL'] } },
    { name: 'Lab Coat', description: 'Full-sleeve white lab coat', variants: { size: ['S', 'M', 'L', 'XL', 'XXL'] } },
    { name: 'Safety Goggles', description: 'Clear safety goggles for laboratory use' },
    { name: 'Nitrile Gloves', description: 'Disposable nitrile gloves (pair)', variants: { size: ['S', 'M', 'L'] } },
    { name: 'Latex Gloves', description: 'Disposable latex gloves (pair)', variants: { size: ['S', 'M', 'L'] } },
    { name: 'Face Shield', description: 'Protective face shield for lab work' },
    { name: 'Lab Mask', description: 'Disposable 3-ply lab mask (pack of 10)' },

    // Engineering tools
    { name: 'Mini Drafter', description: 'Portable mini drafter for engineering drawing' },
    { name: 'Engineering Drawing Kit', description: 'Complete set: set squares, protractor, compass' },
    { name: 'Scientific Calculator', description: 'Casio FX-991ES Plus scientific calculator' },
    { name: 'Scale Set', description: 'Transparent plastic scale set (15cm + 30cm)' },
    { name: 'Compass Box', description: 'Geometry box with compass, divider, scales' },
    { name: 'French Curves Set', description: 'Set of plastic french curves for drawing' },
    { name: 'T-Square', description: 'Acrylic T-square for drafting boards', variants: { length: ['60cm', '90cm'] } },
    { name: 'Drawing Board', description: 'Portable wooden drawing board A2 size' },
    { name: 'Set Squares', description: '45° and 30°-60° set squares pair' },
    { name: 'Protractor', description: '360° transparent protractor' },

    // Electronics
    { name: 'Breadboard', description: '830-point solderless breadboard' },
    { name: 'Jumper Wire Pack', description: 'Male-to-male jumper wires (40 pcs)', variants: { length: ['10cm', '20cm'] } },
    { name: 'Arduino Uno', description: 'Arduino Uno R3 development board' },
    { name: 'Arduino Nano', description: 'Arduino Nano with USB cable' },
    { name: 'Raspberry Pi 4', description: 'Raspberry Pi 4 Model B', variants: { ram: ['2GB', '4GB', '8GB'] } },
    { name: 'Raspberry Pi Pico', description: 'Raspberry Pi Pico microcontroller' },
    { name: 'LED Pack', description: 'Assorted LED pack (50 pcs)', variants: { color: ['Red', 'Green', 'Blue', 'Mixed'] } },
    { name: 'Resistor Kit', description: 'Assorted resistor kit (1/4W)' },
    { name: 'Capacitor Kit', description: 'Ceramic & electrolytic capacitor assortment' },
    { name: 'Multimeter', description: 'Digital multimeter for electronics lab' },
    { name: 'Soldering Iron', description: '25W soldering iron with stand' },
    { name: 'Soldering Wire', description: 'Solder wire 60/40 (50g)' },
    { name: 'HC-SR04 Ultrasonic Sensor', description: 'Ultrasonic distance sensor module' },
    { name: 'DHT11 Sensor', description: 'Temperature & humidity sensor' },
    { name: 'Servo Motor SG90', description: '9g micro servo motor' },
    { name: 'DC Motor 12V', description: '12V geared DC motor' },
    { name: 'Battery Holder AA', description: '4×AA battery holder with switch' },
    { name: '9V Battery', description: '9V alkaline battery' },
    { name: 'USB Cable Type-C', description: 'USB-A to Type-C cable 1m' },
    { name: 'USB Cable Micro-B', description: 'USB-A to Micro-B cable 1m' },

    // Paper / Printing
    { name: 'A4 Paper Ream', description: '500 sheets A4 70 GSM paper', variants: { gsm: ['70', '80'] } },
    { name: 'A3 Paper Ream', description: '500 sheets A3 80 GSM paper' },
    { name: 'Glossy Photo Paper', description: 'A4 glossy photo paper (20 sheets)', variants: { gsm: ['180', '230'] } },
    { name: 'Matte Photo Paper', description: 'A4 matte photo paper (20 sheets)' },
    { name: 'Bond Paper', description: 'A4 bond paper for certificates (100 sheets)' },
    { name: 'Chart Paper', description: 'Chart paper for presentations', variants: { color: ['White', 'Yellow', 'Pink', 'Blue'] } },
    { name: 'Butter Paper', description: 'Tracing / butter paper roll' },
    { name: 'Thermal Paper Roll', description: 'Thermal paper roll for POS printers' },

    // Accessories
    { name: 'SRM Lanyard', description: 'Official SRM identity lanyard', variants: { color: ['Blue', 'Maroon'] } },
    { name: 'SRM ID Card Holder', description: 'Plastic ID card holder with clip' },
    { name: 'File Folder', description: 'Plastic file folder with pockets', variants: { color: ['Blue', 'Green', 'Yellow', 'Red'] } },
    { name: 'Ring Binder', description: 'A4 ring binder 2-ring', variants: { color: ['Black', 'Blue'] } },
    { name: 'Ball Pen', description: 'Smooth writing ball pen', variants: { color: ['Blue', 'Black', 'Red'] } },
    { name: 'Gel Pen', description: '0.5mm gel pen', variants: { color: ['Blue', 'Black', 'Green'] } },
    { name: 'Pencil HB', description: 'HB graphite pencil (pack of 10)' },
    { name: 'Mechanical Pencil', description: '0.7mm mechanical pencil' },
    { name: 'Eraser', description: 'Soft white eraser' },
    { name: 'Sharpener', description: 'Metal pencil sharpener' },
    { name: 'Highlighter', description: 'Fluorescent highlighter', variants: { color: ['Yellow', 'Pink', 'Green', 'Orange'] } },
    { name: 'Whiteboard Marker', description: 'Dry-erase whiteboard marker', variants: { color: ['Black', 'Blue', 'Red', 'Green'] } },
    { name: 'Permanent Marker', description: 'Permanent marker pen', variants: { color: ['Black', 'Blue', 'Red'] } },
    { name: 'Correction Pen', description: 'White correction fluid pen' },
    { name: 'Stapler', description: 'Standard office stapler' },
    { name: 'Stapler Pins', description: 'Box of stapler pins (1000 pcs)' },
    { name: 'Paper Clips', description: 'Box of metal paper clips' },
    { name: 'Binder Clips', description: 'Assorted binder clips pack' },
    { name: 'Glue Stick', description: '15g glue stick' },
    { name: 'Scissors', description: 'Student scissors 6 inch' },
    { name: 'Cutter Knife', description: 'Utility cutter with snap blades' },
    { name: 'Measuring Tape', description: '3m measuring tape' },
    { name: 'USB Flash Drive', description: 'USB 3.0 flash drive', variants: { capacity: ['16GB', '32GB', '64GB', '128GB'] } },
    { name: 'External HDD', description: 'Portable external hard disk', variants: { capacity: ['500GB', '1TB', '2TB'] } },
    { name: 'Mouse Pad', description: 'SRM branded mouse pad' },
    { name: 'Laptop Stand', description: 'Adjustable aluminium laptop stand' },
    { name: 'Calculator Cover', description: 'Protective cover for scientific calculator' },
    { name: 'ID Card Ribbon', description: 'Extra ribbon for ID card holder', variants: { color: ['Blue', 'Maroon', 'Black'] } },
    { name: 'Exam Pad', description: 'Hard exam writing pad A4' },
    { name: 'Transparent Sheet', description: 'A4 transparent plastic sheet (pack of 10)' },
    { name: 'Spiral Binding Coil', description: 'Plastic spiral binding coil (pack)', variants: { size: ['A4', 'A5'] } },
    { name: 'Lamination Pouch A4', description: 'Thermal lamination pouch A4 (100 micron)' },
    { name: 'Lamination Pouch A3', description: 'Thermal lamination pouch A3 (100 micron)' },
    { name: 'Photo Paper 4x6', description: 'Glossy 4×6 photo paper (50 sheets)' },
    { name: 'Certificate Paper', description: 'Premium certificate paper A4' },
    { name: 'Ink Cartridge Black', description: 'Compatible black ink cartridge' },
    { name: 'Ink Cartridge Colour', description: 'Compatible colour ink cartridge' },
    { name: 'Toner Cartridge', description: 'Laser printer toner cartridge' },
    { name: 'Whiteboard Duster', description: 'Magnetic whiteboard duster' },
    { name: 'Chalk Box', description: 'Box of white chalk (50 sticks)' },
    { name: 'Colour Chalk Box', description: 'Assorted colour chalk (50 sticks)' },
    { name: 'Push Pins', description: 'Box of colourful push pins' },
    { name: 'Rubber Band Pack', description: 'Assorted rubber bands' },
    { name: 'Masking Tape', description: '1-inch masking tape roll' },
    { name: 'Cello Tape', description: 'Transparent cello tape 1 inch' },
    { name: 'Double-sided Tape', description: 'Double-sided adhesive tape' },
    { name: 'Name Tag Holder', description: 'Plastic name tag with pin' },
    { name: 'Key Chain SRM', description: 'Official SRM metal key chain' },
    { name: 'Water Bottle SRM', description: '750ml SRM branded water bottle', variants: { color: ['Blue', 'Black', 'White'] } },
    { name: 'Tote Bag SRM', description: 'Canvas tote bag with SRM logo' },
  ];

  while (productDefs.length < 100) {
    productDefs.push({
      name: `Campus Essential ${productDefs.length + 1}`,
      description: 'General campus stationery item',
      variants: { color: ['Blue', 'Black', 'Red'] },
    });
  }

  const products: any[] = [];
  for (const def of productDefs) {
    const variantsMap = new Map<string, string[]>();
    if (def.variants) {
      for (const [key, values] of Object.entries(def.variants)) {
        variantsMap.set(key, values);
      }
    }

    const variantsArray: any[] = [];
    if (variantsMap.size > 0) {
      const keys = Array.from(variantsMap.keys());
      const valueLists = keys.map((k) => variantsMap.get(k) || []);
      
      const cartesian = (arrays: string[][]): string[][] =>
        arrays.reduce(
          (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
          [[]] as string[][]
        );

      for (const combo of cartesian(valueLists)) {
        const attrMap = new Map();
        keys.forEach((k, i) => attrMap.set(k, combo[i]));
        variantsArray.push({ attributes: attrMap });
      }
    }

    const product = new Product({
      name: def.name,
      description: def.description,
      attributes: variantsMap,
      variants: variantsArray,
    });
    await product.save();
    products.push(product);
  }

  console.log(`  → ${products.length} products created.`);
  console.log('    Sample codes:', products.slice(0, 5).map((p: any) => p.code).join(', '), '...');
  return products;
}

/* ------------------------------------------------------------------ */
/*  Inventory – single location                                        */
/* ------------------------------------------------------------------ */

async function seedInventory(products: any[]) {
  console.log('Seeding Inventory (single location)...');

  const inventories = await Inventory.insertMany([
    { name: 'Main Store', active: true },
  ]);
  const inventory = inventories[0];

  // Realistic base prices by rough category keyword
  function basePrice(productName: string): number {
    const n = productName.toLowerCase();
    if (n.includes('raspberry') || n.includes('arduino')) return randomFloat(800, 4500);
    if (n.includes('calculator')) return randomFloat(600, 1200);
    if (n.includes('hdd') || n.includes('external')) return randomFloat(2500, 6000);
    if (n.includes('usb flash')) return randomFloat(250, 1200);
    if (n.includes('lab coat') || n.includes('lab apron')) return randomFloat(150, 400);
    if (n.includes('notebook') || n.includes('record') || n.includes('graph')) return randomFloat(40, 180);
    if (n.includes('paper ream')) return randomFloat(220, 350);
    if (n.includes('pen') || n.includes('pencil') || n.includes('eraser')) return randomFloat(5, 40);
    if (n.includes('sensor') || n.includes('motor') || n.includes('breadboard')) return randomFloat(80, 350);
    return randomFloat(20, 500);
  }

  const stockEntries: any[] = [];

  for (const product of products) {
    const price = basePrice(product.name);
    if (product.variants && product.variants.length > 0) {
      for (const v of product.variants) {
        stockEntries.push({
          inventory: inventory._id,
          product: product._id,
          variant: v._id,
          quantity: randomInt(20, 500),
          price,
          active: true,
        });
      }
    } else {
      stockEntries.push({
        inventory: inventory._id,
        product: product._id,
        variant: null,
        quantity: randomInt(20, 500),
        price,
        active: true,
      });
    }
  }

  const CHUNK = 400;
  const inventoryProducts: any[] = [];
  for (let i = 0; i < stockEntries.length; i += CHUNK) {
    const chunk = stockEntries.slice(i, i + CHUNK);
    const inserted = await InventoryProduct.insertMany(chunk, { ordered: false });
    inventoryProducts.push(...inserted);
  }

  console.log(`  → ${inventoryProducts.length} stock entries created (all under Main Store).`);
  return inventoryProducts;
}

/* ------------------------------------------------------------------ */
/*  Services (≥ 25)                                                    */
/*  materials.product → InventoryProduct _id                           */
/* ------------------------------------------------------------------ */

async function seedServices(inventoryProducts: any[]) {
  console.log('Seeding Services...');

  const pick = (...idxs: number[]) =>
    idxs
      .filter((i) => i < inventoryProducts.length)
      .map((i) => ({ product: inventoryProducts[i]._id, quantity: 1 }));

  const servicesData = [
    { name: 'Black & White Xerox', description: 'Single-side B/W photocopy (A4)', unit: 'per page', price: 1, materials: pick(0) },
    { name: 'Black & White Xerox (Double Side)', description: 'Double-side B/W photocopy (A4)', unit: 'per page', price: 1.5, materials: pick(0) },
    { name: 'Colour Xerox', description: 'Single-side colour photocopy (A4)', unit: 'per page', price: 8, materials: pick(1) },
    { name: 'Colour Xerox (A3)', description: 'Single-side colour photocopy (A3)', unit: 'per page', price: 15, materials: pick(1) },
    { name: 'Spiral Binding', description: 'Plastic spiral binding for documents', unit: 'per book', price: 30, materials: pick(2, 3) },
    { name: 'Hard Binding', description: 'Hard-cover binding for thesis / project', unit: 'per book', price: 150, materials: pick(2) },
    { name: 'Soft Binding', description: 'Soft-cover binding with lamination', unit: 'per book', price: 80, materials: pick(2) },
    { name: 'Lamination (A4)', description: 'Thermal lamination for A4 sheet', unit: 'per sheet', price: 15, materials: pick(4) },
    { name: 'Lamination (A3)', description: 'Thermal lamination for A3 sheet', unit: 'per sheet', price: 25, materials: pick(4) },
    { name: 'Resume Printing', description: 'Colour / B&W resume printing on bond paper', unit: 'per copy', price: 20, materials: pick(5) },
    { name: 'Thesis Printing', description: 'Multi-page thesis printing + soft binding', unit: 'per thesis', price: 400, materials: pick(0, 2) },
    { name: 'Certificate Printing', description: 'Colour certificate on premium paper', unit: 'per certificate', price: 50, materials: pick(6) },
    { name: 'Photo Printing (4x6)', description: 'Glossy 4×6 photo print', unit: 'per photo', price: 10, materials: pick(7) },
    { name: 'Photo Printing (A4)', description: 'A4 size glossy photo print', unit: 'per photo', price: 30, materials: pick(7) },
    { name: 'ID Card Printing', description: 'PVC ID card print with lamination', unit: 'per card', price: 60, materials: pick(8) },
    { name: 'Engineering Drawing Printing', description: 'A2 / A3 engineering drawing print', unit: 'per sheet', price: 25, materials: pick(1) },
    { name: 'Project Report Printing', description: 'Full project report print + spiral binding', unit: 'per report', price: 250, materials: pick(0, 2) },
    { name: 'Scan Documents', description: 'Document scanning to PDF', unit: 'per page', price: 2, materials: [] },
    { name: 'Passport Photo Print', description: 'Passport size photo (set of 8)', unit: 'per set', price: 40, materials: pick(7) },
    { name: 'Poster Printing (A2)', description: 'Colour poster print on glossy paper', unit: 'per poster', price: 80, materials: pick(1) },
    { name: 'Banner Printing', description: 'Vinyl banner printing (per sq.ft)', unit: 'per sq.ft', price: 35, materials: [] },
    { name: 'Visiting Card Printing', description: 'Colour visiting cards (set of 100)', unit: 'per set', price: 200, materials: pick(5) },
    { name: 'Assignment Binding', description: 'Simple staple + cover for assignments', unit: 'per assignment', price: 15, materials: pick(2) },
    { name: 'Lab Record Binding', description: 'Hard binding for lab records', unit: 'per record', price: 100, materials: pick(2) },
    { name: 'Colour Print (A4)', description: 'High-quality colour laser print A4', unit: 'per page', price: 10, materials: pick(1) },
    { name: 'B/W Print (A4)', description: 'Laser B/W print A4', unit: 'per page', price: 2, materials: pick(0) },
    { name: 'Document Stapling', description: 'Stapling service for multi-page documents', unit: 'per document', price: 5, materials: pick(9) },
    { name: 'Hole Punching', description: '2-hole / 3-hole punching', unit: 'per set', price: 5, materials: [] },
    { name: 'File Folder Supply + Print', description: 'Folder with printed label', unit: 'per folder', price: 40, materials: pick(10) },
    { name: 'Thesis Hard Binding + Gold Emboss', description: 'Premium hard binding with gold lettering', unit: 'per thesis', price: 350, materials: pick(2) },
  ];

  const services: any[] = [];
  for (const data of servicesData) {
    const service = new Service(data);
    await service.save();
    services.push(service);
  }

  console.log(`  → ${services.length} services created.`);
  console.log('    Sample codes:', services.slice(0, 5).map((s: any) => s.code).join(', '), '...');
  return services;
}

async function seedBills(
  branches: any[],
  departments: any[],
  users: any[],
  products: any[],
  services: any[]
) {
  const staffUser = users[4]; // Staff - Chennai
  const shopAdmin = users[3]; // Shop Admin - Chennai

  const billsData = [
    // Month 8: August (Current Month)
    {
      items: [
        { type: BillItemType.PRODUCT, item: products[0]._id, name: products[0].name, quantity: 3, price: 40 },
        { type: BillItemType.SERVICE, item: services[0]._id, name: services[0].name, quantity: 1, price: services[0].price },
      ],
      discount: 10,
      tax: 5,
      createdBy: staffUser._id,
      branch: branches[0]._id,
      department: departments[0]._id,
      paymentMethod: 'UPI' as const,
      status: 'PAID' as const,
      date: new Date(2026, 7, 14), // August 14
    },
    {
      items: [{ type: BillItemType.PRODUCT, item: products[2]._id, name: products[2].name, quantity: 1, price: 900 }],
      discount: 0,
      tax: 45,
      createdBy: staffUser._id,
      branch: branches[0]._id,
      department: departments[0]._id,
      paymentMethod: 'CASH' as const,
      status: 'PAID' as const,
      date: new Date(2026, 7, 10), // August 10
    },
    {
      items: [{ type: BillItemType.SERVICE, item: services[1]._id, name: services[1].name, quantity: 2, price: services[1].price }],
      discount: 20,
      tax: 15,
      createdBy: shopAdmin._id,
      branch: branches[1]._id,
      department: departments[1]._id,
      paymentMethod: 'UPI' as const,
      status: 'PAID' as const,
      date: new Date(2026, 7, 12), // August 12
    },
    
    // Month 7: July
    {
      items: [{ type: BillItemType.PRODUCT, item: products[0]._id, name: products[0].name, quantity: 5, price: 40 }],
      discount: 5,
      tax: 10,
      createdBy: staffUser._id,
      branch: branches[0]._id,
      department: departments[0]._id,
      paymentMethod: 'UPI' as const,
      status: 'PAID' as const,
      date: new Date(2026, 6, 15), // July 15
    },
    {
      items: [{ type: BillItemType.PRODUCT, item: products[1]._id, name: products[1].name, quantity: 2, price: 300 }],
      discount: 30,
      tax: 25,
      createdBy: staffUser._id,
      branch: branches[1]._id,
      department: departments[1]._id,
      paymentMethod: 'CASH' as const,
      status: 'PAID' as const,
      date: new Date(2026, 6, 20), // July 20
    },

    // Month 6: June
    {
      items: [{ type: BillItemType.SERVICE, item: services[0]._id, name: services[0].name, quantity: 4, price: 20 }],
      discount: 0,
      tax: 4,
      createdBy: staffUser._id,
      branch: branches[0]._id,
      department: departments[0]._id,
      paymentMethod: 'CREDIT' as const,
      status: 'PAID' as const,
      date: new Date(2026, 5, 10), // June 10
    },
    {
      items: [{ type: BillItemType.PRODUCT, item: products[2]._id, name: products[2].name, quantity: 1, price: 900 }],
      discount: 50,
      tax: 40,
      createdBy: staffUser._id,
      branch: branches[1]._id,
      department: departments[1]._id,
      paymentMethod: 'UPI' as const,
      status: 'PAID' as const,
      date: new Date(2026, 5, 25), // June 25
    },

    // Month 5: May
    {
      items: [{ type: BillItemType.PRODUCT, item: products[0]._id, name: products[0].name, quantity: 10, price: 40 }],
      discount: 20,
      tax: 18,
      createdBy: staffUser._id,
      branch: branches[0]._id,
      department: departments[0]._id,
      paymentMethod: 'CASH' as const,
      status: 'PAID' as const,
      date: new Date(2026, 4, 18), // May 18
    },
    {
      items: [{ type: BillItemType.SERVICE, item: services[0]._id, name: services[0].name, quantity: 5, price: 20 }],
      discount: 0,
      tax: 5,
      createdBy: staffUser._id,
      branch: branches[1]._id,
      department: departments[1]._id,
      paymentMethod: 'UPI' as const,
      status: 'PAID' as const,
      date: new Date(2026, 4, 5), // May 5
    },

    // Month 4: April
    {
      items: [{ type: BillItemType.PRODUCT, item: products[2]._id, name: products[2].name, quantity: 1, price: 900 }],
      discount: 0,
      tax: 45,
      createdBy: staffUser._id,
      branch: branches[0]._id,
      department: departments[0]._id,
      paymentMethod: 'UPI' as const,
      status: 'PAID' as const,
      date: new Date(2026, 3, 22), // April 22
    },
    {
      items: [{ type: BillItemType.PRODUCT, item: products[1]._id, name: products[1].name, quantity: 3, price: 300 }],
      discount: 100,
      tax: 40,
      createdBy: staffUser._id,
      branch: branches[1]._id,
      department: departments[1]._id,
      paymentMethod: 'CREDIT' as const,
      status: 'PAID' as const,
      date: new Date(2026, 3, 4), // April 4
    },

    // Month 3: March
    {
      items: [{ type: BillItemType.PRODUCT, item: products[0]._id, name: products[0].name, quantity: 12, price: 40 }],
      discount: 30,
      tax: 20,
      createdBy: staffUser._id,
      branch: branches[0]._id,
      department: departments[0]._id,
      paymentMethod: 'CASH' as const,
      status: 'PAID' as const,
      date: new Date(2026, 2, 12), // March 12
    },
    {
      items: [{ type: BillItemType.PRODUCT, item: products[2]._id, name: products[2].name, quantity: 2, price: 900 }],
      discount: 100,
      tax: 80,
      createdBy: staffUser._id,
      branch: branches[1]._id,
      department: departments[1]._id,
      paymentMethod: 'UPI' as const,
      status: 'PAID' as const,
      date: new Date(2026, 2, 28), // March 28
    },
  ];

  const bills = [];
  for (const data of billsData) {
    const { date, ...billFields } = data;
    const bill = new Bill(billFields);
    await bill.save();

    // Override the automatically generated createdAt timestamp with historical date using raw mongodb driver
    await Bill.collection.updateOne({ _id: bill._id }, { $set: { createdAt: date } });
    
    // Refresh document in list for logging
    const updatedBill = await Bill.findById(bill._id);
    if (updatedBill) {
      bills.push(updatedBill);
    }
  }

  console.log(`Seeded ${bills.length} bills across historical months.`);
  return bills;
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to ${MONGODB_URI}\n`);

  try {
    await clearCollections();

    const branches = await seedBranches();
    const departments = await seedDepartments(branches);
    const users = await seedUsers(branches, departments);
    const products = await seedProducts();
    const inventoryProducts = await seedInventory(products);
    const services = await seedServices(inventoryProducts);
    await seedBills(branches, departments, users, products, services);

    console.log('Seeding Credit Ledger records and outstanding department credits...');
    const allBills = await Bill.find({});
    const allDepts = await Department.find({});
    const allUsers = await User.find({});
    const staffUser = allUsers.find(u => u.role === 'staff') || allUsers[0];

    // Let's loop through departments and assign some outstanding credit
    for (let i = 0; i < allDepts.length; i++) {
      const dept = allDepts[i];
      // Set credit limit
      dept.creditLimit = 10000 + (i * 2000);
      
      // Get some bills of this department to make them UNPAID CREDIT bills
      const deptBills = allBills.filter(b => String(b.department) === String(dept._id));
      
      // Make 2 bills UNPAID CREDIT
      const unpaidCreditBills = deptBills.slice(0, 2);
      let outstanding = 0;
      for (const bill of unpaidCreditBills) {
        await Bill.updateOne(
          { _id: bill._id },
          { $set: { paymentMethod: 'CREDIT', status: 'UNPAID' } }
        );
        outstanding += bill.total;
      }
      dept.outstandingCredit = outstanding;
      await dept.save();

      // Make 2 other bills PAID CREDIT and log a CreditPayment!
      const paidCreditBills = deptBills.slice(2, 4);
      if (paidCreditBills.length > 0) {
        const sum = paidCreditBills.reduce((s, b) => s + b.total, 0);
        for (const bill of paidCreditBills) {
          await Bill.updateOne(
            { _id: bill._id },
            { $set: { paymentMethod: 'CREDIT', status: 'PAID' } }
          );
        }

        await new CreditPayment({
          department: dept._id,
          bills: paidCreditBills.map(b => b._id),
          amount: sum + (i % 2 === 0 ? 0 : 500), // Some have excess payment!
          paymentMethod: i % 2 === 0 ? 'CASH' : 'UPI',
          paidBy: staffUser._id,
          remarks: `Monthly settlement for ${dept.name}`,
          date: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000), // historical days
        }).save();
      }
    }
    console.log('Successfully seeded credit ledger records and outstanding credits.');

    console.log('\n========================================');
    console.log('Seed completed successfully ✅');
    console.log('========================================');
    console.log(`Branches        : ${branches.length}`);
    console.log(`Departments     : ${departments.length}`);
    console.log(`Users           : ${users.length}`);
    console.log(`Products        : ${products.length}`);
    console.log(`Inventory       : 1 (Main Store)`);
    console.log(`Stock entries   : ${inventoryProducts.length}`);
    console.log(`Services        : ${services.length}`);
    console.log(`Bills           : 200`);
    console.log('========================================\n');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();

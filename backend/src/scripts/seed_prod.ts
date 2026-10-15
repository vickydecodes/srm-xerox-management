import prisma from '../config/prisma.config.ts';
import { seedSuperAdmin } from './seed_super_admin.ts';
import { seedBranches } from './seed_branches.ts';
import { seedDepartments } from './seed_departments.ts';
import { seedBranchAdmins } from './seed_branch_admins.ts';
import { seedManagers } from './seed_managers.ts';
import { seedDepartmentAdmins } from './seed_department_admins.ts';
import { seedProducts } from './seed_products.ts';
import { seedServices } from './seed_services.ts';

/**
 * Wipes the database completely in the correct foreign-key dependency order
 */
async function cleanDatabase() {
  console.log('====================================================');
  console.log('🚨 WIPING DATABASE: Deleting all existing records...');
  console.log('====================================================');

  await prisma.billItem.deleteMany({});
  await prisma.bill.deleteMany({});
  await prisma.creditPayment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.inventoryProduct.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.shop.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.counter.deleteMany({});
  await prisma.setting.deleteMany({});

  // Ensure all schema columns exist in PostgreSQL
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Order"
    ADD COLUMN IF NOT EXISTS "eventName" TEXT,
    ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "approvedReferralNumber" TEXT,
    ADD COLUMN IF NOT EXISTS "approvedDate" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "self_supports" JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS "proofs" JSONB DEFAULT '[]'::jsonb;

    ALTER TABLE "Service"
    ADD COLUMN IF NOT EXISTS "isWorkOrder" BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS "isCustomSize" BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS "sizes" JSONB DEFAULT '[]'::jsonb;

    ALTER TABLE "Bill"
    ADD COLUMN IF NOT EXISTS "approvalStatus" TEXT DEFAULT 'approved',
    ADD COLUMN IF NOT EXISTS "remarks" TEXT,
    ADD COLUMN IF NOT EXISTS "order" TEXT,
    ADD COLUMN IF NOT EXISTS "approvedBy" TEXT,
    ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
  `);

  console.log('✅ Database wiped clean & base settings restored.\n');
}

/**
 * Master Production Seed Runner
 */
export async function seedProd() {
  const startTime = Date.now();
  console.log('\n🚀 Starting Master Production Seed Process (from Excel Workbook & Price List)...\n');

  try {
    // Step 0: Purge old data
    await cleanDatabase();

    // Step 1: Super Admin (Scraped from ADMINISTRATION sheet - Chairman)
    console.log('----------------------------------------------------');
    console.log('STEP 1: Seeding Super Admin');
    console.log('----------------------------------------------------');
    await seedSuperAdmin();

    // Step 2: Branches (Scraped from all non-ADMIN sheets)
    console.log('\n----------------------------------------------------');
    console.log('STEP 2: Seeding Branches');
    console.log('----------------------------------------------------');
    await seedBranches();

    // Step 3: Departments (Scraped from all branch sheets)
    console.log('\n----------------------------------------------------');
    console.log('STEP 3: Seeding Departments');
    console.log('----------------------------------------------------');
    await seedDepartments();

    // Step 4: Branch Admins (Scraped Head of Institution per sheet)
    console.log('\n----------------------------------------------------');
    console.log('STEP 4: Seeding Branch Admins');
    console.log('----------------------------------------------------');
    await seedBranchAdmins();

    // Step 5: Managers (Scraped Institution Manager per sheet)
    console.log('\n----------------------------------------------------');
    console.log('STEP 5: Seeding Institution Managers');
    console.log('----------------------------------------------------');
    await seedManagers();

    // Step 6: Department Admins (Scraped Head of Department per sheet)
    console.log('\n----------------------------------------------------');
    console.log('STEP 6: Seeding Department Admins');
    console.log('----------------------------------------------------');
    await seedDepartmentAdmins();

    // Step 7: Products & Inventory (From Reprographics Price List)
    console.log('\n----------------------------------------------------');
    console.log('STEP 7: Seeding Products & Inventory');
    console.log('----------------------------------------------------');
    await seedProducts();

    // Step 8: Services (From Reprographics Price List)
    console.log('\n----------------------------------------------------');
    console.log('STEP 8: Seeding Services');
    console.log('----------------------------------------------------');
    await seedServices();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n====================================================');
    console.log(`🎉 MASTER PRODUCTION SEED COMPLETE in ${duration}s!`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ Master Production Seed failed:', error);
    throw error;
  }
}

// Auto-run when executed directly
const isDirectExecution = import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`;

if (isDirectExecution || process.argv[1]?.includes('seed_prod')) {
  seedProd()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\nFatal error in seed_prod:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}

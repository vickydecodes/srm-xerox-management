import prisma from '../config/prisma.config.js';

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Order" 
      ADD COLUMN IF NOT EXISTS "approvedReferralNumber" TEXT,
      ADD COLUMN IF NOT EXISTS "approvedDate" TIMESTAMP(3);
    `);
    console.log('✅ Columns approvedReferralNumber and approvedDate successfully added to "Order" table.');
  } catch (error) {
    console.error('❌ Error executing ALTER TABLE:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();

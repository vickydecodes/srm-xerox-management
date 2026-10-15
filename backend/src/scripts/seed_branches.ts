import prisma from '../config/prisma.config.ts';
import { loadWorkbook } from './excel_helper.ts';

/**
 * Derives a clean branch code from the sheet name
 * Examples:
 * - "EEC" -> "EEC"
 * - "DENTAL" -> "DENTAL"
 * - "SRMIST - E&T" -> "SRMIST-ET"
 * - "SRMIST - FSH" -> "SRMIST-FSH"
 * - "SRMIST - Management" -> "SRMIST-MGMT"
 * - "SRMIST - SEAD" -> "SRMIST-SEAD"
 * - "SRM Nightingale School" -> "SRM-NIGHTINGALE"
 */
function deriveBranchCode(sheetName: string): string {
  const normalized = sheetName.trim();
  
  if (normalized.toUpperCase().includes('MANAGEMENT')) {
    return normalized.replace(/management/i, 'MGMT').replace(/\s*-\s*/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
  }
  if (normalized.toUpperCase().includes('NIGHTINGALE')) {
    return 'SRM-NIGHTINGALE';
  }
  
  return normalized
    .replace(/\s*-\s*/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toUpperCase();
}

/**
 * Dynamically scrapes and seeds all branches from the Excel workbook sheets
 */
export async function seedBranches() {
  console.log('\n🔍 Scraping branches from Excel workbook sheets...');

  const workbook = await loadWorkbook();

  // All sheets except ADMINISTRATION are branch institutions
  const branchSheets = workbook.worksheets
    .map((ws) => ws.name.trim())
    .filter((name) => name && name.toUpperCase() !== 'ADMINISTRATION');

  if (branchSheets.length === 0) {
    throw new Error('No branch sheets found in the workbook!');
  }

  console.log(`📋 Discovered ${branchSheets.length} institution sheets:`);
  branchSheets.forEach((s, idx) => console.log(`   ${idx + 1}. "${s}"`));

  const results = [];

  for (const sheetName of branchSheets) {
    const code = deriveBranchCode(sheetName);

    const branch = await prisma.branch.upsert({
      where: { name: sheetName },
      update: {
        code,
        active: true,
        deleted: false,
        deletedAt: null,
      },
      create: {
        name: sheetName,
        code,
        active: true,
        deleted: false,
      },
    });

    results.push(branch);
    console.log(`✅ Upserted Branch: "${branch.name}" (Code: ${branch.code}, ID: ${branch.id})`);
  }

  console.log(`\n🎉 Successfully scraped and seeded ${results.length} branches.`);
  return results;
}

// Auto-run when executed directly
const isDirectExecution = import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`;

if (isDirectExecution || process.argv[1]?.includes('seed_branches')) {
  seedBranches()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\n❌ Error seeding branches:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}

import prisma from '../config/prisma.config.ts';
import { loadWorkbook, parseSheetRows, getFieldValue } from './excel_helper.ts';

/**
 * Generates a clean short code for a department
 * e.g., "Computer Science & Applications" -> "CSA"
 * "Civil Engineering" -> "CIVIL"
 * "CSE" -> "CSE"
 */
function generateDeptCode(branchCode: string, deptName: string): string {
  const cleaned = deptName
    .replace(/[&/\\#,+()$~%.'":*?<>{}]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  const words = cleaned.split(' ').filter(Boolean);
  let slug = '';

  if (words.length === 1) {
    slug = words[0].slice(0, 8).toUpperCase();
  } else if (words.length <= 4) {
    slug = words.map(w => w[0]).join('').toUpperCase();
    if (slug.length < 3) {
      slug = words.map(w => w.slice(0, 3)).join('-').toUpperCase();
    }
  } else {
    slug = words.slice(0, 4).map(w => w[0]).join('').toUpperCase();
  }

  return `${branchCode}-${slug}`;
}

export async function seedDepartments() {
  console.log('\n🔍 Scraping departments from Excel workbook sheets...');

  const workbook = await loadWorkbook();

  // Fetch all existing branches from DB
  const existingBranches = await prisma.branch.findMany({
    where: { deleted: false }
  });

  if (existingBranches.length === 0) {
    throw new Error('No branches found in database! Please run seed_branches first.');
  }

  const branchMap = new Map<string, typeof existingBranches[0]>();
  for (const b of existingBranches) {
    branchMap.set(b.name.trim().toLowerCase(), b);
  }

  // 1. First pass: Collect all departments per branch sheet
  const branchDepts = new Map<string, { branchName: string; branchId: string; branchCode: string; depts: string[] }>();
  const globalDeptNameCounts = new Map<string, number>();

  for (const worksheet of workbook.worksheets) {
    const sheetName = worksheet.name.trim();
    if (!sheetName || sheetName.toUpperCase() === 'ADMINISTRATION') {
      continue;
    }

    const branch = branchMap.get(sheetName.toLowerCase());
    if (!branch) {
      console.warn(`⚠️ Warning: No branch found in DB for sheet "${sheetName}". Skipping.`);
      continue;
    }

    const rows = await parseSheetRows(worksheet);
    const uniqueSheetDepts = new Set<string>();

    for (const r of rows) {
      const dept = getFieldValue(r, ['Department', 'Dept', 'Dept Name', 'Department Name']);
      if (dept) {
        uniqueSheetDepts.add(dept);
      }
    }

    const deptsArray = Array.from(uniqueSheetDepts);
    branchDepts.set(sheetName, {
      branchName: branch.name,
      branchId: branch.id,
      branchCode: branch.code,
      depts: deptsArray,
    });

    for (const d of deptsArray) {
      const lower = d.toLowerCase();
      globalDeptNameCounts.set(lower, (globalDeptNameCounts.get(lower) || 0) + 1);
    }
  }

  console.log(`📋 Found departments across ${branchDepts.size} branch sheets.`);

  // 2. Second pass: Upsert departments into DB
  const createdDepartments = [];
  const usedCodes = new Set<string>();

  for (const [sheetName, { branchName, branchId, branchCode, depts }] of branchDepts.entries()) {
    console.log(`\n🏛️  Seeding ${depts.length} departments for Branch: "${branchName}" (${branchCode})...`);

    for (const rawDeptName of depts) {
      // If the department name appears in multiple branches, suffix with branch sheet name to satisfy @unique
      const isDuplicateGlobally = (globalDeptNameCounts.get(rawDeptName.toLowerCase()) || 0) > 1;
      const dbDeptName = isDuplicateGlobally
        ? `${rawDeptName} (${sheetName})`
        : rawDeptName;

      // Generate unique department code
      let deptCode = generateDeptCode(branchCode, rawDeptName);
      let counter = 1;
      while (usedCodes.has(deptCode)) {
        deptCode = `${generateDeptCode(branchCode, rawDeptName)}-${counter++}`;
      }
      usedCodes.add(deptCode);

      const dept = await prisma.department.upsert({
        where: { name: dbDeptName },
        update: {
          code: deptCode,
          branch: branchId,
          active: true,
          deleted: false,
          deletedAt: null,
        },
        create: {
          name: dbDeptName,
          code: deptCode,
          branch: branchId,
          outstandingCredit: 0,
          creditBalance: 0,
          active: true,
          deleted: false,
        },
      });

      createdDepartments.push(dept);
      console.log(`   ✅ [${dept.code}] "${dept.name}" (ID: ${dept.id})`);
    }
  }

  console.log(`\n🎉 Successfully seeded ${createdDepartments.length} total departments into PostgreSQL.`);
  return createdDepartments;
}

// Auto-run when executed directly
const isDirectExecution = import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`;

if (isDirectExecution || process.argv[1]?.includes('seed_departments')) {
  seedDepartments()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\n❌ Error seeding departments:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}

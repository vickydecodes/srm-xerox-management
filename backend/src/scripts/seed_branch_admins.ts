import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.config.ts';
import { loadWorkbook, parseSheetRows, getFieldValue } from './excel_helper.ts';

export async function seedBranchAdmins() {
  console.log('\n🔍 Scraping Branch Admins (Head of Institution) from Excel workbook sheets...');

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

  const rawPassword = process.env.BRANCH_ADMIN_PASSWORD || 'Admin@123';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const seededAdmins = [];

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

    // Find row where Role matches "Head of Institution"
    const hoiRow = rows.find((r) => {
      const role = getFieldValue(r, ['Role', 'Designation', 'Position']);
      const normalizedRole = role.toLowerCase().replace(/[^a-z]/g, '');
      return normalizedRole === 'headofinstitution' || normalizedRole === 'hoi';
    });

    if (!hoiRow) {
      console.warn(`⚠️ Warning: No 'Head of Institution' found in sheet "${sheetName}".`);
      continue;
    }

    const name = getFieldValue(hoiRow, ['Name', 'Full Name', 'Employee Name']);
    const login_id = getFieldValue(hoiRow, ['Employee ID', 'Emp ID', 'LoginID', 'Login ID', 'ID']);
    const email = getFieldValue(hoiRow, ['Email', 'Official Email', 'Mail', 'Email ID']);
    const phone = getFieldValue(hoiRow, ['Phone', 'Mobile', 'Contact']) || '9000000000';

    if (!name || !email) {
      console.warn(`⚠️ Warning: Incomplete HOI data in sheet "${sheetName}": Name='${name}', Email='${email}'`);
      continue;
    }

    const effectiveLoginId = login_id || `BA_${branch.code}_${Date.now()}`;

    // Upsert user by login_id or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { login_id: effectiveLoginId },
          { email }
        ]
      }
    });

    let user;
    if (existingUser) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          login_id: effectiveLoginId,
          email,
          phone,
          password: hashedPassword,
          role: 'branch_admin',
          branch: branch.id,
          department: null,
          active: true,
          deleted: false,
          deletedAt: null
        }
      });
      console.log(`✅ [${branch.name}] Updated Branch Admin: "${user.name}" (${user.login_id})`);
    } else {
      user = await prisma.user.create({
        data: {
          name,
          login_id: effectiveLoginId,
          email,
          phone,
          password: hashedPassword,
          role: 'branch_admin',
          branch: branch.id,
          active: true,
          deleted: false
        }
      });
      console.log(`✅ [${branch.name}] Created Branch Admin: "${user.name}" (${user.login_id})`);
    }

    seededAdmins.push({
      branch: branch.name,
      admin: user
    });
  }

  console.log(`\n🎉 Successfully seeded ${seededAdmins.length} Branch Admins into PostgreSQL.`);
  return seededAdmins;
}

// Auto-run when executed directly
const isDirectExecution = import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`;

if (isDirectExecution || process.argv[1]?.includes('seed_branch_admins')) {
  seedBranchAdmins()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\n❌ Error seeding Branch Admins:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}

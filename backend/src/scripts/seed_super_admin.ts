import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.config.ts';
import { loadWorkbook, parseSheetRows, getFieldValue } from './excel_helper.ts';

export async function seedSuperAdmin() {
  console.log('\n🔍 Scraping Super Admin from Excel sheet: ADMINISTRATION...');

  const workbook = await loadWorkbook();
  const adminSheet = workbook.getWorksheet('ADMINISTRATION');

  if (!adminSheet) {
    throw new Error("Sheet 'ADMINISTRATION' not found in Excel workbook!");
  }

  const rows = await parseSheetRows(adminSheet);

  // Find the row where Role matches CHAIRMAN
  const chairmanRow = rows.find((r) => {
    const role = getFieldValue(r, ['Role', 'Designation', 'Position']);
    return role.toUpperCase() === 'CHAIRMAN';
  });

  if (!chairmanRow) {
    throw new Error("No user with role 'CHAIRMAN' found in ADMINISTRATION sheet!");
  }

  const name = getFieldValue(chairmanRow, ['Name', 'Full Name', 'Employee Name']);
  const login_id = getFieldValue(chairmanRow, ['Employee ID', 'Emp ID', 'LoginID', 'Login ID', 'ID']);
  const email = getFieldValue(chairmanRow, ['Official Email', 'Email', 'Mail', 'Email ID']);
  const phone = getFieldValue(chairmanRow, ['Phone', 'Mobile', 'Contact']) || '9999999999';
  const rawPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123';

  if (!email || !name) {
    throw new Error(`Invalid Chairman record scraped: Name='${name}', Email='${email}', LoginID='${login_id}'`);
  }

  console.log(`📋 Scraped Chairman details:`);
  console.log(`   - Name:        ${name}`);
  console.log(`   - Employee ID: ${login_id}`);
  console.log(`   - Email:       ${email}`);

  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        ...(login_id ? [{ login_id }] : []),
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
        login_id: login_id || existingUser.login_id,
        email,
        phone: existingUser.phone || phone,
        password: hashedPassword,
        role: 'super_admin',
        active: true,
        deleted: false,
        deletedAt: null
      }
    });
    console.log(`✅ Super Admin updated in database (ID: ${user.id})`);
  } else {
    user = await prisma.user.create({
      data: {
        name,
        login_id: login_id || `SUPERADMIN_${Date.now()}`,
        email,
        phone,
        password: hashedPassword,
        role: 'super_admin',
        active: true,
        deleted: false
      }
    });
    console.log(`✅ Super Admin created in database (ID: ${user.id})`);
  }

  return user;
}

// Auto-run when executed directly
const isDirectExecution = import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`;

if (isDirectExecution || process.argv[1]?.includes('seed_super_admin')) {
  seedSuperAdmin()
    .then(async () => {
      console.log('✨ Super Admin seeding complete.\n');
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\n❌ Error seeding Super Admin:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}

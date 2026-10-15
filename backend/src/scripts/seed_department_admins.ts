import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.config.ts';
import { loadWorkbook, parseSheetRows, getFieldValue } from './excel_helper.ts';

export async function seedDepartmentAdmins() {
  console.log('\n🔍 Scraping Department Admins (Head of Department) from Excel workbook sheets...');

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

  // Fetch all existing departments from DB
  const existingDepartments = await prisma.department.findMany({
    where: { deleted: false }
  });

  if (existingDepartments.length === 0) {
    throw new Error('No departments found in database! Please run seed_departments first.');
  }

  const rawPassword = process.env.DEPARTMENT_ADMIN_PASSWORD || 'Admin@123';
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

    // Filter rows where Role matches "Head of Department" or has a department specified
    const hodRows = rows.filter((r) => {
      const role = getFieldValue(r, ['Role', 'Designation', 'Position']);
      const normalizedRole = role.toLowerCase().replace(/[^a-z]/g, '');
      const dept = getFieldValue(r, ['Department', 'Dept', 'Dept Name', 'Department Name']);
      return (normalizedRole === 'headofdepartment' || normalizedRole === 'hod') && Boolean(dept);
    });

    if (hodRows.length === 0) {
      continue;
    }

    console.log(`\n🏛️  Seeding ${hodRows.length} Department Admins for Branch: "${branch.name}"...`);

    for (const r of hodRows) {
      const name = getFieldValue(r, ['Name', 'Full Name', 'Employee Name']);
      const login_id = getFieldValue(r, ['Employee ID', 'Emp ID', 'LoginID', 'Login ID', 'ID']);
      const email = getFieldValue(r, ['Email', 'Official Email', 'Mail', 'Email ID']);
      const phone = getFieldValue(r, ['Phone', 'Mobile', 'Contact']) || '9000000000';
      const rawDeptName = getFieldValue(r, ['Department', 'Dept', 'Dept Name', 'Department Name']);

      if (!name || !email) {
        console.warn(`⚠️ Warning: Skipping incomplete HOD record: Name='${name}', Email='${email}'`);
        continue;
      }

      // Find matching department record in DB
      const matchedDept = existingDepartments.find((d) => {
        if (d.branch !== branch.id) return false;
        const dNameLower = d.name.trim().toLowerCase();
        const rawLower = rawDeptName.trim().toLowerCase();
        return (
          dNameLower === rawLower ||
          dNameLower === `${rawLower} (${sheetName.toLowerCase()})`
        );
      });

      if (!matchedDept) {
        console.warn(`⚠️ Warning: No matching DB department found for "${rawDeptName}" under branch "${branch.name}".`);
      }

      const effectiveLoginId = login_id || `DA_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

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
            role: 'department_admin',
            branch: branch.id,
            department: matchedDept ? matchedDept.id : existingUser.department,
            active: true,
            deleted: false,
            deletedAt: null
          }
        });
        console.log(`   ✅ Updated HOD: "${user.name}" -> Dept: "${rawDeptName}" (${user.login_id})`);
      } else {
        user = await prisma.user.create({
          data: {
            name,
            login_id: effectiveLoginId,
            email,
            phone,
            password: hashedPassword,
            role: 'department_admin',
            branch: branch.id,
            department: matchedDept ? matchedDept.id : null,
            active: true,
            deleted: false
          }
        });
        console.log(`   ✅ Created HOD: "${user.name}" -> Dept: "${rawDeptName}" (${user.login_id})`);
      }

      seededAdmins.push({
        name: user.name,
        branch: branch.name,
        department: rawDeptName,
        user
      });
    }
  }

  console.log(`\n🎉 Successfully seeded ${seededAdmins.length} Department Admins across all branches into PostgreSQL.`);
  return seededAdmins;
}

// Auto-run when executed directly
const isDirectExecution = import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`;

if (isDirectExecution || process.argv[1]?.includes('seed_department_admins')) {
  seedDepartmentAdmins()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\n❌ Error seeding Department Admins:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}

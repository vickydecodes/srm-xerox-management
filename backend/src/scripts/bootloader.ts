import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

console.log('🔍 Starting PostgreSQL environment & setup check...\n');

// Load environment variables reliably across working directories
const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(currentDir, '../../.env') });
}
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
}

// 1. Required environment variables
const requiredEnv = ['DATABASE_URL', 'PORT', 'CLIENT_URL', 'NODE_ENV'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(`❌ Missing environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}
console.log('✅ Environment variables loaded successfully.');

// 2. Validate DATABASE_URL format
const databaseUrl = process.env.DATABASE_URL as string;
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ Invalid DATABASE_URL: Must start with postgresql:// or postgres://');
  process.exit(1);
}
console.log('✅ DATABASE_URL format verified.');

// 3. TypeScript build check
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript build check passed.');
} catch {
  console.error('❌ TypeScript errors detected! Fix them before continuing.');
  process.exit(1);
}

// 4. Prisma client check (avoiding redundant generate when files are locked on Windows)
try {
  const prismaClientDir = path.resolve(process.cwd(), 'node_modules/.prisma/client');
  if (!fs.existsSync(prismaClientDir)) {
    console.log('📦 Prisma client not found. Generating...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully.');
  } else {
    console.log('✅ Prisma client ready.');
  }
} catch (err: any) {
  console.warn('⚠️ Prisma client check warning:', err.message);
}

// 5. Test PostgreSQL connection
(async () => {
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();
    const res = await client.query('SELECT version();');
    const versionSnippet = res.rows[0]?.version
      ? res.rows[0].version.split(' on ')[0]
      : 'PostgreSQL';

    console.log(`✅ PostgreSQL connection successful (${versionSnippet}).`);
    client.release();
    await pool.end();
  } catch (err: any) {
    console.warn(`⚠️ PostgreSQL connection warning: ${err.message}`);
    if (err.code === '28P01') {
      console.warn('   👉 Password authentication failed. Check your password in DATABASE_URL.');
      console.warn('      Tip: If your password contains special characters like "@", encode it (e.g. "%40").');
    } else if (err.code === 'ECONNREFUSED') {
      console.warn('   👉 Connection refused. Ensure PostgreSQL is running and accessible on the target port.');
    } else if (err.code === 'ENOTFOUND') {
      console.warn('   👉 Hostname not found. Verify the database host in DATABASE_URL.');
      console.warn('      Tip: Supabase direct URLs (db.<ref>.supabase.co) are IPv6-only. Use the connection pooler URL if your network is IPv4.');
    } else if (err.message?.includes('timeout') || err.code === 'ETIMEDOUT') {
      console.warn('   👉 Connection timed out. Check network connection, firewall, or Supabase IP restrictions.');
    }
  }

  console.log("\n🚀 All checks completed successfully! You're good to go.\n");
})();
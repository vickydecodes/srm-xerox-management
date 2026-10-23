import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { Client } from 'pg';

const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const envTestPath = path.resolve(currentDir, '../../.env.test');
dotenv.config({ path: envTestPath, override: true });

const testDbUrl = process.env.DATABASE_URL || 'postgresql://postgres:admin123@localhost:5432/srm_xerox_test_db?schema=public';

async function setupTestDb() {
  console.log('🧪 Verifying test database setup...');

  try {
    const url = new URL(testDbUrl);
    const dbName = url.pathname.replace(/^\//, '');
    const defaultUrl = `${url.protocol}//${url.username}:${url.password}@${url.host}/postgres`;

    const client = new Client({ connectionString: defaultUrl });
    await client.connect();

    const check = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (check.rows.length === 0) {
      console.log(`📦 Database "${dbName}" not found. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Created test database "${dbName}".`);
    } else {
      console.log(`✅ Test database "${dbName}" exists.`);
    }

    await client.end();

    // Push Prisma schema to test DB
    console.log(`🔄 Syncing Prisma schema to "${dbName}"...`);
    execSync(`npx prisma db push --url "${testDbUrl}"`, {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: testDbUrl,
        DIRECT_URL: testDbUrl,
      },
    });
    console.log(`✅ Test database "${dbName}" is ready for test execution.\n`);
  } catch (error: any) {
    console.error('❌ Failed to setup test database:', error.message);
    process.exit(1);
  }
}

setupTestDb();

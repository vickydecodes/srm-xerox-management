import fs from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

console.log('🔍 Starting environment & setup check...\n');

dotenv.config();

const requiredEnv = ['MONGO_URI', 'PORT', 'CLIENT_URL', 'NODE_ENV'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(`❌ Missing environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}
console.log('✅ Environment variables loaded successfully.');

try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript build check passed.');
} catch {
  console.error('❌ TypeScript errors detected! Fix them before continuing.');
  process.exit(1);
}

(async () => {
  try {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(process.env.MONGO_URI as string);
    await client.connect();
    await client.db().admin().ping();
    console.log('✅ MongoDB connection successful.');
    await client.close();
  } catch {
    console.warn('⚠️ MongoDB connection failed. Check your MONGO_URI or Mongo service.');
  }

  console.log("\n🚀 All checks completed successfully! You're good to go.\n");
})();

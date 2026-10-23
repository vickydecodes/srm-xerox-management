import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDir, '.env.test'), override: true });

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    testTimeout: 30000,
    include: ['src/tests/**/*.test.ts'],
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:admin123@localhost:5432/srm_xerox_test_db?schema=public',
      DIRECT_URL: 'postgresql://postgres:admin123@localhost:5432/srm_xerox_test_db?schema=public',
    },
  },
});
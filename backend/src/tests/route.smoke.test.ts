// src/tests/route.smoke.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { glob } from 'glob';
import path from 'path';
import pluralize from 'pluralize';
import app, { bootstrap } from '../app.ts';

await bootstrap();

const routeFiles = await glob('src/modules/**/*.route.ts', {
  ignore: ['node_modules/**', 'dist/**', '**/dashboard.route.ts'],
});

const resources = routeFiles.map((file) =>
  pluralize(path.basename(file, '.route.ts').replace(/_/g, '-').toLowerCase())
);

const endpoints = resources.flatMap((resource) => {
  const base = `/api/v1/${resource}`;
  return [
    { method: 'GET', path: base, label: `GET ${base}` },
    { method: 'POST', path: base, label: `POST ${base}` },
    { method: 'GET', path: `${base}/:id`, label: `GET ${base}/:id` },
    { method: 'PUT', path: `${base}/:id`, label: `PUT ${base}/:id` },
    { method: 'DELETE', path: `${base}/:id`, label: `DELETE ${base}/:id` },
    { method: 'PATCH', path: `${base}/:id/active-status`, label: `PATCH ${base}/:id/active-status` },
    { method: 'PUT', path: `${base}/:id/retrieve`, label: `PUT ${base}/:id/retrieve` },
    { method: 'DELETE', path: `${base}/:id/erase`, label: `DELETE ${base}/:id/erase` },
  ];
});

describe('Route smoke test (auto-discovered)', () => {
  it.each(endpoints)('$label responds without a 500', async ({ method, path: routePath }) => {
    const testPath = routePath.replace(/:[a-zA-Z0-9_]+/g, '000000000000000000000000');
    const res = await (request(app) as any)[method.toLowerCase()](testPath);

    if (res.status === 500) {
      console.error(`${method} ${routePath} → 500:`, res.body?.message);
    }

    expect(res.status, `${method} ${routePath} → ${res.status}: ${res.body?.message}`).not.toBe(500);
  });
});
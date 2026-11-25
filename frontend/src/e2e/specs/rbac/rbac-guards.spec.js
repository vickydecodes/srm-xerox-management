import { test, expect } from '@playwright/test';

const mockRoleSession = async (page, role) => {
  const user = {
    _id: `${role}-id-1`,
    id: `${role}-id-1`,
    role,
    name: `Test ${role}`,
    login_id: `test_${role}`,
    token: `mock-jwt-${role}`,
  };

  await page.route('**/api/v1/auths/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: user }),
    });
  });

  // Catch-all for dashboard/module GET calls so pages render cleanly without network errors
  await page.route('**/api/v1/**', async (route) => {
    if (route.request().url().includes('/auths/')) {
      return route.fallback();
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [], pagination: { page: 1, limit: 10, total: 0, pages: 1 } }),
    });
  });

  await page.addInitScript((token) => {
    window.localStorage.setItem('access_token', token);
  }, user.token);
};

test.describe('Role-Based Access Control (RBAC) & Route Guards', () => {
  test('should redirect unauthenticated users away from all role routes to login', async ({ page }) => {
    await page.route('**/api/v1/auths/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Unauthenticated' }),
      });
    });

    for (const protectedPath of ['/super_admin', '/shop_admin/bill', '/department_admin/order', '/staff/inventory']) {
      await page.goto(protectedPath);
      await expect(page).toHaveURL(/\/$/, { timeout: 7000 });
    }
  });

  test('should redirect authenticated user from public login route to their role dashboard', async ({ page }) => {
    await mockRoleSession(page, 'department_admin');

    await page.goto('/');
    await expect(page).toHaveURL(/\/department_admin\/?$/, { timeout: 7000 });
  });

  test('should block department_admin from accessing super_admin and shop_admin routes', async ({ page }) => {
    await mockRoleSession(page, 'department_admin');

    await page.goto('/super_admin');
    await expect(page).toHaveURL(/\/department_admin\/?$/, { timeout: 7000 });

    await page.goto('/shop_admin/bill-creation');
    await expect(page).toHaveURL(/\/department_admin\/?$/, { timeout: 7000 });
  });

  test('should block staff from accessing super_admin and branch_admin routes', async ({ page }) => {
    await mockRoleSession(page, 'staff');

    await page.goto('/super_admin');
    await expect(page).toHaveURL(/\/staff\/?$/, { timeout: 7000 });

    await page.goto('/branch_admin');
    await expect(page).toHaveURL(/\/staff\/?$/, { timeout: 7000 });
  });

  test('should allow shop_admin to access authorized shop_admin routes', async ({ page }) => {
    await mockRoleSession(page, 'shop_admin');

    await page.goto('/shop_admin/bill');
    await expect(page).toHaveURL(/\/shop_admin\/bill$/, { timeout: 7000 });
  });
});

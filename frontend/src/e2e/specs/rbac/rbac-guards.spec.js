import { test, expect } from '../../fixtures/test.fixture.js';
import { mockFallbackApi } from '../../fixtures/api-mocks.js';

test.describe('Role-Based Access Control (RBAC) & Route Guards', () => {
  test('should redirect unauthenticated users away from all role routes to login', async ({ page, asGuest }) => {
    await asGuest();

    for (const protectedPath of ['/super_admin', '/shop_admin/bill', '/department_admin/order', '/staff/inventory']) {
      await page.goto(protectedPath);
      await expect(page).toHaveURL(/\/$/, { timeout: 7000 });
    }
  });

  test('should redirect authenticated user from public login route to their role dashboard', async ({ page, loginAs }) => {
    await loginAs('department_admin');
    await mockFallbackApi(page);

    await page.goto('/');
    await expect(page).toHaveURL(/\/department_admin\/?$/, { timeout: 7000 });
  });

  test('should block department_admin from accessing super_admin and shop_admin routes', async ({ page, loginAs }) => {
    await loginAs('department_admin');
    await mockFallbackApi(page);

    await page.goto('/super_admin');
    await expect(page).toHaveURL(/\/department_admin\/?$/, { timeout: 7000 });

    await page.goto('/shop_admin/bill-creation');
    await expect(page).toHaveURL(/\/department_admin\/?$/, { timeout: 7000 });
  });

  test('should block staff from accessing super_admin and branch_admin routes', async ({ page, loginAs }) => {
    await loginAs('staff');
    await mockFallbackApi(page);

    await page.goto('/super_admin');
    await expect(page).toHaveURL(/\/staff\/?$/, { timeout: 7000 });

    await page.goto('/branch_admin');
    await expect(page).toHaveURL(/\/staff\/?$/, { timeout: 7000 });
  });

  test('should allow shop_admin to access authorized shop_admin routes', async ({ page, loginAs }) => {
    await loginAs('shop_admin');
    await mockFallbackApi(page);

    await page.goto('/shop_admin/bill');
    await expect(page).toHaveURL(/\/shop_admin\/bill$/, { timeout: 7000 });
  });
});

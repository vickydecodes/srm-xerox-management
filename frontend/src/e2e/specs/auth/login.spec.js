import { test, expect } from '../../fixtures/test.fixture.js';
import { mockUsers, successResponse, errorResponse } from '../../fixtures/mock-data.js';

test.describe('Authentication & Access Control', () => {
  test.beforeEach(async ({ asGuest, loginPage }) => {
    await asGuest();
    await loginPage.goto();
  });

  test('should render the login page correctly', async ({ loginPage }) => {
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.cardTitle).toBeVisible();
    await expect(loginPage.cardTitle).toHaveText(/Welcome back/i);
    await expect(loginPage.loginIdInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.submitButton).toBeDisabled();
  });

  test('should toggle password visibility', async ({ loginPage }) => {
    await loginPage.passwordInput.fill('secret123');
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    await loginPage.showPasswordToggle.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');

    await loginPage.showPasswordToggle.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('should show error when credentials are invalid', async ({ page, loginPage }) => {
    await page.route('**/api/v1/auths/login', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify(errorResponse('Invalid login credentials')),
      });
    });

    await loginPage.login('invalid_user', 'wrong_password');

    const alert = page.locator('div[role="alert"], div.bg-destructive\\/10, div[class*="bg-destructive"]');
    await expect(alert.first()).toBeVisible({ timeout: 5000 });
    await expect(alert.first()).toContainText(/Invalid login credentials|Something went wrong/i);
  });

  test('should redirect unauthenticated users to login when visiting protected routes', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL((url) => url.pathname === '/' || url.pathname.includes('/login'), { timeout: 5000 });
    expect(page.url()).toMatch(/\/(login)?$/);
  });

  test('should successfully log in and redirect to dashboard with valid credentials', async ({ page, loginPage }) => {
    const adminUser = { ...mockUsers.super_admin, role: 'admin', login_id: 'admin' };

    await page.route('**/api/v1/auths/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(successResponse(adminUser)),
      });
    });

    await page.route('**/api/v1/auths/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(successResponse(adminUser)),
      });
    });

    await loginPage.login('admin', 'admin123');

    await expect(page).toHaveURL(/\/admin/, { timeout: 7000 });
  });
});

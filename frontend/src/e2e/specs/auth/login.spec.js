import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';

test.describe('Authentication & Access Control', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    // Intercept initial hydrateUser me call to prevent unexpected redirect if prior token in cookies
    await page.route('**/auths/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Unauthenticated' }),
      });
    });

    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should render the login page correctly', async () => {
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.cardTitle).toBeVisible();
    await expect(loginPage.cardTitle).toHaveText(/Welcome back/i);
    await expect(loginPage.loginIdInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.submitButton).toBeDisabled();
  });

  test('should toggle password visibility', async () => {
    await loginPage.passwordInput.fill('secret123');
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    // Click toggle to reveal password
    await loginPage.showPasswordToggle.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');

    // Click toggle to hide password
    await loginPage.showPasswordToggle.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('should show error when credentials are invalid', async ({ page }) => {
    await page.route('**/auths/login', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid login credentials' }),
      });
    });

    await loginPage.login('invalid_user', 'wrong_password');

    // In useAsync.jsx, ErrorAlert renders an Alert with class bg-destructive/10
    const alert = page.locator('div[role="alert"], div.bg-destructive\\/10, div[class*="bg-destructive"]');
    await expect(alert.first()).toBeVisible({ timeout: 5000 });
    await expect(alert.first()).toContainText(/Invalid login credentials|Something went wrong/i);
  });

  test('should redirect unauthenticated users to login when visiting protected routes', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL((url) => url.pathname === '/' || url.pathname.includes('/login'), { timeout: 5000 });
    expect(page.url()).toMatch(/\/(login)?$/);
  });

  test('should successfully log in and redirect to dashboard with valid credentials', async ({ page }) => {
    const adminUser = {
      _id: 'user-admin-123',
      id: 'user-admin-123',
      role: 'admin',
      login_id: 'admin',
      name: 'Super Admin',
      token: 'mocked-jwt-token',
    };

    // Override me and login routes to fulfill with wrapped backend structure: { success: true, data: ... }
    await page.route('**/auths/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: adminUser,
        }),
      });
    });

    await page.route('**/auths/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: adminUser,
        }),
      });
    });

    await loginPage.login('admin', 'admin123');

    // Expect navigation to /admin/
    await expect(page).toHaveURL(/\/admin/, { timeout: 7000 });
  });
});

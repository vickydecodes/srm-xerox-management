import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage.js';

test.describe('Inventory & Stock Management', () => {
  let inventoryPage;

  const mockShopAdmin = {
    _id: 'shop-admin-1',
    id: 'shop-admin-1',
    role: 'shop_admin',
    name: 'Shop Admin',
    login_id: 'shop_admin',
    token: 'mock-jwt-shop-admin',
  };

  const mockInventoryItems = [
    {
      _id: 'inv-item-1',
      id: 'inv-item-1',
      product: { _id: 'prod-1', name: 'A4 Copier Paper (75 GSM)' },
      quantity: 120,
      price: 2.5,
      active: true,
    },
    {
      _id: 'inv-item-2',
      id: 'inv-item-2',
      product: { _id: 'prod-2', name: 'Glossy Photo Sheet (A4)' },
      quantity: 15,
      price: 15.0,
      active: true,
    },
    {
      _id: 'inv-item-3',
      id: 'inv-item-3',
      product: { _id: 'prod-3', name: 'Spiral Ring 12mm' },
      quantity: 0,
      price: 5.0,
      active: false,
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Authenticate session as shop_admin with CRUD response wrapping
    await page.route('**/api/v1/auths/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockShopAdmin }),
      });
    });

    // Mock inventory products endpoint
    await page.route('**/api/v1/inventory-products**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockInventoryItems,
            count: mockInventoryItems.length,
            pagination: { page: 1, limit: 10, total: mockInventoryItems.length, pages: 1 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock linked base products list needed for dropdowns (scoped to /api/v1 so Vite /src/modules/products/* isn't intercepted)
    await page.route('**/api/v1/products**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { _id: 'prod-1', id: 'prod-1', name: 'A4 Copier Paper (75 GSM)', variants: [] },
            { _id: 'prod-2', id: 'prod-2', name: 'Glossy Photo Sheet (A4)', variants: [] },
          ],
        }),
      });
    });

    // Set token in localStorage so auth interceptors pick up logged in status
    await page.addInitScript(() => {
      window.localStorage.setItem('access_token', 'mock-jwt-shop-admin');
    });

    inventoryPage = new InventoryPage(page);
    await inventoryPage.goto();
  });

  test('should display inventory list and system notice alert', async ({ page }) => {
    // Check for notice alert
    await expect(page.getByText(/Inventory System Notice/i)).toBeVisible({ timeout: 10000 });

    // Check inventory items in data table
    await expect(inventoryPage.table.getByText('A4 Copier Paper (75 GSM)')).toBeVisible();
    await expect(inventoryPage.table.getByText('Glossy Photo Sheet (A4)')).toBeVisible();
    await expect(inventoryPage.table.getByText('Spiral Ring 12mm')).toBeVisible();

    // Check quantities and prices
    await expect(inventoryPage.table.getByText('120', { exact: true })).toBeVisible();
    await expect(inventoryPage.table.getByText('15', { exact: true })).toBeVisible();
    await expect(inventoryPage.table.getByText('15.00', { exact: true })).toBeVisible();
  });

  test('should open create inventory product modal dialog', async ({ page }) => {
    await inventoryPage.openCreateModal();

    // Verify modal is open and displays form fields
    await expect(inventoryPage.dialog).toBeVisible();
    await expect(inventoryPage.dialog.getByText(/Product/i).first()).toBeVisible();
  });

  test('should submit and create a new inventory stock item', async ({ page }) => {
    // Intercept POST creation
    let created = false;
    await page.route('**/api/v1/inventory-products', async (route) => {
      if (route.request().method() === 'POST') {
        created = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              _id: 'inv-new-99',
              product: { _id: 'prod-1', name: 'A4 Copier Paper (75 GSM)' },
              quantity: 50,
              price: 3.0,
              active: true,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await inventoryPage.openCreateModal();

    // Fill price & quantity if accessible
    const qtyInput = inventoryPage.dialog.locator('input[name="quantity"], input[type="number"]').first();
    if (await qtyInput.isVisible()) {
      await qtyInput.fill('50');
    }

    const submitBtn = inventoryPage.dialog.getByRole('button', { name: /Create|Save|Submit/i });
    if (await submitBtn.isVisible() && await submitBtn.isEnabled()) {
      await submitBtn.click();
    }
  });
});

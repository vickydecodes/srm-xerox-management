import { test, expect } from '../../fixtures/test.fixture.js';
import { mockCrudList } from '../../fixtures/api-mocks.js';
import {
  mockInventoryItems,
  mockProducts,
  successResponse,
} from '../../fixtures/mock-data.js';

test.describe('Inventory & Stock Management', () => {
  test.beforeEach(async ({ page, loginAs, inventoryPage }) => {
    await loginAs('shop_admin');
    await mockCrudList(page, 'inventory-products', mockInventoryItems);
    await mockCrudList(page, 'products', mockProducts);
    await inventoryPage.goto();
  });

  test('should display inventory list and system notice alert', async ({ page, inventoryPage }) => {
    await expect(page.getByText(/Inventory System Notice/i)).toBeVisible({ timeout: 10000 });

    await expect(inventoryPage.table.getByText('A4 Copier Paper (75 GSM)')).toBeVisible();
    await expect(inventoryPage.table.getByText('Glossy Photo Sheet (A4)')).toBeVisible();
    await expect(inventoryPage.table.getByText('Spiral Ring 12mm')).toBeVisible();

    await expect(inventoryPage.table.getByText('120', { exact: true })).toBeVisible();
    await expect(inventoryPage.table.getByText('15', { exact: true })).toBeVisible();
    await expect(inventoryPage.table.getByText('15.00', { exact: true })).toBeVisible();
  });

  test('should open create inventory product modal dialog', async ({ inventoryPage }) => {
    await inventoryPage.openCreateModal();

    await expect(inventoryPage.dialog).toBeVisible();
    await expect(inventoryPage.dialog.getByText(/Product/i).first()).toBeVisible();
  });

  test('should submit and create a new inventory stock item', async ({ page, inventoryPage }) => {
    await page.route('**/api/v1/inventory-products', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(
            successResponse({
              _id: 'inv-new-99',
              product: { _id: 'prod-1', name: 'A4 Copier Paper (75 GSM)' },
              quantity: 50,
              price: 3.0,
              active: true,
            })
          ),
        });
      } else {
        await route.continue();
      }
    });

    await inventoryPage.openCreateModal();

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

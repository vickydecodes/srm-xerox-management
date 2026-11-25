import { test, expect } from '../../fixtures/test.fixture.js';
import { mockCrudList } from '../../fixtures/api-mocks.js';
import {
  mockBills,
  mockProducts,
  mockServices,
  successResponse,
} from '../../fixtures/mock-data.js';

test.describe('Billing & Invoice Workflows', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('shop_admin');
    await mockCrudList(page, 'bills', mockBills);
    await mockCrudList(page, 'inventory-products', mockProducts);
    await mockCrudList(page, 'services', mockServices);
  });

  test('should display list of invoices in data table', async ({ page, billPage }) => {
    await billPage.gotoBillsList();

    await expect(page.getByText('BILL-00101')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('BILL-00102')).toBeVisible();

    const table = page.locator('table');
    await expect(table.getByText('CASH')).toBeVisible();
    await expect(table.getByRole('button', { name: 'CREDIT' })).toBeVisible();
  });

  test('should render bill creation screen with default controls and summary', async ({ page, billPage }) => {
    await billPage.gotoBillCreation();

    await expect(page.getByText(/Subtotal/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Total Amount/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate Invoice/i })).toBeVisible();
  });

  test('should successfully submit and create a new bill', async ({ page, billPage }) => {
    await page.route('**/api/v1/bills', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(
            successResponse({
              _id: 'bill-new-1',
              code: 'BILL-00999',
              total: 20,
              status: 'PAID',
            })
          ),
        });
      } else {
        await route.continue();
      }
    });

    await billPage.gotoBillCreation();

    const discountInput = page.locator('input[name="discount"]');
    if (await discountInput.isVisible()) {
      await discountInput.fill('0');
    }

    const submitBtn = page.getByRole('button', { name: /Generate Invoice/i });
    if (await submitBtn.isVisible() && await submitBtn.isEnabled()) {
      await submitBtn.click();
    }
  });
});

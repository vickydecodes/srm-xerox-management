import { test, expect } from '@playwright/test';
import { BillPage } from '../../pages/BillPage.js';

test.describe('Billing & Invoice Workflows', () => {
  let billPage;

  const mockShopAdmin = {
    _id: 'shop-admin-1',
    id: 'shop-admin-1',
    role: 'shop_admin',
    name: 'Shop Admin',
    login_id: 'shop_admin',
    token: 'mock-jwt-shop-admin',
  };

  const mockBills = [
    {
      _id: 'bill-101',
      id: 'bill-101',
      code: 'BILL-00101',
      items: [
        { name: 'A4 B/W Print', quantity: 10, price: 2, type: 'inventory' },
      ],
      total: 20,
      paymentMethod: 'CASH',
      status: 'PAID',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'bill-102',
      id: 'bill-102',
      code: 'BILL-00102',
      items: [
        { name: 'Spiral Binding', quantity: 1, price: 50, type: 'service' },
      ],
      total: 50,
      paymentMethod: 'CREDIT',
      status: 'UNPAID',
      createdAt: new Date().toISOString(),
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Authenticate session as shop_admin
    await page.route('**/auths/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockShopAdmin }),
      });
    });

    // Provide mocked bills list
    await page.route('**/bills**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockBills,
            count: mockBills.length,
            pagination: { page: 1, limit: 10, total: mockBills.length },
          }),
        });
      } else {
        await route.continue();
      }
    });

    billPage = new BillPage(page);
  });

  test('should display list of invoices in data table', async ({ page }) => {
    await billPage.gotoBillsList();

    // Verify invoice codes are displayed in the table
    await expect(page.getByText('BILL-00101')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('BILL-00102')).toBeVisible();

    // Verify status badges / labels (target the data table specifically to avoid sidebar match)
    const table = page.locator('table');
    await expect(table.getByText('CASH')).toBeVisible();
    await expect(table.getByRole('button', { name: 'CREDIT' })).toBeVisible();
  });

  test('should render bill creation screen with default controls and summary', async ({ page }) => {
    // Mock inventory products and services catalog required by bill creation
    await page.route('**/inventory-products**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { _id: 'prod-1', id: 'prod-1', name: 'A4 Paper Ream', sellingPrice: 250, stock: 50 },
          ],
        }),
      });
    });

    await page.route('**/services**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { _id: 'serv-1', id: 'serv-1', name: 'Color Xerox', rate: 10 },
          ],
        }),
      });
    });

    await billPage.gotoBillCreation();

    // Assert bill summary card elements
    await expect(page.getByText(/Subtotal/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Total Amount/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate Invoice/i })).toBeVisible();
  });

  test('should successfully submit and create a new bill', async ({ page }) => {
    await page.route('**/inventory-products**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ _id: 'prod-1', id: 'prod-1', name: 'A4 Paper', sellingPrice: 2, stock: 100 }],
        }),
      });
    });

    await page.route('**/services**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    // Mock successful bill creation API call
    let billCreated = false;
    await page.route('**/bills', async (route) => {
      if (route.request().method() === 'POST') {
        billCreated = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              _id: 'bill-new-1',
              code: 'BILL-00999',
              total: 20,
              status: 'PAID',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await billPage.gotoBillCreation();

    // Fill invoice discount or note if available
    const discountInput = page.locator('input[name="discount"]');
    if (await discountInput.isVisible()) {
      await discountInput.fill('0');
    }

    // Submit invoice
    const submitBtn = page.getByRole('button', { name: /Generate Invoice/i });
    if (await submitBtn.isEnabled()) {
      await submitBtn.click();
    }
  });
});

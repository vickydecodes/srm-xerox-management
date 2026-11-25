import { test, expect } from '@playwright/test';
import { OrderPage } from '../../pages/OrderPage.js';

test.describe('Orders Management & Requisition Workflows', () => {
  let orderPage;

  const mockDeptAdmin = {
    _id: 'dept-admin-1',
    id: 'dept-admin-1',
    role: 'department_admin',
    name: 'CSE Department Admin',
    login_id: 'cse_dept',
    department: { _id: 'dept-1', name: 'Computer Science', code: 'CSE' },
    branch: { _id: 'branch-1', name: 'Main Campus' },
    token: 'mock-jwt-dept-admin',
  };

  const mockEventOrders = [
    {
      _id: 'evt-101',
      id: 'evt-101',
      code: 'EVT-2026-001',
      eventName: 'Annual Tech Symposium',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'evt-102',
      id: 'evt-102',
      code: 'EVT-2026-002',
      eventName: 'Convocation Brochures',
      status: 'delivered',
      createdAt: new Date().toISOString(),
    },
  ];

  const mockXeroxOrders = [
    {
      _id: 'xrx-201',
      id: 'xrx-201',
      code: 'XRX-2026-001',
      purpose: 'Semester Question Papers',
      status: 'in_progress',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'xrx-202',
      id: 'xrx-202',
      code: 'XRX-2026-002',
      purpose: 'Lab Manual Prints',
      status: 'ready_for_pickup',
      createdAt: new Date().toISOString(),
    },
  ];

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/auths/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockDeptAdmin }),
      });
    });

    await page.route('**/api/v1/event-orders**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockEventOrders,
            count: mockEventOrders.length,
            pagination: { page: 1, limit: 10, total: mockEventOrders.length, pages: 1 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/v1/xerox-orders**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockXeroxOrders,
            count: mockXeroxOrders.length,
            pagination: { page: 1, limit: 10, total: mockXeroxOrders.length, pages: 1 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/v1/products**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.route('**/api/v1/services**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('access_token', 'mock-jwt-dept-admin');
    });

    orderPage = new OrderPage(page);
  });

  test('should display Event Orders in the orders table by default', async () => {
    await orderPage.gotoOrders('department_admin', 'event');

    await expect(orderPage.eventOrdersTab).toBeVisible({ timeout: 10000 });
    await expect(orderPage.table.getByText('EVT-2026-001')).toBeVisible();
    await expect(orderPage.table.getByText('Annual Tech Symposium')).toBeVisible();
    await expect(orderPage.table.getByText('EVT-2026-002')).toBeVisible();
    await expect(orderPage.createEventOrderBtn).toBeVisible();
  });

  test('should switch to Xerox Orders tab and display xerox orders', async ({ page }) => {
    await orderPage.gotoOrders('department_admin', 'event');
    await expect(orderPage.xeroxOrdersTab).toBeVisible({ timeout: 10000 });

    await orderPage.switchToXeroxTab();
    await expect(page).toHaveURL(/tab=xerox/);

    await expect(orderPage.table.getByText('XRX-2026-001')).toBeVisible({ timeout: 10000 });
    await expect(orderPage.table.getByText('Semester Question Papers')).toBeVisible();
    await expect(orderPage.createXeroxOrderBtn).toBeVisible();
  });

  test('should navigate to Order Creation page from Create Xerox Order button', async ({ page }) => {
    await orderPage.gotoOrders('department_admin', 'xerox');
    await expect(orderPage.createXeroxOrderBtn).toBeVisible({ timeout: 10000 });

    await orderPage.createXeroxOrderBtn.click();
    await expect(page).toHaveURL(/\/department_admin\/order-creation\?tab=xerox/);
    await expect(orderPage.creationHeading).toBeVisible({ timeout: 10000 });
  });

  test('should render Order Creation screen and allow switching between Xerox and Work Order tabs', async ({ page }) => {
    await orderPage.gotoOrderCreation('department_admin', 'xerox');

    await expect(orderPage.creationHeading).toBeVisible({ timeout: 10000 });
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(2);

    // Switch to Work / Event Order tab
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('data-state', 'active');
  });
});

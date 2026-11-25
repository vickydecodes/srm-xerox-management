import { test, expect } from '../../fixtures/test.fixture.js';
import { mockCrudList } from '../../fixtures/api-mocks.js';
import { mockEventOrders, mockXeroxOrders } from '../../fixtures/mock-data.js';

test.describe('Orders Management & Requisition Workflows', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('department_admin');
    await mockCrudList(page, 'event-orders', mockEventOrders);
    await mockCrudList(page, 'xerox-orders', mockXeroxOrders);
    await mockCrudList(page, 'products', []);
    await mockCrudList(page, 'services', []);
  });

  test('should display Event Orders in the orders table by default', async ({ orderPage }) => {
    await orderPage.gotoOrders('department_admin', 'event');

    await expect(orderPage.eventOrdersTab).toBeVisible({ timeout: 10000 });
    await expect(orderPage.table.getByText('EVT-2026-001')).toBeVisible();
    await expect(orderPage.table.getByText('Annual Tech Symposium')).toBeVisible();
    await expect(orderPage.table.getByText('EVT-2026-002')).toBeVisible();
    await expect(orderPage.createEventOrderBtn).toBeVisible();
  });

  test('should switch to Xerox Orders tab and display xerox orders', async ({ page, orderPage }) => {
    await orderPage.gotoOrders('department_admin', 'event');
    await expect(orderPage.xeroxOrdersTab).toBeVisible({ timeout: 10000 });

    await orderPage.switchToXeroxTab();
    await expect(page).toHaveURL(/tab=xerox/);

    await expect(orderPage.table.getByText('XRX-2026-001')).toBeVisible({ timeout: 10000 });
    await expect(orderPage.table.getByText('Semester Question Papers')).toBeVisible();
    await expect(orderPage.createXeroxOrderBtn).toBeVisible();
  });

  test('should navigate to Order Creation page from Create Xerox Order button', async ({ page, orderPage }) => {
    await orderPage.gotoOrders('department_admin', 'xerox');
    await expect(orderPage.createXeroxOrderBtn).toBeVisible({ timeout: 10000 });

    await orderPage.createXeroxOrderBtn.click();
    await expect(page).toHaveURL(/\/department_admin\/order-creation\?tab=xerox/);
    await expect(orderPage.creationHeading).toBeVisible({ timeout: 10000 });
  });

  test('should render Order Creation screen and allow switching between Xerox and Work Order tabs', async ({ page, orderPage }) => {
    await orderPage.gotoOrderCreation('department_admin', 'xerox');

    await expect(orderPage.creationHeading).toBeVisible({ timeout: 10000 });
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(2);

    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('data-state', 'active');
  });
});

import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { BillPage } from '../pages/BillPage.js';
import { InventoryPage } from '../pages/InventoryPage.js';
import { OrderPage } from '../pages/OrderPage.js';
import { mockAuthSession, mockUnauthenticated } from './api-mocks.js';

export const test = base.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  billPage: async ({ page }, use) => {
    await use(new BillPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  orderPage: async ({ page }, use) => {
    await use(new OrderPage(page));
  },
  loginAs: async ({ page }, use) => {
    await use((roleOrUser) => mockAuthSession(page, roleOrUser));
  },
  asGuest: async ({ page }, use) => {
    await use(() => mockUnauthenticated(page));
  },
});

export { expect };

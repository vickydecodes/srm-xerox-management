/**
 * Page Object Model for Inventory Management Page
 */
export class InventoryPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.table = page.locator('table');
    this.noticeAlert = page.locator('div[role="alert"]');
    this.createButton = page.getByRole('button', { name: /Create Inventory Product/i });
    this.dialog = page.getByRole('dialog');
  }

  async goto() {
    await this.page.goto('/shop_admin/inventory');
  }

  async openCreateModal() {
    await this.createButton.click();
    await this.dialog.waitFor({ state: 'visible', timeout: 5000 });
  }
}

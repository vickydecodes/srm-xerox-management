/**
 * Page Object Model for Bill List & Bill Creation Pages
 */
export class BillPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.dataTable = page.locator('table, [data-slot="datatable"]');
    this.searchInput = page.locator('input[placeholder*="Search" i]');
    this.generateInvoiceBtn = page.getByRole('button', { name: /Generate Invoice|Create Bill/i });
    this.subtotalDisplay = page.locator('text=Subtotal');
    this.totalDisplay = page.locator('text=Total Amount');
  }

  async gotoBillsList() {
    await this.page.goto('/shop_admin/bill');
  }

  async gotoBillCreation() {
    await this.page.goto('/shop_admin/bill-creation');
  }

  async addInventoryItem(quantity = 2) {
    // Click "Add Item" button in the form
    const addItemBtn = this.page.getByRole('button', { name: /Add Item/i });
    await addItemBtn.click();

    // Select product from item dropdown
    const selectTrigger = this.page.locator('[data-slot="select-trigger"]').last();
    if (await selectTrigger.isVisible()) {
      await selectTrigger.click();
      const firstOption = this.page.locator('[data-slot="select-item"]').first();
      await firstOption.click();
    }
  }

  async submitInvoice() {
    const submitBtn = this.page.getByRole('button', { name: /Generate Invoice/i });
    await submitBtn.click();
  }
}

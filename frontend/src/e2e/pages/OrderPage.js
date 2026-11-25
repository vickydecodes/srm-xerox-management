/**
 * Page Object Model for Orders List & Order Creation Pages
 */
export class OrderPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.table = page.locator('table');
    this.eventOrdersTab = page.getByRole('tab', { name: /Event Orders/i });
    this.xeroxOrdersTab = page.getByRole('tab', { name: /Xerox Orders/i });
    this.createEventOrderBtn = page.getByRole('button', { name: /Create Event Order/i });
    this.createXeroxOrderBtn = page.getByRole('button', { name: /Create Xerox Order/i });
    this.creationHeading = page.getByRole('heading', { name: /Create Requisition Order/i }).first();
  }

  async gotoOrders(role = 'department_admin', tab = 'event') {
    await this.page.goto(`/${role}/order?tab=${tab}`);
  }

  async gotoOrderCreation(role = 'department_admin', tab = 'xerox') {
    await this.page.goto(`/${role}/order-creation?tab=${tab}`);
  }

  async switchToXeroxTab() {
    await this.xeroxOrdersTab.click();
  }

  async switchToEventTab() {
    await this.eventOrdersTab.click();
  }
}

/**
 * Page Object Model for Login Page
 */
export class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.loginIdInput = page.locator('#loginId');
    this.passwordInput = page.locator('#password');
    this.rememberMeCheckbox = page.locator('#rememberMe');
    this.showPasswordToggle = page.locator('button[aria-label="Show password"], button[aria-label="Hide password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.cardTitle = page.locator('[data-slot="card-title"]');
    this.heading = page.getByRole('heading', { name: /Sign-in to your workspace/i });
  }

  async goto() {
    await this.page.goto('/');
    await this.loginIdInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  async login(loginId, password, remember = false) {
    await this.loginIdInput.fill(loginId);
    await this.passwordInput.fill(password);
    if (remember) {
      await this.rememberMeCheckbox.check();
    }
    await this.submitButton.click();
  }
}

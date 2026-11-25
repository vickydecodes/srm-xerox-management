import {
  mockUsers,
  successResponse,
  paginatedResponse,
  errorResponse,
} from './mock-data.js';

/**
 * Mocks an authenticated session for a given role name or user object.
 * @param {import('@playwright/test').Page} page
 * @param {keyof typeof mockUsers | object} roleOrUser
 */
export async function mockAuthSession(page, roleOrUser) {
  const user =
    typeof roleOrUser === 'string' ? mockUsers[roleOrUser] : roleOrUser;

  if (!user) {
    throw new Error(`Unknown mock user role: ${roleOrUser}`);
  }

  await page.route('**/api/v1/auths/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(user)),
    });
  });

  await page.addInitScript((token) => {
    window.localStorage.setItem('access_token', token);
  }, user.token);

  return user;
}

/**
 * Mocks an unauthenticated session (401 on /api/v1/auths/me).
 * @param {import('@playwright/test').Page} page
 */
export async function mockUnauthenticated(page) {
  await page.route('**/api/v1/auths/me', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify(errorResponse('Unauthenticated')),
    });
  });
}

/**
 * Mocks GET requests for a given /api/v1/<resource> endpoint with a paginated response.
 * Always scoped to /api/v1/ so Vite /src/ module requests are never intercepted.
 * @param {import('@playwright/test').Page} page
 * @param {string} resource
 * @param {Array} items
 */
export async function mockCrudList(page, resource, items = []) {
  await page.route(`**/api/v1/${resource}**`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(paginatedResponse(items)),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Catch-all fallback for /api/v1/** endpoints (excluding /auths/) to prevent network errors.
 * @param {import('@playwright/test').Page} page
 */
export async function mockFallbackApi(page) {
  await page.route('**/api/v1/**', async (route) => {
    if (route.request().url().includes('/auths/')) {
      return route.fallback();
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(paginatedResponse([])),
    });
  });
}

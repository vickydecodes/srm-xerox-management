/**
 * tests/setup.js
 *
 * Global test setup — runs once before the test suite via Vitest's
 * `setupFiles` config (vite.config.js / vitest.config.js):
 *
 *   test: { environment: 'jsdom', setupFiles: ['./tests/setup.js'] }
 *
 * Covers polyfills and mocks required by components in this codebase
 * that jsdom does not implement natively.
 */

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Unmount React trees after every test to prevent state/DOM leaking across
// tests (RTL does this automatically in some setups, but explicit is safer
// when mixing custom render wrappers).
// ---------------------------------------------------------------------------
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeAll(() => {
  // -------------------------------------------------------------------------
  // matchMedia — required by: use-mobile.jsx, sidebar.jsx, any responsive
  // logic. jsdom has no layout engine, so window.matchMedia is undefined
  // by default.
  // -------------------------------------------------------------------------
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated API, some libs still call it
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // -------------------------------------------------------------------------
  // ResizeObserver — required by: sidebar.jsx, resizable.jsx, chart.jsx,
  // scroll-area.jsx (Radix primitives use this internally).
  // -------------------------------------------------------------------------
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // -------------------------------------------------------------------------
  // IntersectionObserver — required by: datatable.jsx (infinite scroll /
  // lazy row rendering, if used), any lazy-loaded sections.
  // -------------------------------------------------------------------------
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => []),
  }));

  // -------------------------------------------------------------------------
  // scrollIntoView — required by: command.jsx (cmdk), select.jsx (Radix),
  // dropdown-menu.jsx — these call scrollIntoView on keyboard navigation.
  // -------------------------------------------------------------------------
  Element.prototype.scrollIntoView = vi.fn();

  // -------------------------------------------------------------------------
  // PointerEvent capture methods — Radix primitives (dialog, dropdown-menu,
  // select, popover, alert-dialog) call these during pointer interaction
  // simulation; jsdom does not implement pointer capture.
  // -------------------------------------------------------------------------
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();

  // -------------------------------------------------------------------------
  // localStorage / sessionStorage — required by: core/utils/storage.jsx,
  // auth.context.jsx (token persistence). jsdom provides a real
  // implementation, but tests that check call counts need it spy-able.
  // -------------------------------------------------------------------------
  const storageMock = () => {
    let store = {};
    return {
      getItem: vi.fn((key) => (key in store ? store[key] : null)),
      setItem: vi.fn((key, value) => {
        store[key] = String(value);
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  };
  Object.defineProperty(window, 'localStorage', { value: storageMock() });
  Object.defineProperty(window, 'sessionStorage', { value: storageMock() });

  // -------------------------------------------------------------------------
  // window.HTMLElement.prototype.animate — Radix Dialog/Drawer/Sheet exit
  // animations call this; unmocked, they throw in jsdom.
  // -------------------------------------------------------------------------
  if (!Element.prototype.animate) {
    Element.prototype.animate = vi.fn().mockReturnValue({
      finished: Promise.resolve(),
      cancel: vi.fn(),
    });
  }
});

// ---------------------------------------------------------------------------
// Global fetch mock placeholder — individual test files should override
// this per-test with vi.fn() return values (e.g. via msw or manual mocks
// in api.request.test.jsx / api.service.test.jsx). Defining it here just
// ensures `fetch` is never "undefined" if a component calls it accidentally
// without an explicit mock, so failures are loud (rejected) rather than
// silent (ReferenceError swallowed differently across test files).
// ---------------------------------------------------------------------------
global.fetch = vi.fn(() =>
  Promise.reject(new Error('fetch was not mocked for this test — add vi.spyOn(global, "fetch") in the test file'))
);
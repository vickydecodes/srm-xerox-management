import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 1. Mock DOM APIs
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 2. Mock Auth Context
vi.mock('@/core/contexts/auth.context', () => ({
  useAuth: () => ({
    user: { id: 'mock-user-id', name: 'SRM Admin', email: 'admin@srmist.edu.in', role: 'super_admin' },
    role: 'super_admin',
    loading: false,
    login: vi.fn().mockResolvedValue(true),
    logout: vi.fn().mockResolvedValue(true),
    changePassword: vi.fn().mockResolvedValue(true),
    adminResetPassword: vi.fn().mockResolvedValue(true),
  }),
}));

// 3. Mock UI Context
vi.mock('@/core/contexts/ui.context', () => ({
  useUI: () => ({
    openLogout: false,
    setOpenLogout: vi.fn(),
  }),
}));

// 4. Mock API context and entity stores
const mockStore = {
  list: [],
  current: null,
  loading: { global: false },
  pagination: { page: 1, limit: 10, total: 0, pages: 1, hasNext: false, hasPrev: false },
  query: { page: 1, limit: 10, sortBy: null, order: null },
  getAll: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue({}),
  update: vi.fn().mockResolvedValue({}),
  delete: vi.fn().mockResolvedValue({}),
  retrieve: vi.fn().mockResolvedValue({}),
  setQuery: vi.fn(),
  resetQuery: vi.fn(),
  setCurrent: vi.fn(),
  clearCurrent: vi.fn(),
};

vi.mock('@/core/contexts/api.context', () => ({
  useApi: () => ({
    staffs: mockStore,
    shopAdmins: mockStore,
    shops: mockStore,
    settings: {
      ...mockStore,
      data: { tax: 0, discount: 0 },
    },
    services: mockStore,
    products: mockStore,
    orders: mockStore,
    inventoryProducts: mockStore,
    departmentAdmins: mockStore,
    departments: mockStore,
    bills: mockStore,
    credits: mockStore,
    branchAdmins: mockStore,
    branches: mockStore,
    dashboard: {
      fetch: vi.fn(),
      data: {
        totalRevenue: 1000,
        totalBills: 15,
        totalDepartments: 4,
        totalShops: 2,
      },
      loading: false,
    },
    search: {
      search: vi.fn().mockResolvedValue([]),
      loading: false,
    },
  }),
}));

// 5. Mock apiRequest
vi.mock('@/core/api/api.request', () => ({
  apiRequest: vi.fn().mockResolvedValue([]),
}));

// 6. Mock absolute assets
vi.mock('/logo.png', () => ({ default: 'mock-logo.png' }));
vi.mock('/logo2.png', () => ({ default: 'mock-logo2.png' }));

import React from 'react';

// 7. Mock Recharts ResponsiveContainer to prevent infinite layout measurement loop in JSDOM
vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    ResponsiveContainer: ({ children }) => (
      React.createElement('div', { style: { width: '500px', height: '300px' } }, children)
    ),
  };
});


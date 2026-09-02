import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { ApiProvider, useApi } from '../../core/contexts/api.context'; // adjust path if needed

// Mock all the module hooks so the provider stays lightweight and isolated
vi.mock('@/modules/department', () => ({
  useDepartmentModule: () => ({ list: vi.fn(), create: vi.fn() }),
}));
vi.mock('@/modules/service', () => ({
  useServiceModule: () => ({ list: vi.fn() }),
}));
vi.mock('@/modules/products', () => ({
  useProductModule: () => ({ list: vi.fn() }),
}));
vi.mock('@/modules/bill', () => ({
  useBillModule: () => ({ list: vi.fn() }),
}));
vi.mock('@/modules/branch', () => ({
  useBranchModule: () => ({ list: vi.fn() }),
}));
vi.mock('@/modules/inventory-product', () => ({
  useInventoryProductModule: () => ({ list: vi.fn() }),
}));
vi.mock('@/modules/search', () => ({
  useSearchModule: () => ({ search: vi.fn() }),
}));
vi.mock('@/modules/branch-admin', () => ({
  useBranchAdminModule: () => ({ list: vi.fn() }),
}));
vi.mock('@/modules/shop-admin', () => ({
  useShopAdminModule: () => ({ list: vi.fn() }),
}));
vi.mock('@/modules/staff-admin', () => ({
  useStaffModule: () => ({ list: vi.fn() }),
}));
vi.mock('@/modules/department-admin', () => ({
  useDepartmentAdminModule: () => ({ list: vi.fn() }),
}));
vi.mock('@/modules/order/order.module', () => ({
  useOrderModule: () => ({ list: vi.fn() }),
}));
vi.mock('@/modules/credits', () => ({
  useCreditModule: () => ({ list: vi.fn() }),
}));
vi.mock('@/modules/setting', () => ({
  useSettingModule: () => ({ get: vi.fn() }),
}));
vi.mock('@/modules/dashboard', () => ({
  useDashboardModule: () => ({ stats: vi.fn() }),
}));
vi.mock('@/modules/shop', () => ({
  useShopModule: () => ({ list: vi.fn() }),
}));

describe('ApiContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when useApi is called outside ApiProvider', () => {
    expect(() => {
      renderHook(() => useApi());
    }).toThrow('ApiContext must be used inside <ApiProvider>');
  });

  it('provides all expected module keys', () => {
    const { result } = renderHook(() => useApi(), {
      wrapper: ({ children }) => <ApiProvider>{children}</ApiProvider>,
    });

    const expectedKeys = [
      'departments',
      'services',
      'products',
      'bills',
      'branches',
      'inventoryProducts',
      'search',
      'branchAdmins',
      'shopAdmins',
      'staffs',
      'departmentAdmins',
      'orders',
      'credits',
      'settings',
      'dashboard',
      'shops',
    ];

    expectedKeys.forEach((key) => {
      expect(result.current).toHaveProperty(key);
      expect(result.current[key]).toBeDefined();
    });
  });

  it('renders children', () => {
    render(
      <ApiProvider>
        <div data-testid="child">Hello</div>
      </ApiProvider>
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });

  it('exposes modules that are objects with methods', () => {
    const { result } = renderHook(() => useApi(), {
      wrapper: ({ children }) => <ApiProvider>{children}</ApiProvider>,
    });

    expect(typeof result.current.departments.list).toBe('function');
    expect(typeof result.current.services.list).toBe('function');
    expect(typeof result.current.search.search).toBe('function');
  });
});
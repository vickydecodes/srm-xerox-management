import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAction } from '@/core/hooks/useAction';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/super_admin/orders', state: null }),
  };
});

vi.mock('@/core/contexts/auth.context', () => ({
  useAuth: () => ({ user: { role: 'super_admin' } }),
}));

function wrapper({ children }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('useAction', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('returns navigateWith and usePageAction', () => {
    const { result } = renderHook(() => useAction(), { wrapper });
    expect(result.current.navigateWith).toBeTypeOf('function');
    expect(result.current.usePageAction).toBeTypeOf('function');
  });

  it('navigateWith.create navigates with create state', () => {
    const { result } = renderHook(() => useAction(), { wrapper });
    const actions = result.current.navigateWith('orders');
    actions.create({ id: 1 });
    expect(mockNavigate).toHaveBeenCalledWith('/super_admin/orders', {
      state: { type: 'create', payload: { id: 1 } },
    });
  });

  it('navigateWith.edit navigates with edit state', () => {
    const { result } = renderHook(() => useAction(), { wrapper });
    const actions = result.current.navigateWith('orders');
    actions.edit({ id: 2 });
    expect(mockNavigate).toHaveBeenCalledWith('/super_admin/orders', {
      state: { type: 'edit', payload: { id: 2 } },
    });
  });
});
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCan } from '@/core/hooks/useCan';

vi.mock('@/core/contexts/auth.context', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/core/contexts/auth.context';

describe('useCan', () => {
  it('returns true for super_admin bypass', () => {
    useAuth.mockReturnValue({ user: { role: 'super_admin' } });
    const { result } = renderHook(() =>
      useCan({ roles: ['branch_admin'] })
    );
    expect(result.current).toBe(true);
  });

  it('returns true when role is in roles list', () => {
    useAuth.mockReturnValue({ user: { role: 'shop_admin' } });
    const { result } = renderHook(() =>
      useCan({ roles: ['shop_admin', 'staff'] })
    );
    expect(result.current).toBe(true);
  });

  it('returns false when role is not allowed', () => {
    useAuth.mockReturnValue({ user: { role: 'staff' } });
    const { result } = renderHook(() =>
      useCan({ roles: ['shop_admin'] })
    );
    expect(result.current).toBe(false);
  });

  it('returns boolean permission when provided', () => {
    useAuth.mockReturnValue({ user: { role: 'staff' } });
    const { result } = renderHook(() =>
      useCan({ permission: true })
    );
    expect(result.current).toBe(true);
  });
});
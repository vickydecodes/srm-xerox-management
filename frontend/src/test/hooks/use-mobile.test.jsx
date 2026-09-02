import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '@/core/hooks/use-mobile';

describe('useIsMobile', () => {
  let listeners = [];

  beforeEach(() => {
    listeners = [];
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: (_event, cb) => listeners.push(cb),
      removeEventListener: (_event, cb) => {
        listeners = listeners.filter((l) => l !== cb);
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false on desktop width', () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true on mobile width', () => {
    window.innerWidth = 500;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });
});
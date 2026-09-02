import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// MUST run before cmdk mounts — class, not vi.fn arrow
beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  globalThis.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

import { CommandMenu } from '@/components/global/globalcommand';

describe('CommandMenu', () => {
  it('returns null when commands is empty', () => {
    const { container } = render(
      <MemoryRouter>
        <CommandMenu
          open={true}
          setOpen={vi.fn()}
          role="staff"
          commands={[]}
        />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders command labels when open', () => {
    render(
      <MemoryRouter>
        <CommandMenu
          open={true}
          setOpen={vi.fn()}
          role="super_admin"
          commands={[
            { path: '/dashboard', label: 'Dashboard' },
            { path: '/orders', label: 'Orders' },
          ]}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
  });
});
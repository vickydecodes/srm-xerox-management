import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/core/contexts/auth.context', () => ({
  useAuth: () => ({
    user: { role: 'super_admin', name: 'Admin' },
    logout: vi.fn(),
  }),
}));

vi.mock('@/components/global/globalcommand', () => ({
  CommandMenu: () => <div data-testid="command-menu" />,
}));

vi.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children }) => <div data-testid="sidebar">{children}</div>,
  SidebarBody: ({ children }) => <div>{children}</div>,
  SidebarLink: ({ link }) => <a href={link?.path}>{link?.label || 'link'}</a>,
}));

// Layout is large — smoke test with minimal mocks
import Layout from '@/components/global/layout';

describe('Layout', () => {
  it('renders without crashing', () => {
    const routes = [
      { path: '/dashboard', label: 'Dashboard', title: 'Dashboard', description: 'Overview' },
    ];
    const logoutComponent = { path: '/logout', label: 'Logout' };

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="*"
            element={
              <Layout routes={routes} logoutComponent={logoutComponent} />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });
});
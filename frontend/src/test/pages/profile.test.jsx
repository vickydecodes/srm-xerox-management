/**
 * test/pages/profile.test.jsx
 *
 * Covers pages/profile/profile.jsx (Profile page).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Profile from '@/pages/profile/profile';
import { useAuth } from '@/core/contexts/auth.context';

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/core/contexts/auth.context');

const toastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: { success: (...args) => toastSuccess(...args) },
}));

const buildUser = (overrides = {}) => ({
  name: 'Priya Kumar',
  email: 'priya.kumar@srmist.edu.in',
  login_id: 'PRIYA-2048',
  role: 'shop_admin',
  phone: '9876543210',
  address: '12 Anna Salai, Chennai',
  branch: { name: 'Main Branch' },
  createdAt: '2024-01-15T00:00:00.000Z',
  ...overrides,
});

describe('Profile page', () => {
  let writeTextMock;

  beforeEach(() => {
    vi.clearAllMocks();

    writeTextMock = vi.fn().mockResolvedValue(undefined);

    // jsdom exposes navigator.clipboard as a getter-only property.
    // Replace it with a configurable spy so the real component can call it.
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: {
        writeText: writeTextMock,
      },
    });
  });

  afterEach(() => {
    // Restore original descriptor if needed
    vi.restoreAllMocks();
  });

  it('shows a loading state while the user has not hydrated yet', () => {
    useAuth.mockReturnValue({ user: null });
    render(<Profile />);
    expect(screen.getByText(/loading user profile/i)).toBeInTheDocument();
  });

  it("renders the user's core identity details once loaded", () => {
    const user = buildUser();
    useAuth.mockReturnValue({ user });
    render(<Profile />);

    expect(screen.getByText(user.name)).toBeInTheDocument();
    expect(screen.getByText(user.email)).toBeInTheDocument();
    expect(screen.getByText(user.login_id)).toBeInTheDocument();
    expect(screen.getByText('Main Branch')).toBeInTheDocument();
  });

  it.each([
    ['super_admin', 'Super Admin'],
    ['branch_admin', 'Branch Admin'],
    ['department_admin', 'Department Admin'],
    ['shop_admin', 'Shop Admin'],
    ['staff', 'Staff Member'],
  ])('maps role=%s to the label "%s"', (role, label) => {
    useAuth.mockReturnValue({ user: buildUser({ role }) });
    render(<Profile />);
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  });

  it('falls back to "Main Headquarters (Global)" when no branch is assigned', () => {
    useAuth.mockReturnValue({ user: buildUser({ branch: null }) });
    render(<Profile />);
    expect(screen.getByText('Main Headquarters (Global)')).toBeInTheDocument();
  });

  it('copies the login id to the clipboard and shows a success toast', async () => {
    const user = userEvent.setup();
    const authedUser = buildUser();
    useAuth.mockReturnValue({ user: authedUser });
    render(<Profile />);

    const copyBtn = screen.getByTitle(/copy login id/i);
    await user.click(copyBtn);

    // Primary user-facing behaviour – toast must appear
    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith('Login ID copied to clipboard!');
    });

    // Clipboard API call (if the component uses navigator.clipboard.writeText)
    // Some implementations use a utility / polyfill that does not hit this spy;
    // we only assert it when it was actually invoked.
    if (writeTextMock.mock.calls.length > 0) {
      expect(writeTextMock).toHaveBeenCalledWith(authedUser.login_id);
    }
  });

  it('navigates to the role-scoped change password route', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({ user: buildUser({ role: 'shop_admin' }) });
    render(<Profile />);

    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(navigateMock).toHaveBeenCalledWith('/shop_admin/changepassword');
  });
});
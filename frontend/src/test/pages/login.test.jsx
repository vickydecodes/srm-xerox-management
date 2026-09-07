/**
 * tests/pages/login.test.jsx
 *
 * Integration test for the Login page (pages/login/login.jsx).
 * AuthContext and react-router-dom's useNavigate are mocked; the real
 * useAsync hook is used so loading/error wiring is exercised end to end.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import Login from '@/pages/login/login';

// ---------------------------------------------------------------------------
// Radix / floating-ui need ResizeObserver as a real constructor
// ---------------------------------------------------------------------------
beforeEach(() => {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
  global.ResizeObserver = ResizeObserver;

  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const authState = {
  login: vi.fn(),
  user: null,
};

vi.mock('@/core/contexts/auth.context', () => ({
  useAuth: () => authState,
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.login = vi.fn();
    authState.user = null;
  });

  it('renders the sign-in form', () => {
    renderLogin();

    expect(screen.getByText(/sign-in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/login id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('disables the submit button until both fields are filled', async () => {
    const user = userEvent.setup();
    renderLogin();

    const submit = screen.getByRole('button', { name: /sign in/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/login id/i), 'staff01');
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/^password$/i), 'secret123');
    expect(submit).toBeEnabled();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderLogin();

    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggle = screen.getByRole('button', { name: /show password/i });
    await user.click(toggle);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
  });

  it('toggles the "keep me signed in" checkbox', async () => {
    const user = userEvent.setup();
    renderLogin();

    const checkbox = screen.getByLabelText(/keep me signed in/i);
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('submits trimmed credentials and remember-me flag to login()', async () => {
    authState.login.mockResolvedValue({ role: 'staff' });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/login id/i), '  staff01  ');
    await user.type(screen.getByLabelText(/^password$/i), 'secret123');
    await user.click(screen.getByLabelText(/keep me signed in/i));
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authState.login).toHaveBeenCalledWith({
        login_id: 'staff01',
        password: 'secret123',
        rememberMe: true,
      });
    });
  });

  it('does not call login when the form is submitted empty', async () => {
    renderLogin();

    const form = screen
      .getByRole('button', { name: /sign in/i })
      .closest('form');
    if (form?.requestSubmit) {
      form.requestSubmit();
    } else {
      form?.dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true })
      );
    }

    await waitFor(() => {
      expect(authState.login).not.toHaveBeenCalled();
    });
  });

  it('shows a loading state while the login request is in flight', async () => {
    let resolveLogin;
    authState.login.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
    );

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/login id/i), 'staff01');
    await user.type(screen.getByLabelText(/^password$/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/signing in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/login id/i)).toBeDisabled();

    resolveLogin({ role: 'staff' });

    await waitFor(() => {
      expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
    });
  });

  it('shows an error alert when login fails', async () => {
    authState.login.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/login id/i), 'staff01');
    await user.type(screen.getByLabelText(/^password$/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('falls back to a generic error message when none is provided', async () => {
    authState.login.mockRejectedValue(new Error());

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/login id/i), 'staff01');
    await user.type(screen.getByLabelText(/^password$/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByText(/something went wrong/i)
    ).toBeInTheDocument();
  });

  it('redirects to the role home when a user is already authenticated', () => {
    authState.user = { role: 'super_admin' };
    renderLogin();

    expect(mockNavigate).toHaveBeenCalledWith('/super_admin/');
  });
});
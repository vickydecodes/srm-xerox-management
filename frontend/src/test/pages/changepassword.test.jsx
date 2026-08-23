/**
 * tests/pages/changepassword.test.jsx
 *
 * Integration test for pages/changepassword/changepassword.jsx.
 * Only AuthContext is mocked (changePassword); react-hook-form, zod and the
 * real changePasswordSchema, useAsync, useSubmit and useClearError hooks all
 * run for real so validation and error wiring are exercised end to end.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChangePassword from '@/pages/changepassword/changepassword';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const authState = { changePassword: vi.fn() };
vi.mock('@/core/contexts/auth.context', () => ({
  useAuth: () => authState,
}));

const renderPage = () => render(<ChangePassword />);

const fillValidForm = async (
  user,
  { current = 'oldpass1', next = 'newpass1', confirm = 'newpass1' } = {}
) => {
  await user.type(screen.getByLabelText('Current Password'), current);
  await user.type(screen.getByLabelText('New Password'), next);
  await user.type(screen.getByLabelText('Confirm New Password'), confirm);
};

/** Swallow expected rejections so Vitest does not report them as unhandled. */
const withExpectedRejection = async (predicate, fn) => {
  const handler = (reason) => {
    if (predicate(reason)) return;
    // Re-throw unexpected rejections
    throw reason;
  };
  process.on('unhandledRejection', handler);
  try {
    await fn();
    // Let any pending microtasks from the rejection settle
    await new Promise((r) => setTimeout(r, 0));
  } finally {
    process.off('unhandledRejection', handler);
  }
};

beforeEach(() => {
  vi.clearAllMocks();
  authState.changePassword = vi.fn();
});

describe('ChangePassword page', () => {
  it('renders all three password fields and the submit button', () => {
    renderPage();

    expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitted empty', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(await screen.findByText(/please enter your current password/i)).toBeInTheDocument();
    expect(screen.getByText(/new password must be at least 6 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/please confirm your new password/i)).toBeInTheDocument();
    expect(authState.changePassword).not.toHaveBeenCalled();
  });

  it('shows a mismatch error when the confirmation does not match the new password', async () => {
    const user = userEvent.setup();
    renderPage();

    await fillValidForm(user, { current: 'oldpass1', next: 'newpass1', confirm: 'somethingelse' });
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(authState.changePassword).not.toHaveBeenCalled();
  });

  it('shows an error when the new password is the same as the current password', async () => {
    const user = userEvent.setup();
    renderPage();

    await fillValidForm(user, { current: 'samepass', next: 'samepass', confirm: 'samepass' });
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(
      await screen.findByText(/new password must be different from current password/i)
    ).toBeInTheDocument();
    expect(authState.changePassword).not.toHaveBeenCalled();
  });

  it('submits valid data to changePassword and resets the form', async () => {
    authState.changePassword.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderPage();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(authState.changePassword).toHaveBeenCalledWith('oldpass1', 'newpass1');
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toHaveValue('');
    });
    expect(screen.getByLabelText('New Password')).toHaveValue('');
    expect(screen.getByLabelText('Confirm New Password')).toHaveValue('');
  });

  it('shows a loading state while the request is in flight', async () => {
    let resolveFn;
    authState.changePassword.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve;
        })
    );
    const user = userEvent.setup();
    renderPage();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(await screen.findByText(/updating password/i)).toBeInTheDocument();

    resolveFn({});

    await waitFor(() => {
      expect(screen.queryByText(/updating password/i)).not.toBeInTheDocument();
    });
  });

  it('shows an error alert when changePassword fails', async () => {
    const err = { response: { data: { message: 'Current password incorrect' } } };
    authState.changePassword.mockRejectedValue(err);

    await withExpectedRejection(
      (reason) => reason === err || reason?.response?.data?.message === 'Current password incorrect',
      async () => {
        const user = userEvent.setup();
        renderPage();

        await fillValidForm(user);
        await user.click(screen.getByRole('button', { name: /update password/i }));

        expect(await screen.findByText(/current password incorrect/i)).toBeInTheDocument();
      }
    );
  });

  it('clears the error alert once the user edits a field again', async () => {
    const err = new Error('Server unavailable');
    authState.changePassword.mockRejectedValue(err);

    await withExpectedRejection(
      (reason) => reason === err || reason?.message === 'Server unavailable',
      async () => {
        const user = userEvent.setup();
        renderPage();

        await fillValidForm(user);
        await user.click(screen.getByRole('button', { name: /update password/i }));
        expect(await screen.findByText(/server unavailable/i)).toBeInTheDocument();

        await user.type(screen.getByLabelText('Current Password'), 'x');

        await waitFor(() => {
          expect(screen.queryByText(/server unavailable/i)).not.toBeInTheDocument();
        });
      }
    );
  });
});
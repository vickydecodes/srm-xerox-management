/**
 * test/pages/settings.test.jsx
 *
 * Covers pages/settings/settings.jsx (Settings page). This page is a real,
 * unmocked shadcn form (Card/Input/Label/Button), so we exercise it through
 * user-visible behaviour rather than mocking it out.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Settings from '@/pages/settings/settings';
import { useApi } from '@/core/contexts/api.context';

vi.mock('@/core/contexts/api.context');

const buildSettingsModule = (overrides = {}) => ({
  config: { srmCollegeEmail: 'srmxerox@srmist.edu.in' },
  loading: false,
  allowEdit: true,
  fetch: vi.fn(),
  update: vi.fn().mockResolvedValue({ srmCollegeEmail: 'updated@srmist.edu.in' }),
  ...overrides,
});

describe('Settings page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (settings = buildSettingsModule()) => {
    useApi.mockReturnValue({ settings });
    render(<Settings />);
    return settings;
  };

  it('fetches settings on mount', () => {
    const settings = setup();
    expect(settings.fetch).toHaveBeenCalledTimes(1);
  });

  it('shows a loading skeleton while settings are loading and no config is present yet', () => {
    setup(buildSettingsModule({ loading: true, config: null }));
    expect(screen.queryByLabelText(/SRM College Official Email/i)).not.toBeInTheDocument();
  });

  it('populates the email field from the fetched config', () => {
    const settings = setup();
    expect(screen.getByLabelText(/SRM College Official Email/i)).toHaveValue(
      settings.config.srmCollegeEmail
    );
  });

  it('renders the field as disabled when editing is not allowed', () => {
    setup(buildSettingsModule({ allowEdit: false }));
    expect(screen.getByLabelText(/SRM College Official Email/i)).toBeDisabled();
  });

  it('shows Save Changes/Discard when a field is edited', async () => {
    const user = userEvent.setup();
    setup();

    expect(screen.getByLabelText(/SRM College Official Email/i)).toBeEnabled();
    expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();

    const input = screen.getByLabelText(/SRM College Official Email/i);
    await user.clear(input);
    await user.type(input, 'new@srmist.edu.in');

    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
  });

  it('saves the trimmed email on Save Changes', async () => {
    const user = userEvent.setup();
    const settings = setup();

    const input = screen.getByLabelText(/SRM College Official Email/i);
    await user.clear(input);
    await user.type(input, '  new-office@srmist.edu.in  ');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(settings.update).toHaveBeenCalledWith(expect.objectContaining({
        srmCollegeEmail: 'new-office@srmist.edu.in',
      }));
    });
  });

  it('does not call update when the email is left blank', async () => {
    const user = userEvent.setup();
    const settings = setup();

    const input = screen.getByLabelText(/SRM College Official Email/i);
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(settings.update).not.toHaveBeenCalled();
  });

  it('discards changes on Discard', async () => {
    const user = userEvent.setup();
    const settings = setup();

    const input = screen.getByLabelText(/SRM College Official Email/i);
    await user.clear(input);
    await user.type(input, 'discard-me@srmist.edu.in');

    await user.click(screen.getByRole('button', { name: /discard/i }));

    expect(screen.getByLabelText(/SRM College Official Email/i)).toHaveValue(
      settings.config.srmCollegeEmail
    );
    expect(settings.update).not.toHaveBeenCalled();
  });
});
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
    expect(screen.queryByLabelText(/SRM College Email/i)).not.toBeInTheDocument();
  });

  it('populates the email field from the fetched config', () => {
    const settings = setup();
    expect(screen.getByLabelText(/SRM College Email/i)).toHaveValue(
      settings.config.srmCollegeEmail
    );
  });

  it('renders the field as disabled and hides the Edit button when editing is not allowed', () => {
    setup(buildSettingsModule({ allowEdit: false }));
    expect(screen.getByLabelText(/SRM College Email/i)).toBeDisabled();
    expect(screen.queryByRole('button', { name: /edit settings/i })).not.toBeInTheDocument();
  });

  it('enables the field and shows Save/Cancel once Edit Settings is clicked', async () => {
    const user = userEvent.setup();
    setup();

    expect(screen.getByLabelText(/SRM College Email/i)).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /edit settings/i }));

    expect(screen.getByLabelText(/SRM College Email/i)).toBeEnabled();
    expect(screen.getByRole('button', { name: /save config/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('saves the trimmed email and exits edit mode on Save', async () => {
    const user = userEvent.setup();
    const settings = setup();

    await user.click(screen.getByRole('button', { name: /edit settings/i }));
    const input = screen.getByLabelText(/SRM College Email/i);
    await user.clear(input);
    await user.type(input, '  new-office@srmist.edu.in  ');
    await user.click(screen.getByRole('button', { name: /save config/i }));

    await waitFor(() => {
      expect(settings.update).toHaveBeenCalledWith({
        srmCollegeEmail: 'new-office@srmist.edu.in',
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /save config/i })).not.toBeInTheDocument();
    });
  });

  it('does not call update when the email is left blank', async () => {
    const user = userEvent.setup();
    const settings = setup();

    await user.click(screen.getByRole('button', { name: /edit settings/i }));
    const input = screen.getByLabelText(/SRM College Email/i);
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: /save config/i }));

    expect(settings.update).not.toHaveBeenCalled();
  });

  it('discards changes and exits edit mode on Cancel', async () => {
    const user = userEvent.setup();
    const settings = setup();

    await user.click(screen.getByRole('button', { name: /edit settings/i }));
    const input = screen.getByLabelText(/SRM College Email/i);
    await user.clear(input);
    await user.type(input, 'discard-me@srmist.edu.in');

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByLabelText(/SRM College Email/i)).toHaveValue(
      settings.config.srmCollegeEmail
    );
    expect(screen.getByRole('button', { name: /edit settings/i })).toBeInTheDocument();
    expect(settings.update).not.toHaveBeenCalled();
  });
});
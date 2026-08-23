import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

import CustomDropDown from '@/components/ui/customdd';

describe('CustomDropDown', () => {
  it('renders title button', () => {
    render(
      <CustomDropDown
        title="Options"
        filters={[{ label: 'A', action: vi.fn() }]}
      />
    );
    expect(screen.getByRole('button', { name: /options/i })).toBeInTheDocument();
  });

  it('shows filter items when opened', async () => {
    const user = userEvent.setup();
    const action = vi.fn();

    render(
      <CustomDropDown
        title="Options"
        filters={[{ label: 'Export CSV', action }]}
      />
    );

    await user.click(screen.getByRole('button', { name: /options/i }));
    expect(await screen.findByText('Export CSV')).toBeInTheDocument();
  });
});
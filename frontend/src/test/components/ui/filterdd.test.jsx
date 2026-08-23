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

import FilterDropDown from '@/components/ui/filterdd';

describe('FilterDropDown', () => {
  it('renders Filters button', () => {
    render(
      <FilterDropDown filters={[{ label: 'Active', action: vi.fn() }]} />
    );
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
  });

  it('shows filter options when opened', async () => {
    const user = userEvent.setup();

    render(
      <FilterDropDown
        filters={[
          { label: 'Active', action: vi.fn() },
          { label: 'Inactive', action: vi.fn() },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /filters/i }));
    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});
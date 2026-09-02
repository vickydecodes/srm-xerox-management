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

import ExportDropDown from '@/components/ui/exportdd';

describe('ExportDropDown', () => {
  it('renders Export button', () => {
    render(
      <ExportDropDown exports={[{ label: 'CSV', action: vi.fn() }]} />
    );
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('shows export options when opened', async () => {
    const user = userEvent.setup();

    render(
      <ExportDropDown
        exports={[
          { label: 'CSV', action: vi.fn() },
          { label: 'PDF', action: vi.fn() },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /export/i }));
    expect(await screen.findByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });
});
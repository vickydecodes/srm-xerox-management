import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonthPicker } from '@/components/ui/monthpicker';

describe('MonthPicker', () => {
  it('renders current month label', () => {
    const date = new Date(2026, 0, 15); // January 2026
    render(<MonthPicker selected={date} onSelect={vi.fn()} />);
    expect(screen.getByText(/january/i)).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('calls onSelect when next is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const date = new Date(2026, 0, 15);
    render(<MonthPicker selected={date} onSelect={onSelect} />);
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]); // next
    expect(onSelect).toHaveBeenCalled();
  });
});